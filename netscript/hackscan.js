// TODO: Command line arguments

const MONEY_SCRIPT = "money-script.js";
const MAX_MONEY_RAM = 33272;
let EXEC_SERVERS = ["home"];
const COLORS = {
	"red": "\x1b[31m",
	"yellow": "\x1b[38;5;227m",
	"default": "\x1b[0m"
}
const CONTRACT_PORT = 8;

/**
 * Information to log about a server
 */
class ServerInfo {
	/**
	 * The server's hostname
	 * 
	 * @type {!String}
	 */
	hostname;

	/**
	 * The servers distance from the starting server
	 * 
	 * @type {!number}
	 */
	level;

	/**
	 * If the server is owned by the player
	 * 
	 * @type {!boolean}
	 */
	player_server;

	/**
	 * If the player has root access to the server
	 * 
	 * @type {?boolean}
	 */
	root_access;

	/**
	 * If the player meets the level requirement for hacking the server
	 * 
	 * @type {?boolean}
	 */
	level_req;

	/**
	 * If all money scripts for the server are running correctly
	 * 
	 * @type {?boolean}
	 */
	money_scripts;

	/**
	 * If there is a coding contract on the server
	 * 
	 * @type {?boolean}
	 */
	coding_contract;

	/**
	 * If a backdoor is installed on the server
	 * 
	 * @type {?boolean}
	 */
	backdoor;

	/**
	 * Create a ServerInfo
	 * 
	 * @param {string} hostname The server's hostname
	 * @param {number=} level The servers distance from the starting server
	 * @param {boolean=} player_server If the server is owned by the player
	 * @param {boolean=} root_access If the player has root access to the server
	 * @param {boolean=} level_req If the player meets the level requirement for hacking the server
	 * @param {boolean=} money_scripts If all money scripts for the server are running correctly
	 * @param {boolean=} coding_contract If there is a coding contract on the server
	 * @param {boolean=} backdoor If a backdoor is installed on the server
	 */
	constructor(hostname, level = null, player_server = null, root_access = null,
				level_req = null, money_scripts = null, coding_contract = null, backdoor = null) {
		this.hostname = hostname;
		this.level = level;
		this.player_server = player_server;
		this.root_access = root_access;
		this.level_req = level_req;
		this.money_scripts = money_scripts;
		this.coding_contract = coding_contract;
		this.backdoor = backdoor;
	}
}

/**
 * Get root access to a server
 * 
 * @param {NS} ns
 * @param {Server} server The server to root
 * 
 * @return {boolean} If the server was rooted successfully
 */
function root_server(ns, server) {
	/* Open necessary ports for nuking */
	const port_funs = [ns.brutessh, ns.ftpcrack, ns.relaysmtp, ns.httpworm, ns.sqlinject];
	for (let i = 0; i < port_funs.length && server.openPortCount < server.numOpenPortsRequired; ++i) {
		try {
			port_funs[i](server.hostname);
		} catch {}
	}

	/* Nuke server if necessary ports are open */
	if (server.openPortCount >= server.numOpenPortsRequired) {
		ns.nuke(server.hostname);
		return true;
	}
	return false;
}

/**
 * Run money generating scripts for server
 * 
 * @param {NS} ns
 * @param {Server} server The server to take the money from
 */
function run_money_scripts(ns, server) {
	/* RAM used by MONEY_SCRIPT per thread */
	const ram_usage = ns.getScriptRam(MONEY_SCRIPT, "home");

	/* RAM used by currently started processes of MONEY_SCRIPT for server */
	let ram_used = ram_usage * (
		EXEC_SERVERS
			.flatMap((hostname, _i, _arr) => {
				return ns.ps(hostname)
							.filter((p, _i, _arr) => p.filename === MONEY_SCRIPT && p.args[0] === server.hostname)
			})
			.reduce((total, p, _i, _arr) => total + ns.getRunningScript(p.pid).threads, 0)
	)

	/* Start MONEY_SCRIPT until RAM usage exceeds MAX_MONEY_RAM */
	for (const hostname of EXEC_SERVERS) {
		if (ram_used > MAX_MONEY_RAM - ram_usage)
			break;

		const run_server = ns.getServer(hostname);
		const threads = Math.floor(Math.min(MAX_MONEY_RAM - ram_used, run_server.maxRam - run_server.ramUsed) / ram_usage);

		if (threads === 0)
			continue;

		if (!ns.fileExists(MONEY_SCRIPT, hostname))
			ns.scp(MONEY_SCRIPT, hostname, "home");

		for (let i = 0; ns.exec(MONEY_SCRIPT, hostname, threads, server.hostname, i) === 0; ++i) {}

		ram_used += threads * ram_usage;
	}

	if (server.maxRam - server.ramUsed >= ram_usage) {
		/* Copy MONEY_SCRIPT to server and run it */
		ns.scp(MONEY_SCRIPT, server.hostname);
		ns.exec(MONEY_SCRIPT, server.hostname,
				Math.floor((server.maxRam - server.ramUsed) / ram_usage), server.hostname);
	}

	return ram_used > MAX_MONEY_RAM - ram_usage;
}


/**
 * Process contracts on server
 * 
 * @param {NS} ns
 * @param {Server} server The server the contracts are on
 * 
 * @return {Promise<boolean>} If there are any contracts on the server
 */
