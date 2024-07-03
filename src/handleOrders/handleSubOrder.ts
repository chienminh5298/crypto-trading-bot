import jsonbig from "json-bigint";
import { RootOrder, StopLoss, SubOrder, Token } from "@prisma/client";

import prisma from "@root/prisma/database";
import TargetStorage from "@src/classes/targetStorage";

import { logging, writeLog } from "@src/utils/log";
import { __payloadNewStoploss } from "@src/payload/binance";
import { cancelStoploss, newStoplossOrder } from "@src/api/binance";
import { calculateProfit, handleError, isCloseIntervalToken } from "@src/utils";

/* --------------------------------*
 * This function will set stoploss *
 *---------------------------------*/
export const newStoploss = async (stoploss: StopLoss, rootorder: RootOrder, token: Token) => {
    const orderToken = token.name + token.stable;

    const payload = __payloadNewStoploss({ token, rootorder, stoploss });
    const response = await newStoplossOrder(payload);

    if (response.status === 200) {
        const data = response.data;

        writeLog([`Open stoploss order successfully --- ${orderToken}`, data]);

        // Insert suborder
        const suborder = await insertSuborder({ data, rootorder, stoploss });

    } else {
        handleError(`Can't open new stoploss for root order id: ${rootorder.orderId} - stoploss id: ${stoploss.id} - handleSubOrder`, "error", [response]);
    }
};

const insertSuborder = async ({ data, rootorder, stoploss }: { data: any; rootorder: RootOrder; stoploss: StopLoss }): Promise<SubOrder> => {
    let qty = parseFloat(data.origQty);
    let orderId = jsonbig.stringify(data.orderId);
    let timestamp = data.updateTime;
    let markPrice = data.stopPrice;
    let budget = rootorder.budget * stoploss.qtyPercent;
    let side = data.side;
    let suborderRecord = await prisma.subOrder.create({
        data: {
            orderId,
            qty,
            budget,
            timestamp: timestamp.toString(),
            markPrice: parseFloat(markPrice),
            status: "ACTIVE",
            side,
            stopLossId: stoploss.id,
            rootOrderId: rootorder.id,
        },
    });
    return suborderRecord;
};

/* ----------------------------------*
 * Function handle stoploss executed *
 *-----------------------------------*/
export const excutedStoploss = async (orderId: string) => {
    const suborder = await findActiveSubOrderWithActiveRootOrder(orderId);

    if (suborder) {
        let rootorder = suborder.rootOrder!;
        const profit = calculateProfit({
            side: rootorder.side,
            entryPrice: rootorder.entryPrice,
            markPrice: suborder.markPrice,
            qty: suborder.qty,
        });

        // 1. Update suborder
        await prisma.subOrder.update({
            where: {
                orderId,
            },
            data: { status: "FINISHED", profit },
        });
        writeLog([`Stoploss executed --- ${suborder.orderId}`, suborder]);

        // 2. Update root order
        const stillHaveSubOrder = await prisma.subOrder.findMany({
            where: {
                rootOrderId: rootorder.id,
                status: "ACTIVE",
            },
        });

        // If no more stoploss (the stoploss executed is the last one) we update rootorder status to EXPIRED (Close rootorder)
        const remainQty = rootorder.qty - suborder.qty;
        const remainBudget = rootorder.budget - suborder.budget;
        if (stillHaveSubOrder.length === 0) {
            await prisma.rootOrder.update({
                where: {
                    id: rootorder.id,
                },
                data: { qty: remainQty, status: "EXPIRED", budget: remainBudget },
            });
            new TargetStorage().removeTarget(rootorder.orderId);

            let token = await prisma.token.findUnique({ where: { id: rootorder.tokenId! } });
            isCloseIntervalToken(token!);
        } else {
            await prisma.rootOrder.update({
                where: {
                    id: rootorder.id,
                },
                data: { qty: remainQty, budget: remainBudget },
            });
        }
    }
};

const findActiveSubOrderWithActiveRootOrder = async (orderId: string) => {
    const subOrder = await prisma.subOrder.findFirst({
        where: {
            orderId: orderId,
            status: "ACTIVE",
            rootOrder: {
                status: "ACTIVE",
            },
        },
        include: {
            rootOrder: true,
        },
    });

    return subOrder;
};

/* -----------------------------------------------*
 * Function will cancel all suborder by rootorder *
 *------------------------------------------------*/
export const cancelSubOrdersByRootOrder = async (rootorder: RootOrder, token: string) => {
    let cancelLists = await createCancelList({ rootorderId: rootorder.id });

    let response = await cancelStoploss({ token, orderIds: cancelLists });

    if (response.status === 200) {
        // Update suborder status to EXPIRED
        updateSuborderStatus(rootorder.id);
    } else {
        const log = `Can't cancel sub order for root order id: ${rootorder.orderId} - handleSubOrder`;
        logging("error", log);
        await writeLog([log, response]);
        const error = new Error(log);
        throw error;
    }
};

const createCancelList = async ({ rootorderId }: { rootorderId: number }): Promise<string[]> => {
    let suborders = await prisma.subOrder.findMany({
        where: {
            rootOrderId: rootorderId,
        },
    });
    return suborders.map((suborder) => suborder.orderId);
};

const updateSuborderStatus = async (rootorderId: number) => {
    await prisma.subOrder.updateMany({
        where: {
            rootOrderId: rootorderId,
            status: "ACTIVE",
        },
        data: { status: "EXPIRED" },
    });
};
