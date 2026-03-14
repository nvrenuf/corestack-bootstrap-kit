import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("bootstrap launcher exposes operator-facing Ollama endpoint default through config", () => {
  const script = readFileSync(new URL("../../scripts/granite/bootstrap-launcher.sh", import.meta.url), "utf8");

  assert.match(script, /OLLAMA_OPERATOR_URL="\$\{OLLAMA_OPERATOR_URL:-http:\/\/localhost:8080\}"/);
  assert.match(script, /Ollama API \(operator default\): \$\{OLLAMA_OPERATOR_URL\}/);
});
