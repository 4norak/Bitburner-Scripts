#include <Python.h>
#include <math.h>
#include <string.h>
#include <stdlib.h>

static char *sieve(unsigned int max_num) {
    char *primes = malloc(max_num + 1);
    memset(primes, 1, max_num + 1);
    unsigned int end = (unsigned int)(sqrt(max_num)) + 1;
    for (unsigned int i = 2; i < end; ++i) {
        if (primes[i]) {
            for (unsigned int j = i*i; j < max_num + 1; j += i) {
                primes[j] = 0;
            }
        }
    }
    return primes;
}

static PyObject *clib_largest_prime_factor(PyObject *self, PyObject *args) {
    unsigned int max_num;

    if (!PyArg_ParseTuple(args, "I:largest_prime", &max_num))
        return NULL;

    char *primes = sieve(max_num);
    unsigned int i = max_num;
    for (; i > 0; i--) {
        if (primes[i] && max_num % i == 0) {
            break;
        }
    }
    free(primes);

    return Py_BuildValue("I", i);
}

static PyMethodDef clib_methods[] = {
    {
        .ml_name = "largest_prime_factor",
        .ml_meth = clib_largest_prime_factor,
        .ml_flags = METH_VARARGS,
        .ml_doc = "Find the largest prime factor of a number.\n\n"
                  ":param num: The number to find the largest prime factor of\n\n"
                  ":return: num's largest prime factor"
    },
    {
        .ml_name = NULL,
        .ml_meth = NULL,
        .ml_flags = 0,
        .ml_doc = NULL
    }
};

static struct PyModuleDef clib = {
    .m_base = PyModuleDef_HEAD_INIT,
    .m_name = "clib",
    .m_doc = "C functions for bitburner coding contracts",
    .m_size = -1,
    .m_methods = clib_methods
};

PyMODINIT_FUNC PyInit_clib(void) {
    return PyModule_Create(&clib);
}
