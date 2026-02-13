# Config Conventions

## Version pinning policy

No latest-drift by default.

- Global behavior defaults live in `config/global.defaults.yaml`.
- Bootstrap-specific pins live in `config/<bootstrap>/versions.yaml`.
- Pin both container image tags and model tags.

Example pin targets:
- `ollama/ollama:0.13.5`
- `ghcr.io/open-webui/open-webui:v0.7.2`
- Granite models such as `granite3.1-dense:8b-instruct-q4_K_M`

## Config precedence

1. `config/global.defaults.yaml`
2. `config/<bootstrap>/versions.yaml`
3. operator environment file (`corestack.env`) generated from template and manually edited
4. shell environment overrides at runtime (explicitly exported)

Scripts should log effective values for non-sensitive settings.

## Service exposure policy

- **localhost-only:** Ollama, Qdrant, Postgres by default.
- **reverse-proxy exposed:** Open WebUI on `https://localhost`, n8n on `https://n8n.localhost`.
- **firewall baseline:** UFW enabled with deny incoming + allow outgoing unless operator overrides intentionally.

## Mutability rules

- Never edit template files in place during installs.
- Render to `build/` artifacts, then deploy from generated output.
- Preserve user-edited `.env` files; if regeneration is needed, create timestamped backup first.
