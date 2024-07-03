/**
 * Strategy này sẽ là nếu đường EMA 13 cắt lên đường EMA 20 thì sẽ BUY và ngược lại
 */

import { EMAType } from '@src/api/indicator';
import { strategyCombinationType } from '@src/strategies';

const strategy: (a: EMAType[], b: EMAType[]) => strategyCombinationType = (ema13: EMAType[], ema20: EMAType[]) => {
	let yesterday = {
		ema13: ema13[2].value,
		ema20: ema20[2].value,
	};
	let today = {
		ema13: ema13[1].value,
		ema20: ema20[1].value,
	};
	if (yesterday.ema13 < yesterday.ema20 && today.ema13 > today.ema20) {
		return {
			strategyId: 1,
			side: 'BUY',
		};
	} else if (yesterday.ema13 > yesterday.ema20 && today.ema13 < today.ema20) {
		return {
			strategyId: 1,
			side: 'SELL',
		};
	} else {
		return null;
	}
};

export default strategy;
