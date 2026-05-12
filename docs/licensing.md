# Licensing

Cumulus uses a split license model.

## License Map

| Area | License | Why |
| --- | --- | --- |
| Root app, marketing, dashboard, auth package, docs, tests, Supabase migrations | Apache-2.0 | Broad adoption, forks, commercial use, and cloud integrations. |
| `apps/cumulus-db` Cumulus Database provider | AGPL-3.0-only | Networked database-provider improvements stay open when people run modified versions as a service. |

## Boundary Rules

- Keep the database engine, storage layer, token system, search, secrets, HTTP server, and provider tests inside `apps/cumulus-db`.
- Keep app integration code outside `apps/cumulus-db` Apache-2.0. It must talk to Cumulus DB over HTTP/token APIs.
- Do not import `@cumulus/database` or `apps/cumulus-db` source from Apache-side app code.
- If a future shared protocol package is needed, create it outside `apps/cumulus-db` and license it Apache-2.0.
- Generated apps or examples that only call Cumulus Cloud over HTTP can use their own permissive license.
- Generated apps or examples that include files copied from `apps/cumulus-db` must keep those copied provider pieces AGPL-3.0-only.
- New files under `apps/cumulus-db/src` must start with:

```ts
// SPDX-License-Identifier: AGPL-3.0-only
```

## Checks

Run:

```bash
npm run license:check
```

This verifies the root Apache license, the Cumulus DB AGPL license, the database source headers, and the no-direct-import boundary between the Apache app and the AGPL database provider.
