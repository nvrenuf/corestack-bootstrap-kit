# Container & Image Architecture Inventory (Current State)

This audit captures every image currently **defined**, **built**, or **implied** by this repository as of this commit.

## Scope and evidence sources

Reviewed files:

- Runtime compose files:
  - `deploy/compose/docker-compose.yml`
  - `deploy/marketing/docker-compose.yml`
  - `deploy/secure/docker-compose.yml`
- Template compose files and image pin config:
  - `templates/compose/granite/docker-compose.yml.tmpl`
  - `config/granite/versions.yaml`
  - `scripts/granite/render-compose.sh`
  - `scripts/granite/bootstrap.sh`
- Dockerfiles:
  - `tool-gateway/Dockerfile`
  - `tests/tool-system/Dockerfile`
- Build/test and CI invocation:
  - `scripts/tool-system/test.sh`
  - `.github/workflows/tool-system-tests.yml`
  - `.github/workflows/fear-signal-radar-schema-tests.yml`
  - `Makefile`
- Pack-level compose references:
  - `packs/marketing/compose.pack.yml`
  - `packs/_template/compose.pack.yml`

## Image inventory table

| Image (name:tag) | Service/runtime | Where referenced | Base image | Copied app code | Installed dependencies | Entrypoint/CMD | Ports | Classification |
|---|---|---|---|---|---|---|---|---|
| `ollama/ollama:0.13.5` | Local LLM serving | `deploy/*/docker-compose.yml`, `templates/compose/granite/docker-compose.yml.tmpl`, `config/granite/versions.yaml` | Upstream image | None in repo | None in repo | Upstream default | `11434` container; host mapped via profile | Pure upstream image |
| `ghcr.io/open-webui/open-webui:v0.8.0` | Web chat UI for operators | `deploy/*/docker-compose.yml`, `templates/compose/granite/docker-compose.yml.tmpl`, `config/granite/versions.yaml` | Upstream image | None in repo | None in repo | Upstream default | `8080` container; host mapped to profile-specific port | Pure upstream image |
| `docker.n8n.io/n8nio/n8n:2.6.3` | Workflow/orchestration runtime | `deploy/*/docker-compose.yml`, `templates/compose/granite/docker-compose.yml.tmpl`, `config/granite/versions.yaml` | Upstream image | None baked; workflows/templates mounted as volumes | None in repo | Upstream default | `5678` container; host mapped by profile | Pure upstream image |
| `postgres:16` and `postgres:16-alpine` | Metadata/workflow DB | `deploy/*/docker-compose.yml` (`:16`), templates/pins (`:16-alpine`) | Upstream image | None in repo | None in repo | Upstream default | `5432` container; host mapped by profile | Pure upstream image (tag drift present) |
| `adminer:4` | DB admin UI | `deploy/*/docker-compose.yml` | Upstream image | None in repo | None in repo | Upstream default | `8080` container; host mapped by profile | Pure upstream image |
| `nginx:1.27-alpine` | Launcher static UI serving | `deploy/*/docker-compose.yml` | Upstream image | No baked code; mounts `../../launcher` and nginx conf | None in repo | Upstream nginx default | `80` container; host mapped by profile | Thin wrapper around upstream image (runtime mounts only) |
| `qdrant/qdrant:v1.16.3` | Vector DB (Granite template stack) | `templates/compose/granite/docker-compose.yml.tmpl`, `config/granite/versions.yaml`, rendering/bootstrap scripts | Upstream image | None in repo | None in repo | Upstream default | `6333` container; host bind from env | Pure upstream image (template-defined, not in deploy profiles) |
| `caddy:2.10.2-alpine` | TLS reverse proxy (Granite template stack) | `templates/compose/granite/docker-compose.yml.tmpl`, `config/granite/versions.yaml`, rendering/bootstrap scripts | Upstream image | No baked code; mounts rendered `Caddyfile` | None in repo | Upstream default | `80`, `443` | Thin wrapper around upstream image (runtime config mount only) |
| `nginx:alpine` | Pack template/static hello web | `packs/marketing/compose.pack.yml`, `packs/_template/compose.pack.yml` | Upstream image | None in repo | None in repo | Upstream default | `80` container; host mapped from env | Pure upstream image |
| `python:3.11-slim` → `corestack-tool-gateway` (no explicit tag in compose) | Tool gateway API (FastAPI/uvicorn) | Built from `tool-gateway/Dockerfile`; referenced by `deploy/*/docker-compose.yml` via `build.context` | `python:3.11-slim` | `tool-gateway/app` + `requirements.txt` | `pip install -r requirements.txt` | `uvicorn app.main:app --host 0.0.0.0 --port 8787` | `8787` | **Custom Corestack image** |
| `python:3.11-slim` → `corestack-tool-system-tests:py311` | Reproducible test runner image | `tests/tool-system/Dockerfile`, `scripts/tool-system/test.sh`, workflow | `python:3.11-slim` | No app baked; repo mounted read-only at runtime | `pytest`, `jsonschema`, `referencing`, `httpx`, plus `tool-gateway/requirements.txt` | `python -m pytest` entrypoint | None (test-only) | **Custom Corestack image** (CI/dev utility) |

