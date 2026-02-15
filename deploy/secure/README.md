# Secure Deployment Profile

Goal: run an isolated instance of the stack with locked-down internet access by default.

## Setup

```bash
cd deploy/secure
cp .env.example .env
```

## Run Commands

Start (detached):

```bash
docker compose --env-file .env -p corestack-secure up -d
```

Stop (keep containers):

```bash
docker compose --env-file .env -p corestack-secure stop
```

Down (remove containers + network, keep volumes):

```bash
docker compose --env-file .env -p corestack-secure down
```

Destroy (remove volumes too, deletes data):

```bash
docker compose --env-file .env -p corestack-secure down -v
```

Logs:

```bash
docker compose --env-file .env -p corestack-secure logs -f --tail 200
```

## Defaults

- Ports are the base stack ports (see `.env.example`).
- Tool Gateway allowlist is locked down by default (`WEB_ALLOWLIST=localhost,127.0.0.1`).
- `TOOL_BACKEND=local` by default. If you want n8n-backed tools, set `TOOL_BACKEND=n8n`.

