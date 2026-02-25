# Setup

## Configure Environment Variables

1. Copy `.env.example` to `.env`.
2. Set `PORT_HELLO` to a free host port.
3. Keep `PORT_OFFSET` set for future compatibility.

Example:

```bash
cp .env.example .env
```

## Avoid Port Conflicts Across Multiple Packs

- Assign a unique `PORT_HELLO` per pack.
- Keep a simple port map for your local environment (for example, `18080`, `19080`, `20080`).
- If a port is already used, choose another free port and restart the pack.

## Troubleshooting

### Port already allocated

- Symptom: start fails with bind/port-in-use error.
- Fix: update `PORT_HELLO` to an unused port, then restart.

### Service starts but page is unreachable

- Confirm the pack is running with `corestack pack status marketing`.
- Confirm host mapping in `compose.pack.yml` is `${PORT_HELLO}:80`.
- Check logs with `corestack pack logs marketing hello-web`.

### Missing environment values

- Ensure `.env` exists and includes `PORT_HELLO`.
- Re-run start after correcting the environment file.