## Current architecture (what is actually happening)

1. The active deployment profiles (`deploy/compose`, `deploy/marketing`, `deploy/secure`) mostly orchestrate upstream images and build only `tool-gateway` locally.
2. A separate Granite templating path defines a somewhat different stack (`caddy`, `qdrant`, `postgres:16-alpine`) rendered into `build/granite/docker-compose.yml`.
3. The repo has one production-like custom image (`tool-gateway`) and one non-product custom image for tests (`corestack-tool-system-tests`).
4. There is no canonical, centrally versioned image manifest consumed by all compose profiles; some tags are duplicated and diverge by file.

## Gaps and ambiguities

### 1) Implied images not formally first-class in deploy profiles

- `qdrant` and `caddy` are first-class in Granite templates but absent from `deploy/compose|marketing|secure` compose files.
- This implies split runtime modes: template-rendered “bootstrap” mode vs checked-in deploy compose mode.

### 2) Version/tag drift

- Postgres is `postgres:16` in deploy profiles, but `postgres:16-alpine` in template/pin config.
- This can create environment-specific behavior and patch-level mismatch.

### 3) Responsibility overlap / runtime mixing

- UI serving appears in two patterns:
  - `open-webui` upstream app UI.
  - Separate `launcher` static UI on nginx, mounted from local source.
- Local dev concerns are mixed into product-like runtime compose:
  - bind mounts from repo paths (`../../launcher`, `../../n8n/workflows`, `../../n8n/templates`) rather than immutable baked images/artifacts.

### 4) Custom image strategy is partial

- `tool-gateway` is custom and build-based, but other core runtime pieces are uncustomized upstream images with runtime env/volume tweaks.
- No image naming/tagging policy for built images (e.g., no explicit `image:` tag for tool-gateway in compose).

## Recommended target first-class image strategy

### Keep upstream (intentionally)

- `ollama`, `open-webui`, `n8n`, `postgres`, `qdrant`, `adminer`, `caddy` should remain upstream unless Corestack requires hardening/features that cannot be done by config.
- Rationale: these are commodity runtimes with active upstream maintenance; wrapping adds maintenance burden without clear benefit right now.

### Make Corestack-owned images first-class

1. **`corestack/tool-gateway`** (already exists logically)
   - Add explicit `image:` naming/tag policy in compose (e.g., `ghcr.io/<org>/corestack-tool-gateway:<version>`).
   - Keep Dockerfile as authoritative runtime packaging.
2. **`corestack/launcher`** (optional but recommended if launcher is product surface)
   - Convert runtime bind-mount model to immutable built image for reproducibility.
3. **Do not treat test image as product artifact**
   - `corestack-tool-system-tests` should remain CI-only; avoid publishing unless needed for remote CI reuse.

### Consolidation actions

- Unify all compose variants to one source of truth for image pins (e.g., generated from `config/granite/versions.yaml` or equivalent central manifest).
- Eliminate Postgres tag drift by standardizing one tag family across profiles.
- Clarify profile boundaries:
  - **dev profile** may allow bind mounts.
  - **runtime profile** should prefer immutable image artifacts.

## GHCR/private registry recommendation (current timing)

- **Warranted now, but narrowly scoped** for at least one first-class Corestack image:
  - publish `corestack-tool-gateway` to GHCR to enable deterministic deploys across environments.
- **Not yet warranted** to mirror all upstream dependencies into a private registry unless there is a compliance/offline requirement.
- **When to expand private registry usage**:
  - strict provenance/SBOM policy,
  - air-gapped or regulated deployments,
  - repeated upstream rate-limit/availability risk.

## Current vs recommended architecture snapshot

### Current

- Mostly upstream images orchestrated by compose.
- One custom runtime image (`tool-gateway`) built locally.
- Template and deploy compose paths diverge in components and tags.
- Mix of mutable bind mounts and containerized services in runtime definitions.

### Recommended

- Keep most dependencies upstream.
- Promote a small set of true Corestack images (`tool-gateway`, possibly `launcher`).
- Standardize image pinning and compose generation/source-of-truth.
- Separate dev mutability from runtime immutability.

