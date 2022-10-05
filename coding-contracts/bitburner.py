from __future__ import annotations as _annotations
from collections.abc import Iterable as _Iterable
import itertools as _itertools
import re as _re

from clib import largest_prime_factor as _c_prime_fac


def hamming_i2b(num: int) -> str:
    """
    Calculates the extended hamming code for the given number.
    The parity bits use big endian, the data bits little endian.

    :param num: The number to calculate the hamming code for

    :return: The hamming encoded number in binary format as a string
    """

    num = [int(b, 2) for b in bin(num)[2:]]

    num.insert(0, 0)
    p = 1
    while p < len(num):
        num.insert(p, 0)
        p *= 2
    p //= 2

    while p > 0:
        s = 0

        for i in range(p, len(num), p * 2):
            s += sum(num[i:i + p])

        num[p] = s % 2
        p //= 2

    num[0] = sum(num) % 2

    return "".join(map(str, num))


def hamming_b2i(code: str) -> int:
    """
    Calculate integer value from hamming encoded string while correcting
    1-bit-errors and detecting 2-bit-errors.

    :param code: The hamming code

    :return: The number encoded in code
    """

    code = [int(c, 2) for c in code]

    # Calculate error bits
    error = 0
    p = 1
    while p < len(code):
        s = 0

        for i in range(p, len(code), p * 2):
            s += sum(code[i:i + p])

        error |= (s % 2)*p
        p *= 2

    # Error exists but overall parity is even -> two bit error
    if error != 0 and (sum(code) % 2) == 0:
        raise RuntimeError("Two bit error detected")

    code[error] = (code[error] + 1) % 2

    # Remove error bits from code
    p //= 2
    while p > 0:
        code.pop(p)
        p //= 2
    code.pop(0)

    return int("".join(map(str, code)), 2)


