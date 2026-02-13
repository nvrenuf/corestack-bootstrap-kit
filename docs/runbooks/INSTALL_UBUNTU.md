# Runbook: Fresh Ubuntu Installation Assumptions

## Supported baseline

- Ubuntu 22.04 LTS or 24.04 LTS
- User with sudo privileges
- Internet access for apt, Docker images, and model pulls

## Host preparation checklist

1. Update package index and reboot if kernel/security upgrades require it.
2. Ensure at least 4 CPU cores, 16 GB RAM, and 40 GB free disk for Granite baseline.
3. Confirm DNS resolution and outbound HTTPS connectivity.
4. Ensure ports 80/443 are not occupied by another reverse proxy.

## Installation model

This repo assumes bootstrap scripts:
- install dependencies as needed,
- generate configuration into `build/`,
- write logs to `~/corestack/logs/`,
- and can be safely re-run.

## Operator note

If running over SSH, keep terminal open until postcheck completes to capture first-run diagnostics.
