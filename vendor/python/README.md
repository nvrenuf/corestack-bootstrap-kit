# Python offline test dependencies

This directory contains vendored Python modules used by `scripts/tool-system/test.sh` in `local` mode.

## Included
- `jsonschema` (minimal API subset used by tool-system tests)
- `referencing` (minimal API subset used by tool-system tests)

The default path remains Docker mode (`./scripts/tool-system/test.sh`) for cross-machine consistency. The local mode prepends `vendor/python` to `PYTHONPATH` so schema tests can run in restricted/no-internet environments without downloading packages at test time.