def rle_compression(plain: str) -> str:
    """
    Compresses a string using RLE.

    :param plain: The string to compress

    :return: The compressed string
    """

    compressed = ""

    while plain:
        l = len(plain)
        c = plain[0]
        plain = plain.lstrip(c)

        compressed += f"9{c}"*((l - len(plain)) // 9)
        if r := ((l - len(plain)) % 9):
            compressed += f"{(l - len(plain)) % 9}{c}"

    return compressed


def algorithmic_stock(prices: tuple[int], num_transactions: int) -> int:
    """
    Get maximum gain from at most num_transactions transactions from transactions.

    :param prices: The list of prices
    :param num_transactions: The maximum number of transactions allowed
    :param part_sum: The base gain from already chosen transactions, used for recursion

    :return: The maximum amount of money earnable under the given circumstances
    """

    def _get_transactions(prices: tuple[int]) -> _Iterable[tuple[tuple[int,int],int]]:
        """
        Get all transactions possible for the given prices.

        :param prices: The list of prices

        :return: An iterator over all transactions possible
        """

        return filter(lambda x: x[1] > 0, map(lambda x: (x, prices[x[1]] - prices[x[0]]), _itertools.combinations(range(len(prices)), r=2)))

    def _remove_overlapping(transactions: tuple[tuple[tuple[int,int],int]], element: tuple[tuple[int,int],int]) -> _Iterable[tuple[tuple[int,int],int]]:
        """
        Remove all elements from transactions that overlap with element.

        :param transactions: The transactions to filter
        :param element: The element overlapping

        :return: An iterator over all elements from transactions that do not overlap with element
        """

        return filter(lambda x: not (element[0][0] <= x[0][0] <= element[0][1] or element[0][0] <= x[0][1] <= element[0][0]), transactions)

    def _get_max_transaction_gain(transactions: _Iterable[tuple[tuple[int,int],int]], num_transactions: int, part_sum: int = 0) -> int:
        """
        Get maximum gain from at most num_transactions transactions from transactions.

        :param transactions: The possible transactions to choose from
        :param num_transactions: The maximum number of transactions allowed
        :param part_sum: The base gain from already chosen transactions, used for recursion

        :return: The maximum amount of money earnable under the given circumstances
        """

        if num_transactions <= 0:
            return part_sum
        max_sum = part_sum
        transactions = tuple(transactions)
        for i, t in enumerate(transactions):
            if (s := _get_max_transaction_gain(_remove_overlapping(transactions[i:], t), num_transactions - 1, part_sum + t[1])) > max_sum:
                max_sum = s
        return max_sum

    trs = tuple(filter(lambda x: x[1] > 0, _get_transactions(prices)))
    return _get_max_transaction_gain(filter(lambda x: not any(map(lambda y: y != x and x[0][0] <= y[0][0] and y[0][1] <= x[0][1] and y[1] >= x[1], trs)), trs),
                                     num_transactions)


def array_jump_num(array: tuple[int], index: int = 0, jumps: int = 0) -> int:
    """
    Given an array of maximum jump lengths from the respective positions,
    determine the minimum number of jumps to get to the end or -1 if it
    is impossible.

    :param array: The array of jump lengths
    :param index: The current postion in the array, used for recursion

    :return: The minimum number of jumps to the end or -1
    """

    if index >= len(array):
        return -1

    if index == len(array) - 1:
        return jumps

    min_jumps = -1
    for j in range(1, array[index] + 1):
        if (jmp := array_jump_num(array, index + j, jumps + 1)) != -1 and (min_jumps == -1 or jmp < min_jumps):
            min_jumps = jmp

    return min_jumps


def find_val_exp(digits: str, result: int, operators: tuple[str] = ("+", "-", "*")) -> list[str]:
    """
    Find all possibilities to add mathematical operators to a string of
    digits to get a specific result. Numbers in the returned expressions
    will not have leading zeroes.

    !Warning! This function uses eval on strings created from digits and
    operators. Therefore it should be ran with arbitrary user input.

    :param digits: The string of digits to add the operators to
    :param result: The desired calculation result
    :param operators: The operators to add

    :return: All possible mathematical expressions equaling the result as strings
    """

    expressions = []

    # For all possible numbers of operators
    for n in range(1, len(digits)):
        # For all possible n-length combinations and permutations of operators
        for ops in _itertools.product(operators, repeat=n):
            # For all possible positions of the n operators
            for inds in _itertools.combinations(range(1, len(digits)), r=n):

                # Build expression
                inds += (len(digits),)
                expr = digits[:inds[0]]
                for i in range(n):
                    expr = f"{expr}{ops[i]}{digits[inds[i]:inds[i+1]]}"

                # Prevent leading zeroes in expressions
                if _re.search(r"(^|\D)0\d", expr):
                    continue

                # Add expressions equaling result to expressions, ignore
                # all invalid ones and wrong results
                try:
                    if eval(expr) == result:
                        expressions.append(expr)
                except:
                    pass

    return expressions


def sanitize_parentheses(expression: str) -> list[str]:
    """
    Sanitize the given parentheses expression by removing the miniumum
    number of parentheses to make it valid.

    :param expression: The expression to sanitize

    :return: The possible results
    """

    def _validate_expression(expr: str):
        """
        Check if a parentheses expression is valid, ignoring everything
        that is not a perenthesis.

        :param expr: The expression to validate

        :return: If the expression is valid
        """
        level = 0
        for c in expr:
            if c == "(":
                level += 1
            elif c == ")":
                if level <= 0:
                    return False
                level -= 1
        return level == 0

    for length in range(len(expression), -1, -1):
        valid = list(set(filter(_validate_expression, map("".join, _itertools.combinations(expression, r=length)))))
        if valid:
            return valid


def find_largest_prime_factor(number: int) -> int:
    """
    Find a number's largest prime factor.

    :param number: The number

    :return: The number's largest prime factor
    """

    return _c_prime_fac(number)


def encrypt_caesar(plain: str, offset: int) -> str:
    """
    Encrypt a string using caesar encryption with left shift by offset.

    :param plain: The plain text string
    :param offset: The offset to shift by

    :return: The encrypted string
    """

    return encrypt_vigenere(plain, "".join(map(lambda c: chr((ord('A') if c.isupper() else ord('a')) + (-offset % 26)), plain)))


def encrypt_vigenere(plain: str, key: str) -> str:
    """
    Encrypt a plain text string using vigenere.

    :param plain: The plain text
    :param key: The encryption key

    :return: The cyphertext
    """

    def _encrypt_char(char: str, char_key: str) -> str:
        """
        Encrypt a single character using vigenere.

        :param char: The character to encrypt
        :param char_key: The encryption key

        :return: The encrypted character
        """

        assert len(char) == len(char_key) == 1, "character and key must have length 1"

        if not char.isalpha():
            return char

        if char.isupper():
            assert char_key.isupper(), "character and key must have same capitalization"
            base = ord("A")
        else:
            assert char_key.islower(), "character and key must have same capitalization"
            base = ord("a")

        return chr((((ord(char) - base) + (ord(char_key) - base)) % 26) + base)

    return "".join(map(lambda x: _encrypt_char(*x), zip(plain, _itertools.cycle(key))))


def shortest_path_grid(grid: list[list[int]]) -> str:
    """
    Return the shortest path in a rectangular grid from the upper left to the
    lower right corner.

    :param grid: The grid as a 2-dimensional list, obstacles are denoted by
    1, empty fields by 0

    :return: The path as UDLR-string
    """

    def _generate_distance_grid(grid: list[list[int]]) -> list[list[int]]:
        """
        Generate grid of distances initialized with maximum possible distances
        in grid.

        :param grid: The original grid

        :return: Grid of distances
        """

        fields = sum(map(lambda row: len(row), grid))

        return list(map(lambda x: [fields] * len(x), grid))

    def _get_shortest_path(grid: list[list[int]], distances: list[list[int]],
                           path: list[tuple[int,int]] = [(0,0,)]) -> list[tuple[int,int]]:
        """
        Get shortest path from pos to lower right corner.

        :param grid: The grid
        :param distances: The distances to all fields in the grid
        :param pos: The current path from the upper left corner to the current
        position as a list of positions

        :return: The shortest path as list of positions
        """

        pos = path[-1]

        if pos == (len(grid) - 1,len(grid[-1]) - 1,):
            return path

        directions = [(0,1,),(1,0,),(0,-1,),(-1,0,)]

        if distances[pos[0]][pos[1]] <= len(path):
            return None

        distances[pos[0]][pos[1]] = len(path)

        min_path = None
        for d in directions:

            pos = (path[-1][0] + d[0], path[-1][1] + d[1],)
            if not (0 <= pos[0] < len(grid) and 0 <= pos[1] < len(grid[0])):
                continue
            if grid[pos[0]][pos[1]] == 1:
                continue

            p = _get_shortest_path(grid, distances, path + [pos])
            if min_path is None or p is not None and len(p) < len(min_path):
                min_path = p

        return min_path

    assert len(set(map(lambda row: len(row), grid))) == 1, "grid must be rectangular"

    distances = _generate_distance_grid(grid)

    dir_map = {(0,1): "R", (0,-1): "L", (1,0): "D", (-1,0): "U"}

    path = _get_shortest_path(grid, distances) or []
    dirs = ""
    for i in range(len(path) - 1):
        dirs += dir_map[(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1],)]

    return dirs


