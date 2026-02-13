# n8n Export/Import Guide

## Import workflows (UI)
1. Open n8n at `http://localhost:5678`.
2. Go to **Workflows**.
3. Select **Import from File**.
4. Import files from `n8n/workflows/` in numeric order (`00` to `05`).
5. Open each workflow, review placeholders, then activate.

## Export workflow from UI
1. Open a workflow.
2. Use **Download** or **Export**.
3. Save into `n8n/workflows/` using the naming convention: `NN-name.json`.

## Validation
Run:

```bash
node n8n/scripts/validate-workflows.js
```

This checks JSON syntax and minimal workflow keys.
