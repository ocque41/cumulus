# Licensing

Cumulus 0.0.8 deliberately separates project code from third-party font assets.

## License map

| Material | License | Notes |
| --- | --- | --- |
| Application source, public API code, tests, scripts, documentation, and public migration source | Apache License 2.0 | The root `LICENSE` is authoritative. |
| Jacquard 12 and Jacquard 24 font software | SIL Open Font License 1.1 | Copyright 2023 The Soft Type Project Authors. |
| Jacquarda Bastarda 9 font software | SIL Open Font License 1.1 | Copyright 2023 The Soft Type Project Authors. |
| Installed npm packages | Their respective upstream licenses | The lockfile and `license:check` define the release input. |

No AGPL code is included in this fresh reference project. Do not add AGPL-derived implementation to an Apache-2.0 path. If a future architecture needs an AGPL service, keep it in a separately licensed repository or service and communicate through a documented network API.

## Font handling

Only these web-font conversions of the supplied regular files are approved for distribution:

- `src/assets/fonts/Jacquard12-Regular.woff2`
- `src/assets/fonts/Jacquard24-Regular.woff2`
- `src/assets/fonts/JacquardaBastarda9-Regular.woff2`

They are format conversions of the non-charted TTF files in the supplied archives and remain font software under SIL OFL 1.1. The original TTF files do not need to be shipped beside the smaller web formats. The charted archives and charted font variants are intentionally not distributed. Do not regenerate or add them as build output.

The full SIL Open Font License 1.1 text and upstream copyright notices are reproduced in `NOTICE`, and the two exact upstream license files are retained under `licenses/fonts/`. Keep those notices with every public distribution that contains the font files. Font conversions or subsets remain font software under the OFL; do not relicense them as Apache-2.0 or use a reserved font name for a modified version without permission.

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

The supplied font archives and their embedded OFL files are treated as authoritative. This document does not assert a license for any future Tripwire or Cult UI source that has not actually been imported. Trademark rights are separate; see `TRADEMARKS.md`.
