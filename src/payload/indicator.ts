import { setting } from "@root/setting";

export const __payloadIndicator = (symbol: string) => {
    return {
        exchange: "binance",
        symbol: `${symbol}/USDT`,
        interval: setting.INDICATOR.INTERVAL,
        indicators: [
            {
                id: "EMA_13",
                indicator: "ema",
                optInTimePeriod: 13,
                backtracks: 3,
            },
            {
                id: "EMA_20",
                indicator: "ema",
                optInTimePeriod: 20,
                backtracks: 3,
            },
        ],
    };
}