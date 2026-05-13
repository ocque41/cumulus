# Cumulus Terminal Site

This package ships the Cumulus website as an interactive terminal UI.
The TUI uses ASCII Cumulus branding, horizontal page links, and an ASCII Tado
mark on the Tado page.

Run it from npm:

```bash
npx cumulush
```

Run a specific page:

```bash
npx cumulush /relay
npx cumulush /tado
npx cumulush /rune
npx cumulush /documents
npx cumulush /contact
```

## Controls

- `1` to `6`: jump to a page.
- Left/right arrows or `[` and `]`: move between pages.
- Up/down arrows or `k` and `j`: scroll the current page.
- `g`: top of page.
- `G`: bottom of page.
- `r`: redraw.
- `q` or `Ctrl+C`: quit.

On `/contact`, type a message and press `Enter`. The TUI opens a local
email draft addressed to `hi@cumulush.com`. The package does not include
SMTP credentials or a hosted email secret because everything in this repo
is public.

For CI or logs:

```bash
npx cumulush /relay --plain
```
