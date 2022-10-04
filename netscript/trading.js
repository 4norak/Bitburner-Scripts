// TODO: Command line arguments

var start_time;
const BUY_PROB = 0.60;
const SELL_PROB = 0.59;
const MIN_VOL_PRICE = 0.7;
const MAX_PRICE = 40_000_000_000_000;
const BLACKLIST = [];
const COLORS = {
	"red": "\x1b[31m",
	"green": "\x1b[38;5;76m",
	"yellow": "\x1b[38;5;227m",
	"default": "\x1b[0m"
}

/**
 * Get time since script started as string with format HH:MM:SS
 * 
 * @param {NS} ns
 * 
 * @return {string} The formated time
 */
function get_time(ns) {
	let time = Math.round(ns.getTimeSinceLastAug() / 1000 - start_time);
	return Math.floor(time / 3600) + ":" + Math.floor((time % 3600) / 60) + ":" + (time % 60);
}

/**
 * Format number with suffixes k, m, b, t and q and dots
 * 
 * @param {number} num
 */
function format_num(num) {
	let absnum = Math.abs(num);
	if(absnum > 10**15) {
		return (+(num / 10**15).toFixed(3)).toLocaleString("en-US") + "q";
	} else if(absnum > 10**12) {
		return (+(num / 10**12).toFixed(3)).toLocaleString("en-US") + "t";
	} else if(absnum > 10**9) {
		return (+(num / 10**9).toFixed(3)).toLocaleString("en-US") + "b";
	} else if(absnum > 10**6) {
		return (+(num / 10**6).toFixed(3)).toLocaleString("en-US") + "m";
	} else if(absnum > 10**3) {
		return (+(num / 10**3).toFixed(3)).toLocaleString("en-US") + "k";
	}
	return num.toFixed(3).toLocaleString("en-US");
}

/**
 * @param {NS} ns
 * @param {string} stock The stock 
 */
function trade(ns, stock) {
	if (BLACKLIST.includes(stock))
		return;

	let pos = ns.stock.getPosition(stock);
	let fc = ns.stock.getForecast(stock);
	let vol_price = ns.stock.getVolatility(stock)/(ns.stock.getAskPrice(stock)/ns.stock.getBidPrice(stock) - 1);

	if(pos[0] > 0) {
		if(fc < SELL_PROB) {
			let sell_price = ns.stock.sellStock(stock, pos[0]);
			let time = Math.round(start_time - ns.getTimeSinceLastAug() / 1000);
			if(sell_price == 0) {
				ns.print(COLORS.red + "Selling %s failed (Time: %s)" + COLORS.default, stock, get_time(ns));
			}
			else {
				let profit = (sell_price - pos[1]) * pos[0] - 200000;
				let color;
				if (profit >= 0)
					color = COLORS.green;
				else
					color = COLORS.yellow;

				ns.printf(color + "Sold %s, Profit %s (Time: %s)" + COLORS.default, stock, format_num(profit), get_time(ns));
			}
		}
	}
	else {
		if(fc >= BUY_PROB && vol_price >= MIN_VOL_PRICE && ns.stock.getAskPrice(stock) <= MAX_PRICE) {
			let amount = Math.min(Math.round(MAX_PRICE / ns.stock.getAskPrice(stock)), ns.stock.getMaxShares(stock));
			let price = ns.stock.buyStock(stock, amount);
			if(price == 0) {
				ns.print(COLORS.red + "Buying %s failed (Time %s)" + COLORS.default, stock, get_time(ns));
			}
			else {
				ns.printf("Bought %s, Price %s (Time %s)", stock, format_num(price * amount), get_time(ns));
			}
		}
	}
}

/**
 * Disables internal logging for used functions
 * 
 * @param {NS} ns
 */
function disable_logs(ns) {
	ns.disableLog("sleep");
	ns.disableLog("stock.sellStock");
	ns.disableLog("stock.buyStock");
}

/** @param {NS} ns */
export async function main(ns) {
	start_time = ns.getTimeSinceLastAug() / 1000;
	disable_logs(ns);
	ns.print("-----------");
	while(true) {
		ns.stock.getSymbols().forEach((stock, stocks) => {trade(ns,stock);});
		await ns.sleep(1000);
	}
}
