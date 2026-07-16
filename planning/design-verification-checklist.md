# Design verification checklist

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
- [x] Only the supplied Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9 files are requested by the page.
- [x] No authored CSS, dependency, image, icon font, or browser request introduces another typography family.
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
- [x] Titles, project labels, dates, sources, related posts, and next navigation remain clear on mobile.
- [x] Every source backlink is visually identifiable, keyboard reachable, and resolves to a public HTTPS source.
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
- [x] The page remains usable with GitHub unavailable, Supabase unavailable, Resend unavailable, or JavaScript shader support absent.
- [x] Initial load, scroll, and route transitions remain responsive on a representative mobile device or throttled profile.
- [x] Browser assets contain no secret, private path, internal URL, customer data, or unapproved font/component asset.

## Sign-off

Record defects with severity, route, viewport, reproduction steps, and evidence. Do not check an item because the implementation appears plausible. Mark the branch design-ready only after every applicable item has direct proof and all high-severity defects are resolved.
