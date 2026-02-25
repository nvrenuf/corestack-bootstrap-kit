# Marketing Pack

This pack is a validation scaffold for the Corestack pack runtime. It ships a single `hello-web` service (nginx) so runtime behavior can be verified end-to-end.


## Corestack Requirement

- Corestack version: `>=0.1.0`

## Install via Corestack

Use either a Git URL source or a local path source:

```bash
# Install from Git URL
corestack pack install https://github.com/<org>/corestack-marketing-stack.git

# Install from local path
corestack pack install /absolute/path/to/corestack-marketing-stack
```

## Operations

```bash
# Start the pack
corestack pack start marketing

# Stop the pack
corestack pack stop marketing

# Check status
corestack pack status marketing

# View logs
corestack pack logs marketing hello-web
```

## Service Access

- `hello-web`: `http://localhost:${PORT_HELLO}`

## Port Offset Notes

- Port offsets are manual for now.
- Set `PORT_HELLO` in your environment so it does not conflict with other running packs.
- `PORT_OFFSET` is reserved for future computed mapping support.