def generate_ips(base: str) -> list[str]:
    """
    Set dots in base to generate valid IPv4s and return all valid
    combinations.

    :param base: A string with digits to generate the IPs from

    :return: All valid generated IPs
    """

    def _is_valid(ip: list[str]) -> bool:
        """
        Check if ip is a valid IPv4.

        :param ip: The IP as list of individual parts

        :return: If the given IP is valid
        """
        return all(len(x) != 0 and not (x[0] == "0" and len(x) > 1) and 0 <= int(x) <= 255 for x in ip)

    # If base cannot be split to valid IP
    if not (4 <= len(base) <= 12):
        return []

    # List to collect valid IPs
    valid: list[str] = []

    # For all possibilities to split base in 4 parts
    for inds in _itertools.combinations(range(1,len(base) - 1), r=3):
        # Split base by indices
        inds += (len(base),)
        ip: str = [base[0:inds[0]]]
        for i in range(3):
            ip.append(base[inds[i]:inds[i+1]])

        # Append ip to valid, if it is valid
        if _is_valid(ip):
            valid.append(".".join(ip))

    return valid


def total_ways_sum(target: int, nums: _Iterable[int] = None) -> int:
    """
    Return the number of distinct ways to write target as a sum.
    If num is kept at the default, the target itself will not be counted as
    a valid solution. If nums is explicitely specified and contains the
    target, it will be counted as a solution.

    :param target: The sum target
    :param nums: The numbers to choose for the sum. Default is all positive integers

    :return: The number of distinct summands from nums equaling target
    """

    def _total_ways_sum(target: int, nums: _Iterable[int]) -> int:
        """
        Recursively compute the total number of distinct ways to write
        target as a sum of integers from nums.

        :param target: The sum target
        :param nums: The numbers to choose from for the sum

        :return: The number of distinct summands from nums equaling target
        """

        if not hasattr(_total_ways_sum, "cache"):
            _total_ways_sum.cache = {}

        if target < 0:
            return 0
        elif target == 0:
            return 1

        num = 0
        nums = tuple(sorted(nums, reverse=True))

        if (n := _total_ways_sum.cache.get((target, nums,), None)) is not None:
            return n

        for n in nums:
            num += _total_ways_sum(target - n, filter(lambda x: x <= n, nums))

        _total_ways_sum.cache[(target, nums,)] = num

        return num

    if nums is None:
        nums = range(target - 1, 0, -1)

    num = _total_ways_sum(target, set(nums))
    del _total_ways_sum.cache

    return num


