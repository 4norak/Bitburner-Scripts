# Coding Contracts

Scripts for solving Bitburner coding contracts.

## api.py

FastAPI api that accepts coding contract types and data and returns the solution.

## bitburner.py

Python library with functions for all coding contracts.

## clib.c

C-Extension used by bitburner.py. It contains C implementations for coding contract
functions that would be too slow in pure python.  
You can compile it using setup.py.

## setup.py

Compiles clib.c to a usable C-extension.
