# Security Policy

## Reporting

Do not open public issues for vulnerabilities, leaked credentials, private data, or ways to bypass authentication.

Email security reports to: security@cumulush.com

Include:

- affected version or commit,
- clear reproduction steps,
- expected impact,
- any logs or screenshots with secrets removed.

## Public Repo Rules

- Do not commit `.env` files.
- Do not commit database dumps, runtime data, production logs, private provider IDs, or real user data.
- Do not expose Cumulus DB master keys through public routes.
- Treat every `NEXT_PUBLIC_*` value as public.
- Use scoped tokens for user-facing Cumulus DB access.

## Supported Branches

Security fixes should land in the public repository when the fix is safe to disclose. Production-only mitigations belong in the private production overlay.
