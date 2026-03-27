# Security policy

## Supported versions

Security updates are applied to the latest minor release line on npm (`cc-agent-harness`). Older versions may not receive backports unless noted in release notes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security reports.

- Prefer [GitHub Security Advisories](https://github.com/KwokJay/cc-agent-harness/security/advisories/new) for this repository (if enabled).
- If that is unavailable, contact the maintainers via the email or process listed on the repository homepage.

Include:

- A clear description of the impact and affected scenarios (CLI command, version, platform).
- Steps to reproduce or a proof-of-concept, if possible.
- Whether you believe the issue is exploitable in typical `agent-harness` usage (local scaffold / CI).

We aim to acknowledge reports within a few business days and coordinate disclosure once a fix is ready.

## Scope notes

- `agent-harness` runs locally and writes files under the project directory. Treat untrusted project templates and third-party toolpacks like any other supply-chain dependency.
- Optional future telemetry (if enabled) is documented in the README and must remain opt-in with minimal data collection.