async function process_contracts(ns, server) {
	let contracts = ns.ls(server.hostname, ".cct");

	for (let filename of contracts) {
		// TODO: Implement better check for tries
		if (ns.codingcontract.getNumTriesRemaining(filename, server.hostname) != 9) {
			await ns.tryWritePort(CONTRACT_PORT, JSON.stringify({filename: filename, hostname: server.hostname}));
		}
	}

	return contracts.length > 0;
}

/**
 * Perform all necessary actions for a server
 * 
 * @param {NS} ns
 * @param {Server} server The server to process
 * @param {number} level The server's distance to the start server
 * 
 * @return {Promise<ServerInfo>} The server information
 */
async function process_server(ns, server, level) {
	let server_info = new ServerInfo(server.hostname, level, server.purchasedByPlayer);

	if (server.purchasedByPlayer)
		return server_info;

	/* Check if player has necessary level to work with server */
	if (ns.getHackingLevel() < server.requiredHackingSkill) {
		server_info.level_req = false;
		return server_info;
	}
	server_info.level_req = true;

	/* Check for and take admin rights on server */
	if (!(server.hasAdminRights || root_server(ns, server))) {
		server_info.root_access = false;
		return server_info;
	}
	server_info.root_access = true;

	/* Check if backdoor is installed on server */
	/* TODO: Install backdoor when Singularity is available */
	server_info.backdoor = server.backdoorInstalled;

	/* Output if there are any hacking contracts on the server */
	server_info.coding_contract = await process_contracts(ns, server);

	/* If the server cannot have any money, use as exec server */
	/* Otherwise, if there are no running scripts draining the server of its money, prepare and run them */
	if (server.moneyMax === 0) {
		if (!EXEC_SERVERS.includes(server.hostname))
			EXEC_SERVERS = [server.hostname].concat(EXEC_SERVERS);
	} else {
		server_info.money_scripts = run_money_scripts(ns, server);
	}

	return server_info;
}

/**
 * Find all available servers and process them
 * 
 * @param {NS} ns
 * @param {Server} root The scan-root
 * @param {number} level The server's distance to the start server
 * @param {ServerInfo[]} server_info The list of server infos already gathered
 * 
 * @return {Promise<ServerInfo[]>}
 */
async function deepscan(ns, root, level = 0, server_info = []) {
	/**
	 * If the root was already scanned, do not scan it again
	 */
	if (server_info.find((s, _i, _arr) => s.hostname == root.hostname))
		return server_info;

	/**
	 * Process root and mark it as scanned
	 */
	server_info.push(await process_server(ns, root, level));

	/**
	 * Scan all servers directly connected to root
	 */
	for (let hostname of ns.scan(root.hostname))
		await deepscan(ns, ns.getServer(hostname), level + 1, server_info);

	return server_info;
}

/**
 * Disable logs for builtin functions
 * 
 * @param {NS} ns
 */
function disable_logs(ns) {
	ns.disableLog("brutessh");
	ns.disableLog("ftpcrack");
	ns.disableLog("relaysmtp");
	ns.disableLog("httpworm");
	ns.disableLog("sqlinject");
	ns.disableLog("nuke");

	ns.disableLog("getHackingLevel");
	ns.disableLog("getRunningScript");
	ns.disableLog("getScriptRam");
	ns.disableLog("getServer");

	ns.disableLog("exec");
	ns.disableLog("scp");
	ns.disableLog("sleep");
}

/**
 * Prints logs from list of server attributes
 * 
 * @param {NS} ns
 * @param {ServerInfo[]} server_info The list of server information to log
 * @param {(...args: any[]) => void} Function to use for logging
 */
function print_logs(ns, server_info, log_fun = ns.print) {
	for (let i = 0; i < server_info.length; ++i) {
		let si = server_info[i];
		let str = "";

		// Continue vertical lines needed for later servers and set indentation
		for (let l = 1; l < si.level; ++l) {
			if (server_info.find((v, j, _arr) => j > i && v.level <= l)?.level === l)
				str += "╎  "
			else
				str += "   ";
		}
		if (si.level > 0)
			str += "╎\n" + str;
		else if (i > 0)
			str += "\n";

		if (si.level > 0)
			// Check if this server is the last on this level and add horizontal line accordingly
			if ((server_info.find((v, j, _arr) => j > i && v.level <= si.level)?.level ?? -1) < si.level)
				str += "╰╌";
			else
				str += "╎╌";

		if (si.root_access || si.root_access === null && si.player_server)
			str += `${COLORS.default}✔`;
		else {
			if (si.level_req)
				str += COLORS.red;
			else
				str += COLORS.yellow;
			str += "✘";
		}
		str += si.hostname;

		if (si.money_scripts !== null) {
			if (si.money_scripts)
				str += COLORS.default;
			else
				str += COLORS.red;
			str += " ₿";
		}

		if (si.coding_contract)
			str += COLORS.red + " 🗎";

		if (si.backdoor)
			str += COLORS.default + " ⚑";

		str += COLORS.default;

		log_fun(str);
	}
}

/**
 * Main function for finding and processing all servers in a loop
 * 
 * @param {NS} ns
 */
export async function main(ns) {
	if (ns.getScriptRam(MONEY_SCRIPT, "home") > 1048576)
		throw RangeError("Money Script needs too much RAM");

	disable_logs(ns);

	EXEC_SERVERS = ns.getPurchasedServers().filter((name, i, arr) => {
		return (name.startsWith("money-server") || name.startsWith("exec-server"));
	}).concat(EXEC_SERVERS);

	while (true) {
		let server_info = await deepscan(ns, ns.getServer("home"));
		ns.clearLog();
		print_logs(ns, server_info, ns.print);
		await ns.sleep(60000);
	}
}
