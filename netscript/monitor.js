/**
 * Information of a script to monitor
 */
class ScriptInfo {
	/**
	 * The script's filename
	 * 
	 * @type {!string}
	 */
	filename;

	/**
	 * The hostname of the server the script should be running on
	 * 
	 * @type {!string}
	 */
	hostname;

	/**
	 * The script's arguments
	 * 
	 * @type {!(string|number|boolean)[]}
	 */
	args;

	/**
	 * Create a new ScriptInfo
	 * 
	 * @param {string} filename The script's filename
	 * @param {string} hostname The hostname of the server the script should be running on
	 * @param {(string|number|boolean)[]=} args The script's arguments
	 */
	constructor(filename, hostname, args = []) {
		this.filename = filename;
		this.hostname = hostname;
		this.args = args;
	} 
}

/**
 * Information about an API to monitor
 */
class APIInfo {
	/**
	 * The API's name to display
	 * 
	 * @type {!string}
	 */
	name;

	/**
	 * The URL to fetch
	 * 
	 * @type {!string}
	 */
	url;

	/**
	 * Create a new APIInfo
	 * 
	 * @param {!string} name The API's name to display
	 * @param {!string} url The URL to fetch
	 */
	constructor(name, url) {
		this.name = name;
		this.url = url;
	}
}

/**
 * Information about a service to log in monitoring
 */
class ServiceStatus {
	/**
	 * The service's display name
	 * 
	 * @type {!string}
	 */
	name;

	/**
	 * The service's category
	 * 
	 * @type {!string}
	 */
	category;

	/**
	 * The service's status
	 * 
	 * @type {!number}
	 */
	status;

	/**
	 * Extra information appended to the status information
	 * 
	 * @type {!string} 
	 */
	extra;

	/**
	 * Create a new ServiceStatus
	 * 
	 * @param {string} name The service's display name
	 * @param {string} category The service's category
	 * @param {number} status The service's status
	 */
	constructor(name, category, status, extra = "") {
		this.name = name;
		this.category = category;
		this.status = status;
		this.extra = extra;
	}
}

const SCRIPTS = [new ScriptInfo("hackscan.js", "home"),
				 new ScriptInfo("trading.js", "home"),
				 new ScriptInfo("solve-contracts.js", "home")];
const APIS = [new APIInfo("Coding Contracts", "http://localhost:8080/ping")];
const COLORS = {
	"red": "\x1b[31m",
	"yellow": "\x1b[38;5;227m",
	"green": "\x1b[38;5;76m",
	"default": "\x1b[39m"
}

/**
 * Check if scripts are running properly
 * 
 * @param {NS} ns
 * @param {ScriptInfo[]} scripts The scripts to check
 * 
 * @return {ServiceInfo[]} Information about the scripts
 */
function check_scripts(ns, scripts) {
	return scripts.map((s, _i, _arr) => {
		return new ServiceStatus(s.filename, "Scripts", +ns.isRunning(s.filename, s.hostname, ...s.args));
	});
}

/**
 * Check API availability
 * 
 * @param {NS} ns
 * @param {APIInfo[]} apis The APIs to check
 * 
 * @return {Promise<ServiceStatus[]>}
 */
async function check_apis(ns, apis) {
	let info = apis.map(async (api, _i, _arr) => {
		let status = fetch(api.url)
						.then((r) => +r.ok)
						.catch((r) => 0);
		return new ServiceStatus(api.name, "APIs", await status);
	});
	return await Promise.all(info);
}

/**
 * Print monitoring logs
 * 
 * @param {NS} ns
 * @param {ServiceStatus[]} statuses The status information about all services
 * @param {number} max_extra_len The maximum line length for extra information
 */
function print_logs(ns, statuses) {
	ns.print(
		// For all categories
		[...new Set(statuses.map((v, _i, _arr) => v.category))].reduce((str, c, i, _arr) => {
			if (i != 0) {
				str += "\n\n";
			}

			// Generate string for category
			str += statuses.filter((v, _i, _arr) => v.category === c).reduce((p, s, _i, _arr) => {
				p += "\n";

				// Add symbol indicating status of service
				switch (s.status) {
					case 0: p += COLORS.red; break;
					case 1: p += COLORS.green; break;
					default: p += COLORS.yellow; break;
				}
				p += "⦿ " + COLORS.default + s.name;

				// Add extra information to log
				if (s.extra) {
					p += " - " + s.extra;
				}

				return p;
			}, "\x1b[1;4m" + c + "\x1b[22;24m");

			return str;
		}, "")
	);
}

/**
 * Disable ns functions' logs
 * 
 * @param {NS} ns
 */
function disable_logs(ns) {
	ns.disableLog("sleep");
}

/** @param {NS} ns */
export async function main(ns) {
	disable_logs(ns);

	while (true) {
		let statuses = []
		statuses = statuses.concat(check_scripts(ns, SCRIPTS));
		statuses = statuses.concat(await check_apis(ns, APIS));
		ns.clearLog();
		print_logs(ns, statuses);
		await ns.sleep(60000);
	}
}