def spiralize_matrix(matrix: list[list[int]]) -> list[int]:
    """
    Create a one dimensional list from a two dimensional matrix by
    spiralizing the matrix.

    :param matrix: The matrix to spiralize

    :return: The spiralized matrix as a one dimensional list
    """

    def _pop_col(matrix: list[list[int]], n: int) -> list[int]:
        """
        Remove the n-th column from matrix and return it.

        :param matrix: The matrix
        :param n: Column number

        :return: The n-th column from matrix
        """

        col = []
        i = 0
        while i < len(matrix):
            col.append(matrix[i].pop(n))
            if not matrix[i]:
                matrix.pop(i)
            else:
                i += 1
        return col

    spiral = []
    functions = [lambda m: m.pop(0), # Pop and return first row
                 lambda m: _pop_col(m, -1), # Pop and return last column
                 lambda m: m.pop(-1)[::-1], # Pop and return last row reversed
                 lambda m: _pop_col(matrix, 0)[::-1]] # Pop and return first column reversed
    i = 0
    while matrix:
        spiral += functions[i % 4](matrix)
        i += 1

    return spiral


def min_path_sum_triangle(triangle: list[list[int]], pos: tuple[int] = (0,0,)) -> int:
    """
    Return the minimal path sum from the top of the triangle to the bottom
    when only moving to adjacent fields in the row below for every step.

    :param triangle: The triangle to move in
    :param pos: The current position (default is the top)

    :return: The minimal path sum
    """

    cur_sum = triangle[pos[0]][pos[1]]

    # If we reached the bottom, return the current field's value
    if pos[0] == len(triangle) - 1:
        return triangle[pos[0]][pos[1]]

    return (triangle[pos[0]][pos[1]]
            + min(min_path_sum_triangle(triangle, (pos[0] + 1, pos[1],)),
                  min_path_sum_triangle(triangle, (pos[0] + 1, pos[1] + 1,))))


def subarray_max_sum(array: list[int]):
    """
    Find the contiguous sub array with the largest sum in array. And return
    its sum. The sub array must contain at least one element.

    :param array: The array to chose the sub arrays from.

    :return: The sum of the sub array with the largest sum
    """

    # If all values in the array are negative, return the largest one
    if not tuple(filter(lambda n: n > 0, array)):
        return max(array)

    max_sum = 0
    for i in range(len(array)):
        # Skip negative values as sub array start
        if array[i] <= 0:
            continue

        s = 0
        # All sub arrays from index i to end
        for j in range(i, len(array)):
            # Keep track of sum in sub array
            s += array[j]

            # If sum of sub array is negative, it cannot be or become
            # the largest sum
            if s <= 0:
                break

            # New largest sum of sub array
            if s > max_sum:
                max_sum = s

    return max_sum


def unique_paths_grid_I(width, height) -> int:
    """
    Return the number of unique paths in a grid from the top left corner
    to the bottom right corner while only moving right or down.

    :param width: The grid width
    :param height: The grid height

    :return: The number of unique paths
    """

    # Larger number is always height
    if width < height:
        return unique_paths_grid_I(height, width)

    if height <= 0:
        return 0
    elif height == 1:
        return 1

    num_paths = 0
    for h in range(height, 0, -1):
        num_paths += unique_paths_grid_I(width - 1, h)

    return num_paths


