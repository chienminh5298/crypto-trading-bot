import { RootOrder, StopLoss, Token } from '@prisma/client';
import { calculateMarkPrice, roundToNDecimal } from '@src/utils';

export interface __payloadReduceOnlyType {
	token: string;
	side: 'SELL' | 'BUY';
	qty: number;
	precision: number;
}

export const __payloadReduceOnly = (query: __payloadReduceOnlyType) => {
	return {
		symbol: query.token,
		side: '',
		type: 'MARKET',
		qty: roundToNDecimal(query.qty, query.precision),
	};
};

export interface __payloadCancelStoplossType {
	token: string;
	orderIds: string[];
}

export const __payloadCancelStoploss = (query: __payloadCancelStoplossType) => {
	return {
		symbol: query.token, // ETHUSDT,... (With 'USDT')
		orderIds: query.orderIds,
	};
};

export interface __payloadNewStoplossType {
	token: string;
	side: 'SELL' | 'BUY';
	type: 'TAKE_PROFIT_MARKET' | 'STOP_MARKET' | 'MARKET';
	qty: number;
	stopPrice: number;
}

type __payloadNewStoploss = {
	rootorder: RootOrder;
	token: Token;
	stoploss: StopLoss;
};

export const __payloadNewStoploss = ({ rootorder, token, stoploss }: __payloadNewStoploss) => {
	const tokenUSDT = token.name + token.stable;
	const qty = roundToNDecimal(rootorder.qty * stoploss.qtyPercent, token.precision);
	const side = rootorder.side === 'SELL' ? 'BUY' : ('SELL' as 'SELL' | 'BUY');
	const stopPrice = roundToNDecimal(calculateMarkPrice(stoploss.percent, rootorder.entryPrice, rootorder.side), 2); // Binance only permit 2 decimal usdt
	return {
		token: tokenUSDT,
		side,
		type: 'STOP_MARKET' as 'STOP_MARKET',
		qty,
		stopPrice,
	};
};

export interface __payloadCancelRootOrderType {
	token: string;
	side: 'SELL' | 'BUY';
	qty: number;
}

export const __payloadCancelRootOrder = (query: __payloadCancelRootOrderType, precision: number) => {
	return {
		token: query.token,
		side: query.side,
		qty: roundToNDecimal(query.qty, precision),
	};
};

export interface __payloadOpenRootOrderType {
	token: string;
	side: string;
	qty: number;
}

export const __payloadOpenRootOrder = (query: __payloadOpenRootOrderType, precision: number) => {
	return {
		token: query.token,
		side: query.side,
		qty: roundToNDecimal(query.qty, precision),
	};
};
