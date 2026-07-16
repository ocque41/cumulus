# Design verification evidence

This record covers the Cumulus 0.0.8 selected and literal design branches. It contains no provider identifiers, secrets, subscriber data, or private project provenance.

## Reviewed candidates

| Design | Branch and reviewed base | Result |
| --- | --- | --- |
| Selected original composition | `request/cumulus-original@1a8f0af`, deployed through `main` | Pass, followed by the text-reflow correction recorded in Git |
| Literal reference composition | `request/jacquard-reference@c3c489c` | Pass, followed by the same text-reflow correction and a neutral graph-width correction recorded in Git |

After shared-behavior reconciliation, a branch-tip comparison contained only `src/styles.css`. The variants therefore share routes, content, GitHub data contracts, authentication, notification behavior, accessibility code, static metadata, and tests while retaining independent visual compositions.

## Rendered evidence

Chromium contact sheets were captured on macOS with live public GitHub data. Each sheet contains hero captures at 375, 768, 1440, and 1920 CSS pixels plus a 1440-pixel article hero and dither footer. Generated screenshots stay outside the public Git history; hashes identify the reviewed artifacts without publishing machine paths.

| Artifact | Dimensions | SHA-256 |
| --- | --- | --- |
| Selected original contact sheet | 1800 × 3828 | `7074fcb908aa189bda1e1c1f278abd1af776769e7a61f47b83b9f60b36527905` |
| Literal reference contact sheet | 1800 × 4266 | `e250bf28d4be06ddf36d3abc1869e8b1aabb03c036febc5eb2edb04473bcd86f` |

Manual inspection confirmed:

- `CUMULUS` remains readable and dominant while `lab` stays subordinate;
- the graph spans the hero width without creating page overflow;
- the selected composition uses the orange dither signal while the reference composition stays neutral;
- article typography remains crisp and outside filtered visual layers;
- the large dither footer retains semantic navigation and readable legal copy;
- no personal handle is visible in rendered copy; GitHub destinations remain normal links.

## Mechanical design audit

The final audit exercised both production builds at 320 × 800, 390 × 844, 768 × 1024, 1440 × 900, and 1920 × 1080. It checked document and graph width, hero-title clipping, console/page errors, visible-identity leakage, and 44-pixel coarse-pointer controls. It separately applied 200% text scaling at 768 × 1024 and `prefers-reduced-motion: reduce` at 1440 × 900.

Result: `DESIGN_RUNTIME_AUDIT 14 checks 0 failures`.

The audit found and corrected two issues before sign-off:

1. reference graph cells retained a five-pixel minimum that exceeded the 320-pixel graph width;
2. the two-column tablet post grid and unwrapped navigation metadata overflowed under 200% text scaling.

The corrected audit proves both documents remain exactly viewport-wide at 200% text scaling. Reduced motion reports no graph animation, no transform, and a zero-second transition in both variants.

Local Vite preview does not serve Vercel Analytics and Speed Insights endpoints, so their two expected local 404s were excluded from the local console gate. The same resources load through Vercel in Production; the production browser run had no such failures.

## Supporting automated evidence

- Both branches: lint and dual TypeScript compilation pass.
- Both branches: 142 unit and component tests pass across 18 files.
- Both branches: production build emits 26 public static routes.
- Both branches: desktop/mobile browser suite passes 9 tests; the single skip is the intentionally mobile-only assertion in the desktop project.
- Visual primitive tests cover WebGL rejection, static fallbacks, pixel ceilings, intersection pausing, reduced motion, and pointer-transparent Edge Blur layers.
- Content and browser tests cover all 24 published articles, source sections, related links, direct routes, and the real not-found experience.
- Dialog tests cover focus trapping, Escape, restored focus, consent, and visible error/status behavior.
- Public-safety and license scans pass; the browser bundle contains only the three approved non-charted Jacquard fonts.

## Assumptions and limits

- Browser screenshots use only public activity data and do not prove private provider-account configuration.
- Rendered and automated design proof does not prove email receipt. Production sign-in, delivery, unsubscribe, and suppression remain separate provider gates in the completion matrix.
- The `#5f5f5f` quiet token is limited to non-essential decoration and placeholder treatment; readable copy uses the higher-contrast body and muted roles.
