# Netscript

Internal Bitburner netscript scripts.

## augment-price.js

Calculate the price for buying augmentations with the given base prices in the
given order.

## current-exp-gain.js

Calculates the current hacking exp gain across all running scripts.

## find-server.js

Finds a server by hostname and displays the path from home.  
If `-c` or `--connect` is given, it displays a connect command instead.

## hacknet-upgrade.js

Upgrades a hacknet node to the specified level, ram and cores.  

### Arguments

| Switch | Meaning |
|:------:|:--------|
| `--level` | The level to upgrade the node to |
| `--ram` | The RAM to upgrade the node to |
| `--cores` | The cores to upgrade the node to |

## hackscan.js

Starts necessary hacking scripts and monitors and displays status information
about them.  

### Symbols

| Symbol | Meaning |
|:------:|:--------|
| `✘` | Player does not have root access to the server |
| `✔` | Player has root access to the server |
| `₿` | There are money scripts running for the server |
| `🗎` | There is a coding contract on the server |
| `⚑` | There is a backdoor on the server |

### Colors

| Color | Meaning |
|:-----:|:--------|
| Default | Everything is fine |
| Yellow | Something is not perfect but manual intervention is not necessary/useful |
| Red | Something is wrong, manual intervention is necessary |

## money-script.js

Script to gain money from server.  
It also slowly weakens the server.

### Arguments

| Argument | Meaning |
|:--------:|:--------|
| `_` | The hostname of the server to gain money from |

## monitor.js

Monitors and displays the status of services.

## solve-contracts.js

Solves contracts by using the api in [coding-contracts](/coding-contracts).  
Contracts are given to it by encoding `{"filename": filename, "hostname": hostname}`
as JSON and sending them to the contract port specified as a constant.

## trading.js

Automatically buys and sells long shares at the stock market.
