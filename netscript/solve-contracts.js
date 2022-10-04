const CONTRACT_PORT = 8;
const BASE_URL = "http://localhost:8080/solve_contract";
const COLORS = {
	"red": "\x1b[31m",
	"yellow": "\x1b[38;5;227m",
	"default": "\x1b[0m"
}

// TODO: Contract class

/**
 * Set information about a contract
 * 
 * @param {NS} ns
 * @param {any} contract The contract containing file- and hostname
 * 
 * @return {boolean} If the information were set successfully
 */
function set_contract_info(ns, contract) {
	try {
		contract.type = ns.codingcontract.getContractType(contract.filename, contract.hostname);
		contract.data = ns.codingcontract.getData(contract.filename, contract.hostname);
		return true;
	}
	catch {
		return false;
	}
}


/**
 * Return the error file for the contract
 * 
 * @param {any} contract The contract to return the error file to
 * 
 * @return {string} The contract's error file's name
 */
function get_err_file(contract) {
	return "contract-error-" + contract.filename.replace(".cct", ".txt");
}

/**
 * Write an error to a contract error file
 * 
 * @param {NS} ns
 * @param {any} contract The contract that raised the error
 * @param {any} error A JSON-serializable error to write to the file
 */
function write_error(ns, contract, error) {
	let err_file = get_err_file(contract);
	
	ns.write(err_file, JSON.stringify(error), "w");
	ns.scp(err_file, contract.hostname);
	ns.rm(err_file);
}

/**
 * Fetch answer for coding contract
 * 
 * @param {NS} ns
 * @param {any} contract The coding contract to fetch the answer to
 * 
 * @return {any} The answer to the contract
 */
async function fetch_answer(ns, contract) {
	let res;
	try {
		res = await fetch(`${BASE_URL}?c_type=${contract.type}&data=${JSON.stringify(contract.data)}`);
	} catch (err) {
		return null;
	}

	if (!res.ok) {
		throw {type: contract.type, data: contract.data, error_code: res.status, error: await res.text()};
	}

	try {
		res = await res.json();
	} catch(err) {
		throw {type: contract.type, data: contract.data, error: "Answer could not be parsed", answer: await res.text()};
	}

	return res;
}

/**
 * Disable internal functions' logs
 * 
 * @param {NS} ns
 */
function disable_logs(ns) {
	ns.disableLog("disableLog");

	ns.disableLog("readPort");

	ns.disableLog("rm");
	ns.disableLog("scp");
	ns.disableLog("sleep");
	ns.disableLog("write");

	ns.disableLog("codingcontract.attempt");
	ns.disableLog("codingcontract.getContractType");
	ns.disableLog("codingcontract.getData");
}

/** @param {NS} ns */
export async function main(ns) {
	disable_logs(ns);

	while (true) {
		let contract;
		while ((contract = ns.readPort(CONTRACT_PORT)) !== "NULL PORT DATA") {
			contract = JSON.parse(contract);
			if (!set_contract_info(ns, contract))
				continue;

			let answer;
			try {
				if (!(answer = await fetch_answer(ns, contract))) {
					ns.print(COLORS.yellow + "Temporary error for " + contract.filename + " on " + contract.hostname + COLORS.default);
					continue;
				}
			}
			catch (err) {
				write_error(ns, contract, err);
				ns.print(COLORS.red + "Contract error for contract " + contract.filename + " on " + contract.hostname + COLORS.default);
			}

			if (ns.codingcontract.attempt(answer, contract.filename, contract.hostname)) {
				let err_file = get_err_file(contract);
				if (ns.fileExists(err_file, contract.hostname))
					ns.rm(err_file, contract.hostname);
				
				ns.print("Solved contract " + contract.filename + " on " + contract.hostname);
			}
			else {
				write_error(ns, contract, {type: contract.type, data: contract.data,
										   error: "Wrong answer", answer: answer});
				ns.print(COLORS.red + "Failed contract " + contract.filename + " on " + contract.hostname + COLORS.red);
			}
		}
		await ns.sleep(60000);
	}
}
