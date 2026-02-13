# Corestack Bootstrap Kit

Corestack Bootstrap Kit includes a reproducible local stack for Ollama + Open WebUI + n8n, with a lightweight launcher page.

**Quickstart**
Prereqs: Docker Desktop/Engine with Docker Compose v2.

```bash
git clone https://github.com/nvrenuf/corestack-bootstrap-kit.git corestack-bootstrap-kit
cd corestack-bootstrap-kit
./scripts/granite/bootstrap-launcher.sh
```

This single command:
1. Starts Ollama.
2. Pulls a chat model and embedding model.
3. Starts Open WebUI, n8n, and the launcher.

**Configuration**
Default model/env values are in `deploy/compose/.env.example`:

- `CHAT_MODEL=granite3.1-moe:3b-instruct-q4_K_M`
- `EMBEDDING_MODEL=nomic-embed-text:v1.5`
- `OLLAMA_BASE_URL=http://host.docker.internal:11434`
- `OLLAMA_NUM_PARALLEL=1`
- `WEB_ALLOWLIST=localhost,127.0.0.1,open-webui,ollama,n8n`
- `WEB_TIMEOUT_MS=10000`
- `WEB_USER_AGENT=corestack-n8n-tools/1.0`
- `CACHE_TTL_SECONDS=900`

To override defaults:

```bash
cp deploy/compose/.env.example deploy/compose/.env
# edit deploy/compose/.env
docker compose --env-file deploy/compose/.env -f deploy/compose/docker-compose.yml up -d
```

Open WebUI is configured by env vars (no manual UI setup required):
- `DEFAULT_MODELS` uses `CHAT_MODEL` for chat.
- `RAG_EMBEDDING_MODEL` uses `EMBEDDING_MODEL` for embeddings/RAG.

`nomic-embed-text:v1.5` is embedding-only and must not be used as a chat model.

**Ports**

- `8080` Launcher: `http://localhost:8080`
- `3000` Open WebUI: `http://localhost:3000`
- `5678` n8n: `http://localhost:5678`
- `11434` Ollama API: `http://localhost:11434/api/tags`

**Troubleshooting**

- `400: "nomic-embed-text:v1.5" does not support chat`
  - Cause: embedding model was selected for chat.
  - Fix: set `CHAT_MODEL` to a chat-capable model (default: `granite3.1-moe:3b-instruct-q4_K_M`) and restart compose.

- `500: llama runner process has terminated: signal: killed`
  - Cause: usually memory pressure/OOM.
  - Fixes:
    - use a smaller chat model
    - reduce context window
    - set parallelism to 1 (`OLLAMA_NUM_PARALLEL=1`)
    - increase Docker Desktop memory allocation

**Acceptance Tests**

1. Start stack:
```bash
docker compose -f deploy/compose/docker-compose.yml up -d
```
Expected: `corestack-ollama`, `corestack-open-webui`, `corestack-n8n`, and `corestack-launcher` are running.

2. Check launcher:
```bash
curl -sSf http://localhost:8080 | head
```
Expected: HTML for "Corestack Launcher" is returned.

3. Check container count:
```bash
docker ps --format '{{.Names}}' | grep '^corestack-' | sort
```
Expected: 4 containers listed.

4. Check models in Ollama:
```bash
docker exec corestack-ollama ollama list
```
Expected: chat model plus `nomic-embed-text:v1.5` are present.

5. Open WebUI chat sanity:
Expected: chat works without the `"does not support chat"` error when using `CHAT_MODEL`.

6. n8n tool webhook examples:
```bash
curl -sS -X POST http://localhost:5678/webhook/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","agent":"demo","purpose":"test"}'

curl -sS -X POST http://localhost:5678/webhook/tools/web.search \
  -H 'Content-Type: application/json' \
  -d '{"query":"corestack updates","agent":"demo","purpose":"test","max_results":5}'
```
Expected: JSON response from each webhook after workflows are imported and active.

**Default n8n Automations**

- Scaffolding root: `n8n/`
- Importable workflows: `n8n/workflows/`
- Templates and prompt files: `n8n/templates/`
- Guides and helper scripts: `n8n/scripts/`
- Full docs: `n8n/README.md` and `docs/n8n-automations.md`

**Legacy Granite Bootstrap**

The original Granite bootstrap flow remains available at `scripts/granite/bootstrap.sh` and related docs under `docs/runbooks/`.
