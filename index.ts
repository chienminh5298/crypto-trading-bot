import "dotenv/config";
import "module-alias/register";
import express, { NextFunction, Request, Response } from "express";

import { Token } from "@prisma/client";
import { logging } from "@src/utils/log";
import ListenKey from "@src/classes/listenKey";
import Timestamp from "@src/classes/timestamp";
import { getIndicator } from "@src/api/indicator";
import { checkStrategies } from "@src/strategies";
import { createOpenOrderSocket } from "@src/socket/binance";
import prisma, { connectDatabase } from "@root/prisma/database";
import { createTokenPriceSocket, getTimeHour, getTimeMinute, insertTokenData } from "@src/utils";

const server = express();

// body parser
server.use(express.json());

// CORS
server.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.status(200).end();
    } else {
        next();
    }
});

// Start here
server.listen(parseInt(process.env.SERVER_PORT || "3000", 10));

/**
 * Connect DB
 * Get Listen Key
 * Get Timestamp
 * Create socket for order status
 * Create token price socket
 * Check tokens strategies
 */
const setupServer = async () => {
    // Connect & define database
    await connectDatabase();

    // Get listen key
    await new ListenKey().getListenKey();

    // Get timestamp
    new Timestamp().getTimestamp();

    // Create socket to listen if order status changed
    createOpenOrderSocket();

    // Check price of current open order
    await createTokenPriceSocket();

    setInterval(async () => {
        let hour = getTimeHour();
        let minute = getTimeMinute();

        // logging("info", `hour:${hour} - minute: ${minute}`);
        if (hour === 0  && minute === 3) {
            logging("info", `hour:${hour} - minute: ${minute}`);

            await checkTokens();
        }
    }, 60000);
};

setupServer();

/* -------------------- */

const checkTokens = async () => {
    let tokens = await prisma.token.findMany();
    tokens.forEach(async (token) => await checkToken(token));
};

const checkToken = async (token: Token) => {
    let indicators = await getIndicator(token.name);
    await insertTokenData(token, indicators);

    // Check stratergy for open order
    await checkStrategies(token, indicators);
};
