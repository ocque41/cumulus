# Design verification checklist

> Candidate reset — 2026-07-17: the checked baseline below belongs to the earlier 24-journal/Jacquard-only build. It is historical evidence, not sign-off for the current local redesign. The current candidate must complete the delta gates below before this checklist can be cited again; Production proof remains a separate approval gate.

## Current candidate delta gates

- [x] Home and Public Work render the same wave-dither hero preset with no oversized cloud, at matching desktop and mobile states.
- [x] All twenty focused journals appear on Home, Public Work, and the log index with deterministic dither illustrations; every direct article has a lead, per-section, and related-journal dither surface.
- [x] Jacquard heading/interface/label families are unchanged; Alcyone Medium is scoped only to narrative body copy and its licensed bytes remain outside Git, Local runtime, and static build output. Live Vercel Preview and Production configuration remain separate external gates.
- [x] GitHub hover details remain unobstructed after the cell transition; click pins, outside/Escape returns to transient mode, the responsive picker returns focus, unavailable grids are inert, and a notification modal removes any body portal.
- [x] The first eligible visit opens one optional notification invitation, records only the versioned non-identifying marker, does not repeat, remains manually available, and excludes privacy/callback/unknown routes.
- [x] The complete Node 24 release set and desktop/mobile browser suite pass after all remediation, with no horizontal overflow or unexpected console error.

Complete this checklist independently for the literal reference branch and the original visual-structure branch. Attach current screenshots or recordings to each review; a source-code inspection alone is insufficient.

Current Cumulus 0.0.8 sign-off is recorded in [design verification evidence](design-verification-evidence.md). Checked items below are backed by that rendered, automated, or source-inspection evidence; they are not completion evidence for the separate live email lifecycle.

## Review setup

- [x] Use a production build, not only the development server.
- [x] Record the branch, commit, browser, operating system, date, and viewport with the evidence.
- [x] Test at approximately 375 px, 768 px, 1440 px, and a wide desktop viewport.
- [x] Review with normal motion, reduced motion, WebGL enabled, and WebGL unavailable.
- [x] Use public-safe sample data and close unrelated tabs before capturing evidence.

## Brand system

- [x] The canvas and structural surfaces are pure black.
- [x] Text roles use intentional neutral-gray variants with readable contrast.
- [x] Orange is confined to small, high-contrast accents, focus, or status details.
- [x] Only the supplied Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9 files are bundled in public browser assets.
- [x] The historical baseline introduced no other typography family. The current Alcyone narrative role is governed by the candidate delta and commercial-font boundary above.
- [x] Headings, labels, body copy, metadata, links, and controls form a coherent type scale at every viewport.

## Approved visual vocabulary

- [x] Every decorative visual is an approved Dither Image, Edge Blur, Hero Dithering, Tripwire-style dither treatment, or a documented faithful derivative.
- [x] The layout does not depend on an unrelated component library or stock design system.
- [x] Shader and dither treatments preserve legibility and do not cover controls.
- [x] Edge Blur is pointer-transparent and remains positioned correctly during scroll.
- [x] Offscreen shader work is paused or bounded; pixel ratio and pixel count are capped.
- [x] Reduced motion disables or substantially calms animation without removing content.
- [x] A static visual fallback appears when WebGL or shader initialization fails.

## Home page

- [x] `CUMULUS` is the dominant hero text and remains fully readable without clipping.
- [x] `lab` is visibly subordinate and intentionally small.
- [x] The `ocque41` GitHub graph has an accessible heading, loading state, empty state, error state, and source link.
- [x] GitHub activity is explicitly bounded to the public profile and does not imply facts the API cannot prove.
- [x] The page is intentionally large but has purposeful pacing, section hierarchy, and orientation cues.
- [x] The literal branch follows the supplied reference's macro order, grid, spacing rhythm, and density without copying third-party wording or media.
- [x] The original branch is structurally distinct while retaining the same brand, content, routes, and behavior.

## Index, post, and footer pages

- [x] The log index exposes every published post exactly once and excludes drafts.
- [x] Every post page is expansive, readable, and uses multiple varied dither components without turning prose into texture.
- [x] Titles, project labels, dates, evidence mode, related posts, and next navigation remain clear on mobile.
- [x] Public-source reviews expose their primary sources. The current first-party journals deliberately expose no invented or private backlink.
- [x] Related-post backlinks resolve and do not create dead ends.
- [x] The footer is visually prominent and dither-led while retaining semantic navigation, notification controls, and readable legal links.
- [x] Empty, loading, error, long-title, long-source-list, and no-related-post states do not break the layout.

## Interaction and accessibility

- [x] A keyboard-only user can reach and operate navigation, sign-in, notification preferences, post links, sources, and unsubscribe.
- [x] Focus indicators are consistently visible and do not rely on color alone.
- [x] Heading order, landmarks, link names, labels, descriptions, and error messages are meaningful.
- [x] Dialog focus is trapped while open and restored on close; Escape closes where expected.
- [x] Status changes and form errors are announced appropriately.
- [x] Touch targets and spacing are usable at the narrowest viewport.
- [x] Text zoom to 200% and browser zoom do not hide content or controls.
- [x] Contrast is checked for every gray role and the minimal orange accent in its actual context.

## Runtime quality

- [x] No unexpected error, warning, failed request, hydration message, or unhandled rejection appears in the browser console.
- [x] Routes work when loaded directly and after client-side navigation.
- [x] Back/forward navigation restores the correct route and scroll behavior.
- [x] The page remains usable with GitHub unavailable, Resend unavailable, or JavaScript shader support absent.
- [x] Initial load, scroll, and route transitions remain responsive on a representative mobile device or throttled profile.
- [x] Browser assets contain no secret, private path, internal URL, customer data, or unapproved font/component asset.

## Sign-off

Record defects with severity, route, viewport, reproduction steps, and evidence. Do not check an item because the implementation appears plausible. Mark the branch design-ready only after every applicable item has direct proof and all high-severity defects are resolved.
