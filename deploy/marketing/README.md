# Marketing Deployment Profile

Goal: run an isolated instance of the stack with internet-oriented workflows and keys separated from the secure profile.

## Setup

```bash
cd deploy/marketing
cp .env.example .env
```

## Run Commands

Start (detached):

```bash
docker compose --env-file .env -p corestack-marketing up -d
```

Stop (keep containers):

```bash
docker compose --env-file .env -p corestack-marketing stop
```

Down (remove containers + network, keep volumes):

```bash
docker compose --env-file .env -p corestack-marketing down
```

Destroy (remove volumes too, deletes data):

```bash
docker compose --env-file .env -p corestack-marketing down -v
```

Logs:

```bash
docker compose --env-file .env -p corestack-marketing logs -f --tail 200
```

## Defaults

- Ports are consistently offset by +100 vs the secure profile (see `.env.example`).
- Tool Gateway allowlist defaults to `WEB_ALLOWLIST=*` (explicit allow-all). Requests are logged by the gateway.
- `TOOL_BACKEND=n8n` by default; configure `SEARCH_API_*` and other keys as needed (prefer n8n Credentials).

