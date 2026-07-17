# Design verification evidence

> Superseded baseline: the first part of this file records rendered evidence for the earlier 24-journal, Jacquard-only candidate and must not be cited as proof of the changed experience. The dated 2026-07-17 focused-journal section below is the controlling record for the local redesign; live Production remains a separate approved cutover.

This record covers the Cumulus 0.0.8 selected and literal design branches. It contains no provider identifiers, secrets, subscriber data, or private project provenance.

## Reviewed candidates

| Design | Branch and reviewed base | Result |
| --- | --- | --- |
| Selected original composition | `request/cumulus-original@c3baf3d`, runtime-identical to `main@e1d0328` | Pass after a Node 24 clean install, complete release suite, and responsive browser suite |
| Literal reference composition | `request/jacquard-reference@281fe37` | Pass after the same clean release suite plus the literal stylesheet's right-edge popover and mobile-fit checks |

After shared-behavior reconciliation, a runtime-tree comparison contains only `src/styles.css`. The selected runtime tree equals `main`; the literal variant preserves its reference composition while sharing routes, content, GitHub data contracts, authentication, notification behavior, privacy disclosure, accessibility code, static metadata, and tests.

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
- Both branches: 153 unit and component tests pass across 22 files.
- Both branches: production build emits 28 public static routes.
- Both branches: desktop/mobile browser suite passes 13 tests; the single skip is the intentionally mobile-only assertion in the desktop project, which passes in the mobile project.
- Production: the same 13-test suite passes against `https://cumulush.com`, including `/work`, `/privacy`, all 24 articles, graph placement, filters, mobile fit, and the real 404 route.
- Visual primitive tests cover WebGL rejection, static fallbacks, pixel ceilings, intersection pausing, reduced motion, and pointer-transparent Edge Blur layers.
- Content and browser tests cover all 24 published articles, source sections, related links, direct routes, and the real not-found experience.
- Dialog tests cover focus trapping, Escape, restored focus, consent, and visible error/status behavior.
- Public-safety and license scans pass; the browser bundle contains only the three approved non-charted Jacquard fonts.

## Assumptions and limits

- Browser screenshots use only public activity data and do not prove private provider-account configuration.
- Rendered and automated design proof does not prove email receipt. Production sign-in, delivery, unsubscribe, and suppression remain separate provider gates in the completion matrix.
- The `#5f5f5f` quiet token is limited to non-essential decoration and placeholder treatment; readable copy uses the higher-contrast body and muted roles.

## 2026-07-17 focused-journal dither candidate

This is the controlling design record for the current local, uncommitted candidate. The selected working tree is based on `main@89db41e`; its shared implementation is mirrored into `request/cumulus-original@4ac3b4b` and `request/jacquard-reference@7ff45fe`. The selected and original trees are byte-identical for the candidate delta. The literal branch is byte-identical for every changed non-style file and preserves its distinct reference composition in `src/styles.css`. Nothing was staged, committed, pushed, deployed, migrated, or configured in a provider.

### Rendered production-build evidence

The selected and literal candidates were built under Node 24.5.0 and served from fresh local production-preview servers. Chromium review covered Home, Log index, Public Work, a representative article, and the notification dialog at 1280 × 720 and 390 × 844 CSS viewports. Generated screenshots remain outside public Git; hashes identify the reviewed public-safe artifacts.

| Artifact | Bitmap dimensions | SHA-256 |
| --- | --- | --- |
| Accepted Public Work hero reference | 1280 × 720 | `2d64013d1bdbd689262d0d96da6ad1d89ed723f747e43e0e0cc7edd5cb4b6f0d` |
| Selected Home | 1280 × 720 | `86c27aab4b02c5fc5e66303f69355a3c3aca88820106e7f31ae6b28a3e5a183f` |
| Selected Public Work | 1280 × 720 | `b5e5ce3e4039f291a04575c15172dc6842dc0ab491f5de4dc6dc7810e17bcf1c` |
| Selected Log index | 1280 × 720 | `6ca324a1853160bdcf255dc7601caf53c63b73bea669f000c159dd4834ff36b6` |
| Selected representative article | 1280 × 720 | `7b831400a6476ef9402222428de59ca9158fce617879f3e1bbaec97478b7c9dc` |
| Selected mobile Home | 390 × 844 | `8c26b570bc22307b98c3aaead7f5f2316fd81ca68ff48e12b9b5ddd0cda1788d` |
| Selected notification dialog | 1280 × 720 | `068153a5fb08a68c1f95669ca9da6452bd2a8d1de002b82cd95310d67908100f` |
| Literal-reference Home, desktop | 1273 × 716 | `506ddc63533e3fa2dc06713645c965cfeb0d31f9cd7d804d539d466d7ae03ab5` |
| Literal-reference Home, mobile | 383 × 829 | `7bc5d0ee9431d17eaeeb84dc704700baf585626397f331e106c711d025008eb9` |

