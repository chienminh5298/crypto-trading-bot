interface settingType {
	BINANCE: {
		BASE_URL_WEB_SOCKET: string;
		BASE_URL_API: string;
	};
	INDICATOR: {
		BASE_URL_API: string;
		INTERVAL: string;
	};
}

export const setting: settingType = {
	BINANCE: {
		BASE_URL_WEB_SOCKET: 'wss://fstream.binance.com/stream',
		BASE_URL_API: 'https://fapi.binance.com',
	},
	INDICATOR: {
		BASE_URL_API: 'https://api.taapi.io',
		INTERVAL: '1d', // 1m 5m 15m 1d 1w 1y TIME FRAME
	},
};