def unique_paths_grid_II(grid: list[list[int]], pos: tuple[int,int] = (0,0,)) -> int:
    """
    Return the number of unique paths in the grid from the top left corner
    to the top right corner while only moving right and down.
    The grid consists of 1s and 0s. 0s are empty fields, 1s are obstacles.

    :param grid: The grid to walk through
    :param pos: The current position. Used for recursion

    :return: The number of unique paths
    """

    # If we reached the bottom left corner, a path was found
    if pos == (len(grid) - 1, len(grid[-1]) - 1,):
        return 1
    # If we reached a dead end
    if pos[0] >= len(grid) or pos[1] >= len(grid[pos[0]]) or grid[pos[0]][pos[1]] == 1:
        return 0

    return (unique_paths_grid_II(grid, (pos[0] + 1, pos[1]))
            + unique_paths_grid_II(grid, (pos[0], pos[1] + 1)))


def merge_overlapping_intervals(intervals: list[list[int]]) -> list[list[int]]:
    """
    Merge overlapping intervals from list and return result in ascending order.

    :param intervals: The intervals to merge
    """

    intervals = sorted(intervals)
    res = [intervals[0]]

    for inv in intervals:
        if inv[0] <= res[-1][1]:
            res[-1][1] = max(res[-1][1], inv[1])
        else:
            res.append(inv)

    return res


def lz_decompression(compressed: str) -> str:
    """
    Decompress an LZ-compressed string and return the plain text.

    :param compressed: The compressed string

    :return: The plain text
    """

    def _append_offset(text: str, offset: int, length: int) -> str:
        """
        Append characters to text from offset in text.

        :param text: The base text
        :param offset: The position of the first character from the end
        of text
        :param length: The length of the string to append

        :return: text with the appended string
        """

        for i in range(len(text) - offset, len(text) - offset + length):
            text += text[i]

        return text

    plain = ""
    i = 0
    chunk = 0
    while i < len(compressed):
        # Length of zero means skip chunk
        if compressed[i] == "0":
            i += 1
            chunk = not chunk
            continue

        # Simply copy length chars from compressed data to plain
        if not chunk:
            plain += compressed[i + 1:i + 1 + int(compressed[i])]
            i += int(compressed[i]) + 1
        # Repeat length chars from previous occurrence in plain
        else:
            plain = _append_offset(plain, int(compressed[i + 1]),
                                   int(compressed[i]))
            i += 2

        chunk = not chunk

    return plain


def old_lz_compression(plain: str) -> str:
    """
    Compress a string using LZ compression. This function is faster but does
    not always generate optimal results.

    :param plain: The string to compress

    :return The compressed string
    """

    def _longest_prev_occ(text: str, pos: int) -> tuple[int,int]:
        """
        Return the length and offset for the longest substring starting
        from pos having an occurrence starting from a position before pos.

        :param text: The text to search the substring in
        :param pos: The start of the substring to find

        :return: The length and the offset (from the end) of the found
        substring
        """

        for end in range(len(text), pos - 1, -1):
            if (i := text.find(text[pos:end], max(0, pos - 9))) != -1 and i < pos:
                return (end - pos, pos - i,)

        return (0,0)

    compressed = []
    block_start = 0
    i = 0
    while i < len(plain):
        # Block must not be longer than 9 characters (+ start)
        if len(compressed) - block_start == 10:
            # If following type 2 block can be used instead of skipped
            if (prev := _longest_prev_occ(plain, i))[0] >= 1:
                prev = (min(prev[0], 9), prev[1])
                compressed += list(prev)
                i += prev[0]
            else:
                compressed.append(0)
            block_start = len(compressed)
            continue
        # If block has not been started with length specifier
        elif block_start == len(compressed):
            compressed.append(0)

        # If type 2 block would be better than continuing copy
        if (prev := _longest_prev_occ(plain, i))[0] >= 3:
            prev = (min(prev[0], 9), prev[1])
            compressed += list(prev)
            i += prev[0]
            block_start = len(compressed)
        # Continue copy otherwise
        else:
            compressed.append(plain[i])
            compressed[block_start] += 1
            i += 1

    return compressed
    #return "".join(map(str, compressed))


