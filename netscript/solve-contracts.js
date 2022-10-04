const CONTRACT_PORT = 8;
const BASE_URL = "http://localhost:8080/solve_contract";

/** @param {NS} ns */
export async function main(ns) {
	while (true) {
		let contract;
		while ((contract = ns.readPort(CONTRACT_PORT)) !== "NULL PORT DATA") {
			contract = JSON.parse(contract);
			try {
				contract.type = ns.codingcontract.getContractType(contract.filename, contract.hostname);
				contract.data = ns.codingcontract.getData(contract.filename, contract.hostname);
			}
			catch {
				continue;
			}

			let res = await fetch(`${BASE_URL}?c_type=${contract.type}&data=${JSON.stringify(contract.data)}`);
			if (res.ok) {
				if (ns.codingcontract.attempt(await res.json(), contract.filename, contract.hostname))
				 	ns.print("Solved contract " + contract.filename + " on " + contract.hostname);
				else
					ns.print("Failed contract " + contract.filename + " on " + contract.hostname);
			}
			else
				ns.print("Server error for contract " + contract.filename + " on " + contract.hostname);
		}
		await ns.sleep(20000);
	}
}
