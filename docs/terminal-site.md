# Terminal Site

The terminal site is a small public npm package in `packages/terminal-site`.
It gives Cumulus a terminal view focused on Cumulus DB.

The interactive frame uses ASCII Cumulus branding, a horizontal page link row,
and plain setup copy for the local database path.

## Cumulus DB From The TUI

The TUI home page shows the fastest local commands:

```bash
npm run db:build
npm run db:start
npm run db:cli -- help
```

The Documents page covers:

- Cumulus DB records, key-value state, events, and system workflows,
- local JSONL and PostgreSQL runtime paths,
- dashboard connection values,
- environment variables,
- license boundaries,
- public safety checks.

## User Command

From npm, users can run:

```bash
npx cumulush
```

They can view a specific page:

```bash
npx cumulush /documents
npx cumulush /contact
```

## Pages

- `/` is the Cumulus DB home page.
- `/documents` explains how to run and connect Cumulus DB.
- `/contact` accepts a message and creates a local email draft to
  `hi@cumulush.com`.

## Contact Behavior

The package does not send mail through a hosted API. That would require a
secret token in a public npm package, which is not safe.

Instead, the contact page builds a `mailto:` draft. The user still presses
Enter in the TUI, and their local email client handles the final send.

For CI or automated tests, set:

```bash
CUMULUS_TUI_DRY_RUN=1
```

## Development

Run the TUI locally:

```bash
npm run terminal
```

Run a plain non-interactive render:

```bash
npm run terminal -- /documents --plain
```

Run tests:

```bash
npm run terminal:test
```

Check the npm package contents before publishing:

```bash
npm run terminal:pack
```
