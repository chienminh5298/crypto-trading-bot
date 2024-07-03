import WebSocket from "ws";
import jsonbig from "json-bigint";

import { removeUSDT } from "@src/utils";
import { setting } from "@root/setting";
import { logging } from "@src/utils/log";
import ListenKey from "@src/classes/listenKey";
import { excutedStoploss } from "@src/handleOrders/handleSubOrder";
import { closeOrderManually } from "@src/handleOrders/handleRootOrder";

export const createOpenOrderSocket = async () => {
    let listenKey = await new ListenKey().getListenKey();

    const URI = `${setting.BINANCE.BASE_URL_WEB_SOCKET}?streams=${listenKey}`;
    var socket = new WebSocket(URI);

    socket.on("open", () => {
        logging("info", "Binance socket open successfuly.");
    });

    socket.on("message", async (msg: WebSocket.RawData) => {
        var data = jsonbig.parse(msg.toString()).data;

        if (data.e === "ORDER_TRADE_UPDATE") {
            if (data.o.x === "EXPIRED" && (data.o.o === "STOP_MARKET" || data.o.o === "TAKE_PROFIT_MARKET")) {
                // Reach stoploss or take profit
                let orderId = jsonbig.stringify(data.o.i); // [data.o.i] is orderId
                await excutedStoploss(orderId);
            } else if (data.o.o === "MARKET" && data.o.x === "TRADE" && data.o.X === "FILLED" && data.o.ot === "MARKET" && data.o.R === true) {
                // Close order manually (Close all orders belongs to this token)
                let token = removeUSDT(data.o.s);
                let markPrice = parseFloat(data.o.ap);
                await closeOrderManually(token, markPrice);
            }
        }
    });

    socket.on("error", (error) => {
        logging("error", `Binance order socket failed: ${jsonbig.parse(error.toString())}`);
    });

    socket.on("close", () => {
        logging("warning", `Binance order socket disconnected`);
    });
};
