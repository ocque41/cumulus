# Terminal Site

The terminal site is a small public npm package in `packages/terminal-site`.
It gives Cumulus a website people can open from a terminal.
The interactive frame uses ASCII Cumulus branding, a horizontal page link row,
and a Tado mark on the `/tado` page.

## User Command

From npm, users can run:

```bash
npx cumulush
```

They can open a specific page:

```bash
npx cumulush /documents
npx cumulush /relay
npx cumulush /tado
npx cumulush /rune
npx cumulush /cumulus/rune
npx cumulush /contact
```

## Pages

- `/` is the detailed Cumulus home page.
- `/documents` explains the public docs and release safety path.
- `/relay` explains agent-safe SaaS onboarding.
- `/tado` explains the AI agent terminal canvas.
- `/rune` explains the automation engine story.
- `/contact` accepts a message and opens a local email draft to
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
npm run terminal -- /relay --plain
```

Run tests:

```bash
npm run terminal:test
```

Check the npm package contents before publishing:

```bash
npm run terminal:pack
```
