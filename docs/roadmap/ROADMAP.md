# Roadmap

## Near-term platform milestones

1. **SOC2-aligned baseline bootstrap set**
   - Granite bootstrap stabilization with hardening defaults and auditable runbooks.
2. **GLBA-oriented controls pack**
   - Additional policy controls and evidence workflows focused on financial data environments.
3. **AI compliance packs**
   - Modular controls for AI governance and model lifecycle oversight.

## Bootstrap sequencing

- Granite (current): establishes baseline patterns for local model serving and automation tooling.
- Mistral (next): extends model matrix and compatibility checks without changing core conventions.
- Future bootstraps: reuse preflight/postcheck interfaces, config precedence, and logging patterns.

## Success criteria

- Operators can perform deterministic installs on fresh Ubuntu.
- Security posture is safe by default and explicitly documented.
- New bootstraps can be added in days, not weeks, using documented conventions.
