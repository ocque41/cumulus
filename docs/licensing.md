# Licensing

Cumulus 0.0.8 deliberately separates project code from third-party font assets.

## License map

| Material | License | Notes |
| --- | --- | --- |
| Application source, public API code, tests, scripts, documentation, and public migration source | Apache License 2.0 | The root `LICENSE` is authoritative. |
| Jacquard 12 and Jacquard 24 font software | SIL Open Font License 1.1 | Copyright 2023 The Soft Type Project Authors. |
| Jacquarda Bastarda 9 font software | SIL Open Font License 1.1 | Copyright 2023 The Soft Type Project Authors. |
| Alcyone Medium webfont | Commercial one-website webfont license | Supplied by the operator only to the licensed Production environment; never stored in this public repository or browser build. |
| Installed npm packages | Their respective upstream licenses | The lockfile and `license:check` define the release input. |

No AGPL code is included in this fresh reference project. Do not add AGPL-derived implementation to an Apache-2.0 path. If a future architecture needs an AGPL service, keep it in a separately licensed repository or service and communicate through a documented network API.

## Font handling

Only these web-font conversions of the supplied regular files are approved for distribution:

- `src/assets/fonts/Jacquard12-Regular.woff2`
- `src/assets/fonts/Jacquard24-Regular.woff2`
- `src/assets/fonts/JacquardaBastarda9-Regular.woff2`

They are format conversions of the non-charted TTF files in the supplied archives and remain font software under SIL OFL 1.1. The original TTF files do not need to be shipped beside the smaller web formats. The charted archives and charted font variants are intentionally not distributed. Do not regenerate or add them as build output.

The full SIL Open Font License 1.1 text and upstream copyright notices are reproduced in `NOTICE`, and the two exact upstream license files are retained under `licenses/fonts/`. Keep those notices with every public distribution that contains the font files. Font conversions or subsets remain font software under the OFL; do not relicense them as Apache-2.0 or use a reserved font name for a modified version without permission.

Alcyone Medium is licensed for embedding on one website with unlimited pageviews under the operator's supplied terms, which align with Atipo's [published webfont terms](https://www.atipofoundry.com/license). Its WOFF2 bytes, archive, and license PDFs are deliberately excluded from Git, build output, and the Apache-2.0 distribution. The authorized deployment stores the base64-encoded WOFF2 as `ALCYONE_MEDIUM_WOFF2_BASE64` in Production scope only and exposes it through `/api/fonts/alcyone-medium` with a same-origin resource policy. This configuration is license-controlled rather than secret—the browser necessarily receives the font—but the underlying value must never appear in a public file or browser bundle.

Local and Preview leave `ALCYONE_MEDIUM_WOFF2_BASE64` empty and use the bundled Jacquard 12 fallback. Do not add any Alcyone binary, archive, or commercial license PDF to this repository; copy it into static assets; install it as a desktop font under the webfont license; or reuse it for an app, game, broadcast, preview site, or second website without the corresponding permission. A third-party self-hoster must obtain a suitable license before supplying the value for their own website.

## Components and derivatives

The allowed visual vocabulary is Tripwire Dither Kit, Dither Image, Edge Blur, Hero Dithering, and faithful local derivatives. A design reference is not automatically a code license.

Before copying upstream source:

1. identify the exact source and version;
2. verify its redistribution license;
3. preserve required attribution and license text;
4. add it to `NOTICE` if required; and
5. run `npm run license:check`.

When upstream terms are absent or unclear, implement the described behavior independently from public interface and visual behavior rather than copying source. Project-authored derivatives are Apache-2.0; third-party copied code retains its upstream obligations.

## Release check

Before any public tag or production promotion:

```bash
npm ci
npm run license:check
npm run security:scan
```

Inspect the actual dependency tree and bundled output as well as the manifest. A passing manifest check cannot detect an unrecorded copied asset by itself.

## Assumptions

The bundled Jacquard archives and embedded OFL files are authoritative for the public font assets. The separately supplied Alcyone package is authoritative only for the operator's commercial one-website grant and remains in the private overlay. This document does not assert a license for any future Tripwire or Cult UI source that has not actually been imported. Trademark rights are separate; see `TRADEMARKS.md`.
