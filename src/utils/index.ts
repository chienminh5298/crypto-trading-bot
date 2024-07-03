import { Token } from "@prisma/client";

import prisma from "@root/prisma/database";
import { getAvailableBalance, getCandlestick } from "@src/api/binance";
import { indicatorType } from "@src/api/indicator";
import { logging, writeLog } from "@src/utils/log";
import IntervalPriceOrder from "@src/classes/intervalPriceOrder";
import { loadTargetToStorage } from "@src/handleOrders/handleTarget";

/**
 - We will not open price socket for every token, just open socket for tokens which has at least 1 open order.
 - This function will find the token has at least 1 open order then will create a price socket to listen price changes.
 */
export const createTokenPriceSocket = async () => {
    var tokens = await prisma.token.findMany({
        where: {
            rootOrders: {
                some: {
                    status: "ACTIVE",
                },
            },
        },
    });

    tokens.forEach((token) => {
        // Load targets of orders into storage
        loadTargetToStorage(token.id!);

        // create interval token's price check
        let symbol = token.name + token.stable;
        new IntervalPriceOrder().createIntervalPriceCheck(symbol, token.id);
    });
};

export const removeUSDT: (token: string) => string = (token: string) => {
    return token.slice(0, -4);
};

export const calculateMarkPrice = (percent: number, entryPrice: number, side: "SELL" | "BUY") => {
    const differance = entryPrice * (percent / 100);
    if (side === "SELL") {
        return entryPrice - differance;
    } else {
        return entryPrice + differance;
    }
};

export const roundToNDecimal: (price: string | number, precision: number) => number = (price: string | number, precision: number) => {
    var indexOfDot = price.toString().indexOf(".");
    var result = price;
    if (indexOfDot !== -1) {
        result = price.toString().slice(0, indexOfDot + precision + 1);
    }
    result = result.toString();
    return parseFloat(result);
};

interface calculateProfitType {
    side: "SELL" | "BUY";
    entryPrice: number;
    markPrice: number;
    qty: number;
}
export const calculateProfit = ({ side, entryPrice, markPrice, qty }: calculateProfitType) => {
    if (side === "SELL") {
        return (entryPrice - markPrice) * qty;
    } else {
        return (markPrice - entryPrice) * qty;
    }
};

export const insertTokenData = async (token: Token, indicators: indicatorType) => {
    let response = await getCandlestick(token.name + token.stable);
    if (response.status === 200) {
        let candle = response.data;
        let candleLength = candle.length;
        let open = parseFloat(candle[candleLength - 2][1]);
        let close = parseFloat(candle[candleLength - 2][4]);
        let high = parseFloat(candle[candleLength - 2][2]);
        let low = parseFloat(candle[candleLength - 2][3]);
        let volume = parseFloat(candle[candleLength - 2][5]);

        let indicator = {};
        for (const [key, value] of Object.entries(indicators)) {
            //@ts-ignore
            indicator[key] = value[1];
        }
        await prisma.tokenData.create({
            data: { open, close, high, low, volume, indicators: JSON.stringify(indicator), tokenId: token.id },
        });
    }
};

export const isCloseIntervalToken = async (token: Token) => {
    let rootorders = await prisma.rootOrder.findMany({
        where: {
            tokenId: token.id,
        },
    });
    if (rootorders.length === 0) {
        new IntervalPriceOrder().removeInterval(token.name + token.stable);
    }
};

export const calculateProfitPercent = (entryPrice: number, sellPrice: number, side: "SELL" | "BUY") => {
    if (side === "BUY") {
        return ((sellPrice - entryPrice) * 100) / entryPrice;
    } else {
        return ((entryPrice - sellPrice) * 100) / entryPrice;
    }
};

export const getTimeHour = () => {
    let date = new Date();
    return date.getHours();
};

export const getTimeMinute = () => {
    let date = new Date();
    return date.getMinutes();
};

export const getTimeSecond = () => {
    let date = new Date();
    return date.getSeconds();
};

export const handleError = (alert: string, type: string, writeLogParam: any[]) => {
    writeLog([alert, ...writeLogParam]);
    logging(type, alert);
};
type Balance = {
    asset: string;
    availableBalance: string;
};
export const getAvailableUSDT = async () => {
    const response: {
        data: Balance[];
    } = await getAvailableBalance();
    let avlb;
    if (response.data) {
        for (const data of response.data) {
            if (data.asset === "USDT") {
                avlb = parseFloat(data.availableBalance);
                break;
            }
        }
    }
    return avlb;
};
