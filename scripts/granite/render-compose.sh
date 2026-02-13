#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

require_cmd envsubst

BUILD_DIR="${REPO_ROOT}/build/granite"
ensure_dir "${BUILD_DIR}"

: "${CADDY_IMAGE:=caddy:2.8.4-alpine}"
: "${OLLAMA_IMAGE:=ollama/ollama:0.3.14}"
: "${OPEN_WEBUI_IMAGE:=ghcr.io/open-webui/open-webui:v0.3.12}"
: "${QDRANT_IMAGE:=qdrant/qdrant:v1.10.1}"
: "${POSTGRES_IMAGE:=postgres:16.4-alpine}"
: "${N8N_IMAGE:=docker.n8n.io/n8nio/n8n:1.57.0}"

: "${OLLAMA_BIND:=127.0.0.1:11434}"
: "${QDRANT_BIND:=127.0.0.1:6333}"
: "${POSTGRES_BIND:=127.0.0.1:5432}"
: "${WEBUI_PORT:=3000}"
: "${N8N_PORT:=5678}"

envsubst < "${REPO_ROOT}/templates/compose/granite/docker-compose.yml.tmpl" > "${BUILD_DIR}/docker-compose.yml"
envsubst < "${REPO_ROOT}/templates/caddy/Caddyfile.tmpl" > "${BUILD_DIR}/Caddyfile"

echo "Rendered files:"
echo "- ${BUILD_DIR}/docker-compose.yml"
echo "- ${BUILD_DIR}/Caddyfile"
