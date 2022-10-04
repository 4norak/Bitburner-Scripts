let exp = 0;

/**
 * Process single server
 * 
 * @param {NS} ns
 * @param {Server} server
 */
function process_server(ns, server) {
	ns.print(server.hostname);
	for (const proc of ns.ps(server.hostname)) {
		let skript = ns.getRunningScript(proc.pid);
		exp += skript.onlineExpGained / skript.onlineRunningTime;
	}
}

/**
 * Find all available servers and process them
 * 
 * @param {NS} ns
 * @param {Server} root The scan-root
 * @param {string[]} already_scanned The list of servers already scanned
 */
function deepscan(ns, root, already_scanned=[]) {
	/**
	 * If the root was already scanned, do not scan it again
	 */
	if (already_scanned.includes(root.hostname))
		return;

	/**
	 * Mark root as scanned and process server (root)
	 */
	already_scanned.push(root.hostname);
	process_server(ns, root);

	/**
	 * Scan all servers directly connected to root
	 */
	ns.scan(root.hostname)
		.forEach((hostname, _i, _arr) => deepscan(ns, ns.getServer(hostname), already_scanned));
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
	ns.disableLog("getHostname");
	ns.disableLog("getRunningScript");
	ns.disableLog("getScriptName");
	ns.disableLog("getScriptRam");
	ns.disableLog("getServer");

	ns.disableLog("exec");
	ns.disableLog("grow");
	ns.disableLog("ls");
	ns.disableLog("scan");
	ns.disableLog("scp");
	ns.disableLog("sleep");
}

/**
 * Main function for finding and processing all servers in a loop
 * 
 * @param {NS} ns
 */
export async function main(ns) {
	disable_logs(ns);

	deepscan(ns, ns.getServer("home"));

	ns.tprint(exp);
}
