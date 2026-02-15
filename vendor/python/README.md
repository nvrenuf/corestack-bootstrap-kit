# Python wheelhouse placeholder

`vendor/python/` is reserved for optional vendored wheels if you want a fully local (non-Docker) test flow.

The supported default path is the Docker test runner in `scripts/tool-system/test.sh`, which keeps runtime testing independent from `pip install` at test execution time.
