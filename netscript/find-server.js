/**
 * Find the path to a server
 * 
 * @param {NS} ns
 * @param {Server} root The scan-root
 * @param {string} hostname The hostname of the server to search for
 * @param {string[]} path The path to the root, excluding the root itself
 * @param {string[]} already_scanned The list of servers already scanned
 * 
 * @return {string[]} The path to the searched server or null if it does not exist
 */
async function find_server(ns, root, server, path=[], already_scanned=[]) {
	/**
	 * If the root was already scanned, do not scan it again
	 */
	if (already_scanned.includes(root.hostname))
		return null;

	/**
	 * Mark root as scanned and process server (root)
	 */
	already_scanned.push(root.hostname);
	path = path.concat([root.hostname])
	if (root.hostname == server.hostname)
		return path;

	/**
	 * Scan all servers directly connected to root
	 */
	for (const h of ns.scan(root.hostname)) {
		let server_path = await find_server(ns, ns.getServer(h), server, path, already_scanned);
		if (server_path != null)
			return server_path;
	}

	return null;
}

/** @param {NS} ns */
export async function main(ns) {
	let args = ns.flags([
		["connect", false],
		["c", false]
	]);
	if (args["_"].length != 1)
		throw new RuntimeError("Invalid arguments");

	let path = await find_server(ns, ns.getServer("home"), ns.getServer(args["_"][0]));
	if (path == null) {
		ns.tprint("Server does not exist");
		ns.print("Server does not exist");
	}
	else {
		let s;
		if (args["c"] || args["connect"])
			s = "home; connect " + path.slice(1).join("; connect ");
		else
			s = path.join(" -> ");

		ns.tprint(s);
		ns.print(s);
	}
}
