#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOCK_PORT="${MOCK_N8N_PORT:-18080}"
GATEWAY_PORT="${TOOL_GATEWAY_PORT:-8787}"

export TOOL_BACKEND="${TOOL_BACKEND:-n8n}"
export WEB_ALLOWLIST="${WEB_ALLOWLIST:-example.com,localhost,127.0.0.1}"
export TOOL_SHARED_SECRET="${TOOL_SHARED_SECRET:-dev-secret}"
export N8N_WEB_FETCH_URL="${N8N_WEB_FETCH_URL:-http://127.0.0.1:${MOCK_PORT}/webhook/tools/web.fetch}"
export N8N_WEB_SEARCH_URL="${N8N_WEB_SEARCH_URL:-http://127.0.0.1:${MOCK_PORT}/webhook/tools/web.search}"

cat <<EOF
[tool-system/dev] starting local mock n8n on :${MOCK_PORT}
[tool-system/dev] starting tool-gateway on :${GATEWAY_PORT}
[tool-system/dev] backend=${TOOL_BACKEND}
[tool-system/dev] fetch webhook=${N8N_WEB_FETCH_URL}
[tool-system/dev] search webhook=${N8N_WEB_SEARCH_URL}
EOF

python3 - <<'PY' &
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

port = int(os.environ.get("MOCK_N8N_PORT", "18080"))
secret = os.environ.get("TOOL_SHARED_SECRET", "")


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        if secret and self.headers.get("X-Tool-Secret", "") != secret:
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"code":"UNAUTHORIZED","message":"Invalid X-Tool-Secret"}')
            return

        if self.path.endswith("/webhook/tools/web.fetch"):
            body = {
                "url": payload.get("url", ""),
                "final_url": payload.get("url", ""),
                "status": 200,
                "title": "Mock n8n fetch",
                "extracted_text": "mock fetch result",
                "fetched_at": "2026-01-01T00:00:00Z",
            }
        elif self.path.endswith("/webhook/tools/web.search"):
            body = {
                "query": payload.get("query", ""),
                "results": [
                    {
                        "title": "Mock n8n result",
                        "url": "https://example.com/result",
                        "snippet": "mock snippet",
                        "source": "mock",
                        "published_at": None,
                    }
                ],
                "searched_at": "2026-01-01T00:00:00Z",
            }
        else:
            self.send_response(404)
            self.end_headers()
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode("utf-8"))

    def log_message(self, fmt, *args):
        return


server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
server.serve_forever()
PY
MOCK_PID=$!
trap 'kill "$MOCK_PID"' EXIT

exec uvicorn app.main:app --host 0.0.0.0 --port "${GATEWAY_PORT}" --app-dir "$ROOT_DIR/tool-gateway"
