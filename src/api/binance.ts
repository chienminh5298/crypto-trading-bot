import { setting } from "@root/setting";
import crypto from "crypto";
import axiosService from "@src/axiosService";
import { __payloadCancelRootOrderType, __payloadCancelStoplossType, __payloadNewStoplossType, __payloadOpenRootOrderType } from "@src/payload/binance";
import Timestamp from "@src/classes/timestamp";
import { writeLog } from "@src/utils/log";
const buildSign: (data: string) => string = (data: string) => {
    return crypto
        .createHmac("sha256", process.env.BINANCE_SECRETKEY || "")
        .update(data)
        .digest("hex");
};

export const getServerTime = async () => {
    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v1/time`);
    if (response.status !== 200) {
        writeLog(["Error get server time", response]);
    }
    return response;
};

export const getListenKey = async () => {
    return await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/listenKey`, null, true);
};

export const pingKeepAliveListenKey = async (listenKey?: string, configHeader: boolean = false) => {
    return await axiosService.put(`${setting.BINANCE.BASE_URL_API}/fapi/v1/listenKey?listenKey=${listenKey}`, configHeader);
};

export const getPrice = async (token: string) => {
    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v1/premiumIndex?symbol=${token}`);

    if (response.status !== 200) {
        writeLog([`Error get price ${token}`, response]);
    }
    return response;
};

export const getCandlestick = async (token: string) => {
    let interval = setting.INDICATOR.INTERVAL;
    return await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v1/klines?symbol=${token}&interval=${interval}&limit=11`);
};

export const cancelStoploss = async (value: __payloadCancelStoplossType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&orderIdList=[${value.orderIds}]&recvWindow=60000`;
    const signature = buildSign(queryString);
    return await axiosService.delete(`${setting.BINANCE.BASE_URL_API}/fapi/v1/batchOrders?${queryString}&signature=${signature}`);
};

export const cancelRootOrder = async (value: __payloadCancelRootOrderType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&side=${value.side}&type=MARKET&quantity=${value.qty}&reduceOnly=true&newOrderRespType=RESULT&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, true);
    if (response.status !== 200) {
        writeLog(["Error cancel root order", `Query string: ${queryString}`]);
    }
    return response;
};

export const newStoplossOrder = async (value: __payloadNewStoplossType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&side=${value.side}&type=${value.type}&quantity=${value.qty}&reduceOnly=true&stopPrice=${value.stopPrice}&newOrderRespType=RESULT&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, true);
    if (response.status !== 200) {
        writeLog(["Error new stoploss", `Query string: ${queryString}`]);
    }
    return response;
};

export const newRootOrder = async (value: __payloadOpenRootOrderType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&side=${value.side}&type=MARKET&quantity=${value.qty}&newOrderRespType=RESULT&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, true);
    if (response.status !== 200) {
        writeLog(["Error new root order", `Query string: ${queryString}`, response]);
    }
    return response;
};

export const getAvailableBalance = async () => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v2/balance?${queryString}&signature=${signature}`, true);
    if (response.status !== 200) {
        writeLog(["Error new stoploss", `Query string: ${queryString}`]);
    }
    return response;
};
