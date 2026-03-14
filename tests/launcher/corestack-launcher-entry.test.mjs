import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const primaryEntry = readFileSync(new URL("../../launcher/index.html", import.meta.url), "utf8");
const compatibilityEntry = readFileSync(new URL("../../launcher/launcher/index.html", import.meta.url), "utf8");

test("primary launcher entry boots the shell with local static assets", () => {
  assert.match(primaryEntry, /<nav aria-label="Primary" class="primary-nav" data-primary-nav><\/nav>/);
  assert.match(primaryEntry, /<main class="shell-content" data-route-content><\/main>/);
  assert.match(primaryEntry, /<script type="module" src="\.\/app\.js"><\/script>/);
});

test("compatibility launcher entry supports /launcher/index.html when serving from ./launcher", () => {
  assert.match(compatibilityEntry, /<link rel="stylesheet" href="\.\.\/styles\.css" \/>/);
  assert.match(compatibilityEntry, /<script type="module" src="\.\.\/app\.js"><\/script>/);
});

test("hash-route non-root routes remain addressable from compatibility launcher entry", () => {
  assert.match(compatibilityEntry, /data-route-title/);
  assert.match(compatibilityEntry, /data-route-content/);
});
