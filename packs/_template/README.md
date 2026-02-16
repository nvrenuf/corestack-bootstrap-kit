# Corestack Pack Template

This folder is a minimal contract example only.

Required files in every pack repo:

- `pack.json`
- `compose.pack.yml`
- `.env.example`

Notes:

- Use env vars for host ports (no hardcoded host ports).
- Do not use `container_name` in compose.
- Keep pack logic in separate repos; this template exists only to demonstrate structure.
