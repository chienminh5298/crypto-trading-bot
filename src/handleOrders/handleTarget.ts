import { RootOrder, Target, Token } from "@prisma/client";

import prisma from "@root/prisma/database";
import { logging, writeLog } from "@src/utils/log";
import TargetStorage from "@src/classes/targetStorage";
import { calculateMarkPrice, handleError } from "@src/utils";
import { closeRootOrderAndSubOrders } from "@src/handleOrders/handleRootOrder";
import { cancelSubOrdersByRootOrder, newStoploss } from "@src/handleOrders/handleSubOrder";

/* ---------------------------------------------------------------------------------------------------*
 * This function will compare market price VS target price to check if open order reach target or not *
 * If reach => move to next target or close open order and take profit                                *
 * If not reach => do nothing                                                                         *
 *----------------------------------------------------------------------------------------------------*/
export const checkTarget = async (tokenId: number, price: number) => {
    let rootorders = await getRootordersToCheckTarget(tokenId);
    rootorders.forEach(async (rootorder) => {
        await compareWithTarget(rootorder, price, tokenId);
    });
};

const getRootordersToCheckTarget: (tokenId: number) => Promise<(RootOrder & { token: Token | null })[]> = async (tokenId) => {
    const rootorders = await prisma.rootOrder.findMany({
        where: {
            tokenId: tokenId,
            status: "ACTIVE",
        },
        include: {
            token: true,
        },
    });
    return rootorders;
};

const compareWithTarget = async (rootorder: RootOrder & { token: Token | null }, price: number, tokenId: number) => {
    let currentTarget = new TargetStorage().getTarget(rootorder.orderId);

    if (price > currentTarget.markPrice) {
        let nextTarget = await getNextTarget(currentTarget.targetId, tokenId, rootorder.strategyId);
        if (nextTarget) {
            await moveTarget(rootorder, nextTarget, rootorder.token!);

            // Update target's storage - set next target
            let markPrice = calculateMarkPrice(nextTarget.percent, rootorder.entryPrice, rootorder.side);
            new TargetStorage().updateTarget(rootorder.orderId, { targetId: nextTarget.id, markPrice });
        } else {
            await closeRootOrderAndSubOrders(rootorder, rootorder.token!);
        }
    }
};

/* --------------------------------------------------------------------------------------------*
 * This function will load target of rootorders to storage                                     *
 * When we start server, storage is empty => We need load target of open rootorders to storage *
 *---------------------------------------------------------------------------------------------*/
export const loadTargetToStorage = async (tokenId: number) => {
    let rootorders = await prisma.rootOrder.findMany({
        where: {
            tokenId: tokenId,
            status: "ACTIVE",
        },
    });

    rootorders.forEach(async (rootorder) => await loadTargetOfOrder(rootorder));
};

const loadTargetOfOrder = async (rootorder: RootOrder) => {
    let target = await prisma.target.findUnique({ where: { id: rootorder.currentTargetId! } });
    if (target) {
        let markPrice = calculateMarkPrice(target.percent, rootorder.entryPrice, rootorder.side);

        new TargetStorage().addTarget(rootorder.orderId, { targetId: target.id, markPrice });
    }
};

/* ----------------------------------------------------------------------------------*
 * This function will return the next target                                         *
 * If have not next target it's mean order reach take profit (Reach the last target) *
 *-----------------------------------------------------------------------------------*/
export const getNextTarget = async (currentTargetId: number, tokenId: number, strategyId: number) => {
    let currentTarget = await prisma.target.findUnique({ where: { id: currentTargetId } });
    if (currentTarget) {
        const nextTarget = await prisma.target.findFirst({
            where: {
                tokenId: tokenId,
                strategyId: strategyId,
                percent: {
                    gt: currentTarget.percent, // Use gt for "greater than"
                },
            },
            orderBy: {
                percent: "asc", // Order by percent in ascending order
            },
        });
        return nextTarget;
    } else {
        logging("error", `Can't get current target - getNextTarget - handleTarget`);
    }
    return null;
};

/* --------------------------------------------------------------------------*
 * This function will update next target for root order                      *
 * It also cancel all sub order by root order and then place a new stop loss *
 *---------------------------------------------------------------------------*/
export const moveTarget = async (rootorder: RootOrder, nextTarget: Target, token: Token) => {
    const orderToken = token.name + token.stable;

    const currentTarget = rootorder.currentTargetId;

    // 1. Update root order
    await prisma.rootOrder.update({
        where: {
            id: rootorder.id,
        },
        data: { currentTargetId: nextTarget.id },
    });

    try {
        // 2. Cancel all stoploss by root order
        await cancelSubOrdersByRootOrder(rootorder, orderToken);

        // 3. Cập nhật tất cả sub order status thành expired
        await prisma.subOrder.updateMany({
            where: {
                rootOrderId: rootorder.id,
                status: "ACTIVE",
            },
            data: { status: "EXPIRED" },
        });

        // 4. Set new stoploss
        let stoplosses = await prisma.stopLoss.findMany({
            where: {
                targetId: currentTarget,
            },
        });

        stoplosses.forEach(async (stoploss) => await newStoploss(stoploss, rootorder, token));

        writeLog([`Move target --- ${orderToken} => ${nextTarget.percent}%`]);
    } catch (error) {
        handleError(`Can't cancel sub order for root order id: ${rootorder.orderId} - moveTarget - handleTarget`, "error", [error]);
    }
};