def lz_compression(plain: str, part_comp: list[int|str] = [0], index: int = 0, block_start: int = 0) -> str:
    """
    Recursive function for LZ compression. This function is slower but always
    generates optimal results.

    :param plain: The plain string to compress
    :param part_comp: Partial compression of string, used for recursion
    :param index: Current index in plain, used for recursion
    :param block_start: Start of current compression block, used for recursion

    :return: The LZ compressed string
    """

    def _longest_prev_occ(text: str, pos: int) -> tuple[int,int]:
        """
        Return the length and offset for the longest substring starting
        from pos having an occurrence starting from a position before pos.

        :param text: The text to search the substring in
        :param pos: The start of the substring to find

        :return: The length and the offset (from the end) of the found
        substring
        """

        for end in range(len(text), pos - 1, -1):
            # TODO: Maybe find last appicable occurrence instead of first
            if (i := text.find(text[pos:end], max(0, pos - 9))) != -1 and i < pos:
                return (end - pos, pos - i,)

        return (0,0)

    # If plain is already fully compressed, return compressed string
    if index == len(plain):
        # If compression contains trailing 0, remove it
        if part_comp[-1] == 0:
            part_comp.pop()
        return "".join(map(str, part_comp))
        #return part_comp

    # Dummy strings with length always >= compressed version to allow
    # graceful return of shorter version
    c1 = c2 = "0" * (len(plain) * 2 + 1)

    # Version 1: If copy-block is not exhausted, append character and recurse from there
    if part_comp[block_start] < 9:
        p = list(part_comp)
        p[block_start] += 1
        p.append(plain[index])

        c1 = lz_compression(plain, p, index + 1, block_start)

    # Version 2: If copy block is exhausted or repeat-block might be better, add repeat
    # block and recurse from there
    if (prev := _longest_prev_occ(plain, index))[0] >= 2 or part_comp[block_start] == 9:
        p = list(part_comp)
        prev = (min(prev[0], 9), prev[1])
        if prev[0] == 0:
            p.append(0)
        else:
            p += list(prev)
        p.append(0)

        c2 = lz_compression(plain, p, index + prev[0], len(p) - 1)

    # Return shorter version
    if len(c1) == len(c2) == len(plain) * 2:
        raise RuntimeError("Could not find valid compression")
    if len(c2) < len(c1):
        return c2
    return c1


def two_color(vertex_num: int, edges: list[tuple[int,int]]) -> list[int] | None:
    """
    Create a two coloring for a given graph.

    :param vertex_num: The number of vertices in the graph
    :param edges: The graph's edges as an edge list

    :return: A proper two coloring for the graph or None if none exists
    """

    def _color_from(root: int, edges: list[list[int]], colors: list[bool|None]) -> bool:
        """
        Create partial two coloring from already colored root vertice.
        This function colors all vertices connected to root directly or
        indirectly using depth first search.

        :param root: The root vertice to color from
        :param edges: The graph's edges
        :param colors: List of colors for all vertices
        """

        # For all vertices directly connected to root
        for v in edges[root]:
            # If it has the same color as root, no proper two coloring is
            # possible
            if colors[v] == colors[root]:
                return False
            # If it already has the necessary color, it has already been
            # processed, so continue
            elif colors[v] is not None:
                continue

            colors[v] = not colors[root]
            # Recurse by using v as root
            if not _color_from(v, edges, colors):
                return False

        return True

    if vertex_num <= 0:
        return []

    # Generate a list mapping all vertices to their direct neighbors
    vertex_edges = [set() for _ in range(vertex_num)]
    for e in edges:
        if e[0] == e[1]:
            continue

        vertex_edges[e[0]].add(e[1])
        vertex_edges[e[1]].add(e[0])
    # Initialize color list for vertices
    colors = [None for _ in range(vertex_num)]

    for v in range(vertex_num):
        # If vertice is already colored, it has already been processed, so
        # continue
        if colors[v] is not None:
            continue

        # If the vertice is not colored yet, it is not connected to any
        # vertice with a lower index. Therefore, its color can be chosen freely
        # and all nodes connected to it can be colored accordingly
        colors[v] = 0
        if not _color_from(v, vertex_edges, colors):
            return []

    # Convert booleans to ints
    return list(map(int, colors))
