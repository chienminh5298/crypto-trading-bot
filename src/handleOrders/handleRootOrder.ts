import jsonbig from "json-bigint";
import { RootOrder, Target, Token } from "@prisma/client";

import prisma from "@root/prisma/database";
import TargetStorage from "@src/classes/targetStorage";
import IntervalPriceOrder from "@src/classes/intervalPriceOrder";

import { logging, writeLog } from "@src/utils/log";
import { getNextTarget } from "@src/handleOrders/handleTarget";
import { __payloadCancelRootOrder } from "@src/payload/binance";
import { cancelRootOrder, getPrice, newRootOrder } from "@src/api/binance";
import { cancelSubOrdersByRootOrder, newStoploss } from "@src/handleOrders/handleSubOrder";
import { calculateMarkPrice, calculateProfit, getAvailableUSDT, handleError, isCloseIntervalToken } from "@src/utils";

/* -----------------------------------------------------------------------------------------------*
 * When root order opened => at least 1 sub order is opened and target is set in target's storage *
 *------------------------------------------------------------------------------------------------*/
export const openRootOrder = async (token: Token, strategy: { strategyId: number; side: "SELL" | "BUY" }) => {
    const strategyId = strategy.strategyId;
    const orderToken = token.name + token.stable;

    let queryMarketPrice = await getPrice(orderToken);
    if (queryMarketPrice.status == 200) {
        const price = +queryMarketPrice.data.markPrice;
        const avlbBalance = await getAvailableUSDT();
        let budget = 0;
        const envBudget = Number(process.env.ACC_BUDGET);
        if (avlbBalance && envBudget) {
            if (avlbBalance < envBudget) {
                budget = avlbBalance;
            } else {
                budget = envBudget;
            }
        }

        // 2. Open root order
        if (budget !== 0) {
            const qty = budget / price;
            const payload = __payloadCancelRootOrder({ token: orderToken, side: strategy.side, qty }, token.precision);
            let response = await newRootOrder(payload);
            if (response.status === 200) {
                let responseData = response.data;
                writeLog([`Open root order successfully --- ${orderToken}`, { ...responseData }]);

                // 3. Find the first target to set stoploss
                let target = await prisma.target.findFirst({
                    where: {
                        strategyId: strategyId,
                        tokenId: token.id,
                    },
                    orderBy: {
                        percent: "asc",
                    },
                    take: 1,
                });

                // 4. Find the next target to reach
                let nextTarget = await getNextTarget(target!.id, token.id, strategyId);

                if (target && nextTarget) {
                    // 5. Insert root order to rootorder table
                    const rootorder = await insertRootorder({ responseData, budget, nextTargetId: nextTarget.id, tokenId: token.id, strategyId });

                    // 6. set target's Storage
                    let markPrice = calculateMarkPrice(nextTarget.percent, rootorder.entryPrice, rootorder.side);
                    new TargetStorage().addTarget(rootorder.orderId, { targetId: nextTarget.id, markPrice });

                    // 7. Set stoploss
                    await setStoplosses({ target, rootorder, token });

                    // 8. create interval token's price check
                    new IntervalPriceOrder().createIntervalPriceCheck(orderToken, token.id);
                } else {
                    handleError(`Can't find any target - openRootOrder - handleRootOrders`, "error", [target, nextTarget]);
                }
            } else {
                handleError(`Can't open new root order - openRootOrder - handleRootOrders`, "error", [response]);
            }
        }
    } else {
        handleError(`Can't get price to open root order - openRootOrder - handleRootOrders`, "error", [queryMarketPrice]);
    }
};

type setStoplossParams = {
    target: Target;
    rootorder: RootOrder;
    token: Token;
};

const setStoplosses = async ({ target, rootorder, token }: setStoplossParams): Promise<void> => {
    let stoplosses = await prisma.stopLoss.findMany({
        where: {
            targetId: target.id,
        },
    });
    stoplosses.forEach(async (stoploss) => await newStoploss(stoploss, rootorder, token));
};

type insertRootorderParams = {
    responseData: any;
    budget: number;
    nextTargetId: number;
    tokenId: number;
    strategyId: number;
};

const insertRootorder = async ({ responseData, budget, nextTargetId, tokenId, strategyId }: insertRootorderParams): Promise<RootOrder> => {
    let rootorder = await prisma.rootOrder.create({
        data: {
            orderId: jsonbig.stringify(responseData.orderId),
            side: responseData.side,
            timestamp: responseData.updateTime.toString(),
            entryPrice: parseFloat(responseData.avgPrice),
            qty: parseFloat(responseData.origQty),
            budget: budget,
            status: "ACTIVE",
            currentTargetId: nextTargetId,
            tokenId: tokenId,
            strategyId: strategyId,
        },
    });

    return rootorder;
};

/* --------------------------------------------------------------------------*
 * When root order closed => all sub orders are closed and calculated profit *
 *---------------------------------------------------------------------------*/
export const closeRootOrderAndSubOrders = async (rootorder: RootOrder, token: Token) => {
    const tokenUSDT = token.name + token.stable;
    const side = rootorder.side === "SELL" ? "BUY" : "SELL";
    const qty = rootorder.qty;
    const payload = __payloadCancelRootOrder({ token: tokenUSDT, side, qty }, token.precision);

    // 1. Close root order
    const response = await cancelRootOrder(payload);

    if (response.status == 200) {
        // 2. Cancel all stoploss belong to this root order
        await cancelSubOrdersByRootOrder(rootorder, tokenUSDT);

        const markPrice = response.data.avgPrice;
        let profit = calculateProfit({ side: rootorder.side, entryPrice: rootorder.entryPrice, markPrice, qty: rootorder.qty });

        // 3. Update root order
        await prisma.rootOrder.update({
            where: {
                id: rootorder.id,
            },
            data: { status: "FINISHED", profit, markPrice: parseFloat(markPrice) },
        });

        // 4. Remove target from target's storage
        new TargetStorage().removeTarget(rootorder.orderId);

        // 5. Remove price check interval
        new IntervalPriceOrder().removeInterval(tokenUSDT);

        // 6. Check if doesn't exitsts any order belongs to this token then we remove interval price check
        isCloseIntervalToken(token);

        return { status: 200 };
    } else {
        const errorLog = `Can't cancel root order id: ${rootorder.orderId} - handleRootOrder`;
        writeLog([errorLog, response]);
        logging("error", errorLog);
        return { status: 400 };
    }
};

/* -------------------------------------------------*
 * This function will close all root order by token *
 *--------------------------------------------------*/
export const closeOrderManually = async (tokenName: string, markPrice: number) => {
    let token = await prisma.token.findFirst({ where: { name: tokenName } });
    if (token) {
        let rootorders = await prisma.rootOrder.findMany({
            where: {
                tokenId: token.id,
                status: "ACTIVE",
            },
        });
        for (const rootorder of rootorders) {
            // 1. Cancel all stoploss belong to this root order
            await cancelSubOrdersByRootOrder(rootorder, token.name + token.stable);

            let profit = calculateProfit({ side: rootorder.side, entryPrice: rootorder.entryPrice, markPrice, qty: rootorder.qty });
            // 2. Cập nhật root order
            await prisma.rootOrder.update({
                where: {
                    id: rootorder.id,
                },
                data: { status: "FINISHED", profit, markPrice },
            });

            // 3. Xoá target ra khỏi target storage
            new TargetStorage().removeTarget(rootorder.orderId);
        }

        // 5. Xóa interval price của token đó
        new IntervalPriceOrder().removeInterval(token.name + token.stable);
    }
};
