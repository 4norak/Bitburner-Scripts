/** @param {NS} ns */
export async function main(ns) {
	const server = ns.args[0];
	const HGW_OPTS = {threads: ns.getRunningScript(ns.getScriptName(), ns.getHostname(), ...ns.args).threads};

	/* Grow server money to a reasonably large sum */
	while (await ns.grow(server, HGW_OPTS) > 1.04) { }

	while(true) {
		for(let j = 0; j < 10; j++) {
			if (await ns.hack(server, HGW_OPTS))
				await ns.grow(server, HGW_OPTS);
		}
		await ns.weaken(server, HGW_OPTS);
		if(ns.getServerSecurityLevel(server) > ns.getServerMinSecurityLevel(server)) {
			await ns.weaken(server, HGW_OPTS);
			await ns.weaken(server, HGW_OPTS);
		}
	}
}
