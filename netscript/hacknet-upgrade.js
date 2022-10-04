/** @param {NS} ns */
export async function main(ns) {
	const data = ns.flags([
		["level", 0],
		["cores", 0],
		["ram", 0]
	]);
	const NODE = data["_"][0];
	while (ns.hacknet.getNodeStats(NODE).level < data["level"] && ns.hacknet.upgradeLevel(NODE, 1)) {}
	while (ns.hacknet.getNodeStats(NODE).cores < data["cores"] && ns.hacknet.upgradeCore(NODE, 1)) {}
	while (ns.hacknet.getNodeStats(NODE).ram < data["ram"] && ns.hacknet.upgradeRam(NODE, 1)) {}
}
