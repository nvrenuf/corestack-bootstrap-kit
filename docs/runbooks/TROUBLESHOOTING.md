# Troubleshooting

## Docker group / permission denied

Symptoms:
- `docker ps` fails for non-root user.

Fix:
1. `sudo usermod -aG docker "$USER"`
2. Log out/in (or `newgrp docker`)
3. Re-run `./scripts/lib/postcheck.sh --bootstrap granite`.

## Caddy internal cert not trusted

Symptoms:
- Browser TLS warning at `https://localhost`.

Fix:
1. Trust Caddy local root CA in OS/browser.
2. Retry endpoint without insecure bypass.

## Port conflicts (80/443)

Symptoms:
- Compose fails to start Caddy.

Fix:
1. `sudo ss -ltnp | grep -E ':80|:443'`
2. Stop conflicting service.
3. Re-run bootstrap.

## Model pulls stuck or slow

Symptoms:
- `ollama pull` hangs or times out.

Fix:
1. Verify outbound network/DNS.
2. Retry `./scripts/granite/pull-models.sh`.
3. Check disk free space and Ollama logs.

## n8n or WebUI route unavailable

1. `docker compose -f build/granite/docker-compose.yml ps`
2. If WebUI fails but n8n works, confirm `WEBUI_PORT=8080` in `~/corestack/corestack.env`.
3. Verify Caddy routes and container names.
4. Run `./scripts/lib/postcheck.sh --bootstrap granite` for probe summary.

## Uninstall / reset

1. Stop/remove stack safely: `./corestack down` (or `./scripts/granite/uninstall.sh`)
2. Full data reset: `./corestack destroy` (or `./scripts/granite/uninstall.sh --purge-data`)
3. Remove local runtime files too: `./scripts/granite/uninstall.sh --purge-data --delete-home`
