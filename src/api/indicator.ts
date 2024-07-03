import axiosService from "@src/axiosService";
import { logging } from "@src/utils/log";
import { __payloadIndicator } from "@src/payload/indicator";

export interface EMAType {
    value: number;
}

export interface indicatorType {
    EMA_13: EMAType[];
    EMA_20: EMAType[];
}
export const getIndicator = async (symbol: string) => {
	const body = createQueryBody(symbol);
    const response = await axiosService.post("https://api.taapi.io/bulk", body, false);

    let indicators: indicatorType = {
        EMA_13: [],
        EMA_20: [],
    };

    if (response.status === 200) {
        for (var indicator of response.data.data) {
            switch (indicator.id) {
                case "EMA_13":
                    indicators.EMA_13.push({
                        value: parseFloat(indicator.result.value),
                    });
                    break;
                case "EMA_20":
                    indicators.EMA_20.push({
                        value: parseFloat(indicator.result.value),
                    });
                    break;
                default:
                    break;
            }
        }
    } else {
        logging("error", `Can't get indicator - api/indicator`);
    }
    let data: indicatorType = indicators;
    return data;
};


const createQueryBody = (symbol: string) => {
    let payload = __payloadIndicator(symbol);
    return {
        secret: process.env.INDICATOR_KEY,
        construct: payload,
    };
};