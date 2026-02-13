# Threat Model (Bootstrap + Runtime)

## Goals

Protect customer infrastructure during install and runtime with least-privilege defaults and auditable operations.

## Assets

- Host integrity (packages, services, system config)
- Model/runtime artifacts and container images
- Workflow and application data (n8n/postgres/qdrant)
- Operator credentials and environment configuration

## Trust boundaries

- Public internet to host package/image download channels
- Host OS to container runtime (Docker)
- Reverse proxy edge (Caddy) to internal services
- Localhost-only services (Ollama/Qdrant) vs exposed routes

## Primary threats

1. **Supply-chain drift/tampering**
   - Mitigation: pinned image/model tags, explicit version files, future signature verification.
2. **Excessive service exposure**
   - Mitigation: bind sensitive services to `127.0.0.1`, route only required UIs through Caddy.
3. **Privilege escalation from bootstrap scripts**
   - Mitigation: strict Bash mode, explicit command checks, idempotent state transitions.
4. **Credential leakage in logs**
   - Mitigation: template defaults without secrets, redact sensitive vars in future scan hooks.
5. **Configuration drift**
   - Mitigation: config precedence rules + postcheck verification and generated artifacts in `build/`.

## Residual risk notes

- First-run Caddy internal CA trust requires operator action on clients.
- Docker group membership grants elevated host control; treat membership as privileged.
- Runtime hardening for each service image remains a shared responsibility.
