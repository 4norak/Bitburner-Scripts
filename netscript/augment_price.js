/**
 * Parses a price from price and multiplier.
 *
 * @param {string} price The price to parse
 *
 * @return {number} The parsed price
 */
function parse_price(price) {
	// If no multiplier is given
	if (!isNaN(Number.parseInt(price.at(-1))))
		return price;

	// Parse multiplier from price
	let mult;
	switch(price.at(-1)) {
		case "k":
			mult = 1000;
			break;
		case "m":
			mult = 1000**2;
			break;
		case "b":
			mult = 1000**3;
			break;
		case "t":
			mult = 1000**4;
			break;
		case "q":
			mult = 1000**5;
			break;
		default:
			throw RuntimeError("Unknown multiplier: " + price.at(-1));
	}

	// Calculate parsed price
	return Number.parseFloat(price.slice(0, -1)) * mult;
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

/** @param {NS} ns */
export async function main(ns) {
	let sum = 0;
	for(let i = 0, mult = 1; i < ns.args.length; ++i, mult *= 1.9)
		sum += parse_price(ns.args[i]) * mult;

	ns.tprint(format_num(sum));
}
