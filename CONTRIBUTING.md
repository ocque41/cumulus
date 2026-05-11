# Contributing

Thanks for contributing to Cumulus.

## Before Opening A Pull Request

Run:

```bash
npm run lint
npm run license:check
npm run test
npm run db:test
npm run build
```

Also run the public safety checks in `docs/public-release.md` if your change touches docs, config, auth, database access, deployment, or legal content.

## What Belongs Here

Good public contributions include:

- shared UI and product code,
- tests,
- public documentation,
- self-host improvements,
- Cumulus DB improvements,
- cloud API client improvements that do not expose private production details.

Do not contribute:

- real secrets,
- production provider config,
- internal runbooks,
- customer data,
- private admin systems,
- private business plans.

## Contribution License

By submitting a contribution, you agree that:

- contributions outside `apps/cumulus-db` are licensed under Apache-2.0,
- contributions inside `apps/cumulus-db` are licensed under AGPL-3.0-only.

Keep AGPL database-provider code inside `apps/cumulus-db`. Apache-side app code should use Cumulus DB over HTTP/token APIs, not direct source imports.
