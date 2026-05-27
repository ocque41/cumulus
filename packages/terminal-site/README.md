# Cumulus Terminal Site

This package ships the Cumulus DB website as an interactive terminal UI.
The TUI uses ASCII Cumulus branding and horizontal page links.

Run it from npm:

```bash
npx cumulush
```

Run a specific page:

```bash
npx cumulush /documents
npx cumulush /contact
```

View the package guide in the TUI:

```bash
npx cumulush /documents
```

The guide covers the main Cumulus DB commands:

```bash
npm run db:build
npm run db:start
npm run db:cli -- help
```

It also documents records, key-value state, events, system workflows, local
runtime paths, dashboard connection values, and the Apache/AGPL boundary.

## Controls

- `1` to `3`: jump to a page.
- Left/right arrows or `[` and `]`: move between pages.
- Up/down arrows or `k` and `j`: scroll the current page.
- `g`: top of page.
- `G`: bottom of page.
- `r`: redraw.
- `q` or `Ctrl+C`: quit.

On `/contact`, type a message and press `Enter`. The TUI creates a local
email draft addressed to `hi@cumulush.com`. The package does not include
SMTP credentials or a hosted email secret because everything in this repo
is public.

For CI or logs:

```bash
npx cumulush /documents --plain
```
