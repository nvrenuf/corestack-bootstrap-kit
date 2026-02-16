# Example Pack (Template)

This is a template pack that demonstrates the Pack Contract v1 structure.

Files:
- `pack.json`: pack metadata (required)
- `compose.pack.yml`: Docker Compose file for the pack (required)
- `.env.example`: environment template (required)

Notes:
- Do not use `container_name:` in the compose file.
- Do not hardcode host ports. Use env vars like `"${EXAMPLE_HTTP_PORT}:80"` and document how to derive them with `PORT_OFFSET`.

