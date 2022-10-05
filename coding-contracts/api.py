from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ProcessPoolExecutor, wait
from json import loads
from traceback import format_exc

import bitburner


# Helper functions because lambda functions cannot be pickled
def _total_ways_sum_II(data):
    return bitburner.total_ways_sum(*data)

def _array_jump_game(data):
    return int(bitburner.array_jump_num(data) != -1)

def _array_jump_game_II(data):
    return max(0, bitburner.array_jump_num(data))

def _algorithm_stock_I(data):
    return bitburner.algorithmic_stock(data, 1)

def _algorithm_stock_II(data):
    return bitburner.algorithmic_stock(data, len(data)//2)

def _algorithm_stock_III(data):
    return bitburner.algorithmic_stock(data, 2)

def _algorithm_stock_IV(data):
    return bitburner.algorithmic_stock(data[1], data[0])

def _unique_paths_grid_I(data):
    return bitburner.unique_paths_grid_I(*data)

def _find_val_exp(data):
    return bitburner.find_val_exp(*data)

def _two_color(data):
    return bitburner.two_color(*data)

def _encrypt_caesar(data):
    return bitburner.encrypt_caesar(*data)

def _encrypt_vigenere(data):
    return bitburner.encrypt_vigenere(*data)

contract_funs = {
    "Find Largest Prime Factor": bitburner.find_largest_prime_factor,
    "Subarray with Maximum Sum": bitburner.subarray_max_sum,
    "Total Ways to Sum": bitburner.total_ways_sum,
    "Total Ways to Sum II": _total_ways_sum_II,
    "Spiralize Matrix": bitburner.spiralize_matrix,
    "Array Jumping Game": _array_jump_game,
    "Array Jumping Game II": _array_jump_game_II,
    "Merge Overlapping Intervals": bitburner.merge_overlapping_intervals,
    "Generate IP Addresses": bitburner.generate_ips,
    "Algorithmic Stock Trader I": _algorithm_stock_I,
    "Algorithmic Stock Trader II": _algorithm_stock_II,
    "Algorithmic Stock Trader III": _algorithm_stock_III,
    "Algorithmic Stock Trader IV": _algorithm_stock_IV,
    "Minimum Path Sum in a Triangle": bitburner.min_path_sum_triangle,
    "Unique Paths in a Grid I": _unique_paths_grid_I,
    "Unique Paths in a Grid II": bitburner.unique_paths_grid_II,
    "Shortest Path in a Grid": bitburner.shortest_path_grid,
    "Sanitize Parentheses in Expression": bitburner.sanitize_parentheses,
    "Find All Valid Math Expressions": _find_val_exp,
    "HammingCodes: Integer to Encoded Binary": bitburner.hamming_i2b,
    "HammingCodes: Encoded Binary to Integer": bitburner.hamming_b2i,
    "Proper 2-Coloring of a Graph": _two_color,
    "Compression I: RLE Compression": bitburner.rle_compression,
    "Compression II: LZ Decompression": bitburner.lz_decompression,
    "Compression III: LZ Compression": bitburner.lz_compression,
    "Encryption I: Caesar Cipher": _encrypt_caesar,
    "Encryption II: Vigenère Cipher": _encrypt_vigenere
}


app = FastAPI()
pool = ProcessPoolExecutor()


origins = [
    "http://localhost",
    "http://localhost:8080",
    "https://danielyxie.github.io"
]

app.add_middleware(CORSMiddleware, allow_origins=origins)


@app.get("/solve_contract")
def solve_contract(c_type: str, data: str):
    data = loads(data)

    if c_type not in contract_funs.keys():
        raise HTTPException(status_code=400, detail=f"Unknown coding contract `{c_type}`")

    try:
        # Run in own process to prevent blocking main process
        return pool.submit(contract_funs[c_type], data).result()
    except Exception:
        raise HTTPException(status_code=500, detail=format_exc())

@app.get("/ping")
def ping():
    return "pong"
