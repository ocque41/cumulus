# Cumulus Terminal Site

This package ships the Cumulus website as an interactive terminal UI.
The TUI uses ASCII Cumulus branding, horizontal page links, and an ASCII Tado
mark on the Tado page.

The home page and `/documents` page advertise `create-cumulus`, the public npm
package for scaffolding Relay/Cumulus apps.

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

Open the package guide in the TUI:

```bash
npx cumulush /documents
```

The guide covers the main `create-cumulus` commands:

```bash
npx create-cumulus@latest my-acme
npm create cumulus@latest my-acme
npx create-cumulus@latest my-acme --template full --agent-auth hosted
```

It also documents the `full`, `outer`, `inner`, and `agent-auth` templates;
the `hosted` and `self-hosted` auth modes; and the `cloud`, `local`, and
`both` Cumulus DB modes.

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
