#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

require_cmd envsubst

BUILD_DIR="${REPO_ROOT}/build/granite"
ensure_dir "${BUILD_DIR}"

: "${CADDY_IMAGE:=caddy:2.10.2-alpine}"
: "${OLLAMA_IMAGE:=ollama/ollama:0.13.5}"
: "${OPEN_WEBUI_IMAGE:=ghcr.io/open-webui/open-webui:v0.8.0}"
: "${QDRANT_IMAGE:=qdrant/qdrant:v1.16.3}"
: "${POSTGRES_IMAGE:=postgres:16-alpine}"
: "${N8N_IMAGE:=docker.n8n.io/n8nio/n8n:2.6.3}"

: "${OLLAMA_BIND:=127.0.0.1:11434}"
: "${QDRANT_BIND:=127.0.0.1:6333}"
: "${POSTGRES_BIND:=127.0.0.1:5432}"
: "${WEBUI_PORT:=8080}"
: "${N8N_PORT:=5678}"
: "${POSTGRES_DB:=corestack}"
: "${POSTGRES_USER:=corestack}"
: "${POSTGRES_PASSWORD:=change_me_now}"
: "${N8N_BASIC_AUTH_ACTIVE:=true}"
: "${N8N_BASIC_AUTH_USER:=admin}"
: "${N8N_BASIC_AUTH_PASSWORD:=change_me_now}"

export CADDY_IMAGE OLLAMA_IMAGE OPEN_WEBUI_IMAGE QDRANT_IMAGE POSTGRES_IMAGE N8N_IMAGE
export OLLAMA_BIND QDRANT_BIND POSTGRES_BIND WEBUI_PORT N8N_PORT
export POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD
export N8N_BASIC_AUTH_ACTIVE N8N_BASIC_AUTH_USER N8N_BASIC_AUTH_PASSWORD

envsubst < "${REPO_ROOT}/templates/compose/granite/docker-compose.yml.tmpl" > "${BUILD_DIR}/docker-compose.yml"
envsubst < "${REPO_ROOT}/templates/caddy/Caddyfile.tmpl" > "${BUILD_DIR}/Caddyfile"

echo "Rendered files:"
echo "- ${BUILD_DIR}/docker-compose.yml"
echo "- ${BUILD_DIR}/Caddyfile"
