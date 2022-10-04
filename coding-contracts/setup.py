from distutils.core import setup, Extension

clib = Extension("clib", sources = ["clib.c"])

setup(name = "clib", version = "1.0", description = "C library for bitburner coding contract functions", ext_modules = [clib])
