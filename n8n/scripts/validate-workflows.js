#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'n8n', 'workflows');
const requiredKeys = ['name', 'nodes', 'connections'];

let failed = false;
for (const file of fs.readdirSync(root).filter((f) => f.endsWith('.json')).sort()) {
  const full = path.join(root, file);
  try {
    const raw = fs.readFileSync(full, 'utf8');
    const parsed = JSON.parse(raw);
    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        throw new Error(`missing required key: ${key}`);
      }
    }
    if (!Array.isArray(parsed.nodes)) {
      throw new Error('nodes must be an array');
    }
    console.log(`OK  ${file}`);
  } catch (err) {
    failed = true;
    console.error(`ERR ${file}: ${err.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
}
