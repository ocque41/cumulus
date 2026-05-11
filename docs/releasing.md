# Releasing

Cumulus releases are cut from the public repo, not from private production history.

## Versioning

- Use semantic versioning.
- Tag releases as `vX.Y.Z`.
- Keep `CHANGELOG.md` as the public version ledger.

## Required Checks

Run these before tagging:

```bash
cp .env.example .env.local
npm run license:check
npm run security:scan
npm audit --omit=dev --audit-level=high
npm run test
npm run db:test
npm run build
```

`npm run lint` must exit successfully. Existing warnings should be reduced over time, but warnings alone do not block a release.

## License Boundary

- Root app and shared code: Apache-2.0.
- `apps/cumulus-db`: AGPL-3.0-only.
- App-side code must talk to Cumulus DB over HTTP/token APIs.
- Do not import AGPL database-provider code into Apache-side app code.

## Release Flow

1. Update `CHANGELOG.md`.
2. Run the required checks.
3. Commit the release notes.
4. Create an annotated tag:

```bash
git tag -a vX.Y.Z -m "Cumulus vX.Y.Z"
```

5. Push `main` and the tag.
6. Create a GitHub release from the changelog section.
