import { Token } from "@prisma/client";

import prisma from "@root/prisma/database";
import strategy1 from "@src/strategies/strategy1";

import { indicatorType } from "@src/api/indicator";
import { closeRootOrderAndSubOrders, openRootOrder } from "@src/handleOrders/handleRootOrder";

export type strategyCombinationType = strategyType | null;

interface strategyType {
    strategyId: number;
    side: "SELL" | "BUY";
}
export const checkStrategies = async (token: Token, indicators: indicatorType) => {
    if (token.isActive) {
        const strategies = await Promise.all([strategy1(indicators.EMA_13, indicators.EMA_20)]);

        strategies.forEach(async (strategy) => {
            if (strategy) {
                await checkStrategy(strategy, token);
            }
        });
    }
};

const checkStrategy = async (strategy: strategyType, token: Token) => {
    /**
     * In case we found an order has same strategy id but opposite, we will cancel current order and open opposite order
     * Example: Current order is BUY but now we opening SELL => close order BUY
     */

    let rootorder = await prisma.rootOrder.findFirst({
        where: {
            tokenId: token.id,
            status: "ACTIVE",
            strategyId: strategy.strategyId,
        },
    });

    if (rootorder && rootorder.side !== strategy.side) {
        await closeRootOrderAndSubOrders(rootorder, token);
    }

    await openRootOrder(token, strategy);
};