The literal-branch screenshots were exercised at exact 1280 × 720 and 390 × 844 CSS inner viewports; the bitmap dimensions exclude browser UI and the vertical scrollbar.

### Reference comparison and mismatch ledger

The accepted Public Work reference and selected Home were opened together at the same desktop viewport before sign-off.

1. Both heroes use the same two-lobe wave field, grayscale density, black negative space, frame, size, speed, and 8 × 8 dither language.
2. The Home title occupies the reference's left editorial anchor without crossing the wave's readable negative space; `lab` remains subordinate and orange stays a small signal.
3. The Home graph intentionally replaces the reference's prose band below the wave. Its static dither layer, grid, legend, and details preserve the graph's information while keeping the popover in the viewport layer.
4. At 390 × 844, the title, wave, graph, touch picker, and summary stack without horizontal clipping. The literal branch retains its own mobile macro layout while using the same shared behavior and dither vocabulary.
5. Copy remains product-specific: Home says `Systems / Interfaces / Evidence` and describes public Cumulus journals; Public Work retains its first-party project-map introduction. No third-party wording or media was copied.

Two visible differences are intentional rather than defects: the header action now says `Notification settings` instead of the older `Sign in`, and Home uses the required activity graph in the lower hero band. No unresolved visual mismatch remained after the combined comparison.

### Current browser and automated proof

- Home exposes twenty unique journal routes with nineteen Canvas2D artwork surfaces plus the featured hero illustration; Public Work exposes four projects, all twenty journal routes, and twenty-four deterministic artwork surfaces; the Log index renders twenty illustrated articles.
- Every direct journal route has a lead illustration, one dither surface per body section, and three illustrated related journals. The route crawl covers all twenty articles.
- Selected and literal production previews have no horizontal overflow at either target viewport. Computed roles keep H1/H2 in Jacquard 24, ordinary headings in Jacquard 12, and only narrative copy in the `Alcyone Medium, Jacquard 12` stack.
- The notification dialog isolates the page with `inert` and `aria-hidden`, locks scroll, traps/restores focus, and cleans up on close. Responsive navigation returns focus to its Menu control.
- The selected local preview emitted only the expected Vercel Analytics and Speed Insights local-unavailability messages; the literal preview emitted no console warning or error. Neither preview produced an application exception, framework overlay, or unhandled rejection.
- Node 24.5.0 passes lint, dual TypeScript compilation, 151 tests across 26 files, the commercial-font/license boundary, a 99-module production build with 24 public routes, the 141-file/31-browser-asset safety scan, a zero-vulnerability dependency audit, and `git diff --check`.
- The final browser matrix has 18 authored cases: 16 pass and two viewport-specific cases skip only where the equivalent picker or pointer test does not apply. A separate desktop graph stress run passes 5 of 5 attempts after frame movement was disabled while the interactive grid owns the pointer.

### Candidate limits

- This proof is local and candidate-specific. Production still serves the earlier 24-journal build; Vercel Preview, `main` publication, Production promotion, domain behavior, and provider configuration were not changed or inferred.
- Alcyone is a licensed external Production webfont. Its tested same-origin route uses a server-only value and fails closed when absent; Git, local runtime artifacts, and the static build contain no Alcyone bytes. The local previews therefore render the declared Jacquard fallback, and live licensed-font activation remains an external gate.
- Browser automation uses deterministic anonymous/public API fixtures. It proves first-visit prompt behavior and graph interaction, not live GitHub availability, notification receipt, unsubscribe delivery, suppression, or provider-account state.
- Journal dates are editorial candidate ordering. The 8 Requisia, 7 Insuja, 3 Hyoka Hanesu, and 2 gy entries are maintainer-authored public summaries, not proof of deployment, customer use, or private-project release status.
