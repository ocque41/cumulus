# Design verification checklist

Complete this checklist independently for the literal reference branch and the original visual-structure branch. Attach current screenshots or recordings to each review; a source-code inspection alone is insufficient.

## Review setup

- [ ] Use a production build, not only the development server.
- [ ] Record the branch, commit, browser, operating system, date, and viewport with the evidence.
- [ ] Test at approximately 375 px, 768 px, 1440 px, and a wide desktop viewport.
- [ ] Review with normal motion, reduced motion, WebGL enabled, and WebGL unavailable.
- [ ] Use public-safe sample data and close unrelated tabs before capturing evidence.

## Brand system

- [ ] The canvas and structural surfaces are pure black.
- [ ] Text roles use intentional neutral-gray variants with readable contrast.
- [ ] Orange is confined to small, high-contrast accents, focus, or status details.
- [ ] Only the supplied Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9 files are requested by the page.
- [ ] No authored CSS, dependency, image, icon font, or browser request introduces another typography family.
- [ ] Headings, labels, body copy, metadata, links, and controls form a coherent type scale at every viewport.

## Approved visual vocabulary

- [ ] Every decorative visual is an approved Dither Image, Edge Blur, Hero Dithering, Tripwire-style dither treatment, or a documented faithful derivative.
- [ ] The layout does not depend on an unrelated component library or stock design system.
- [ ] Shader and dither treatments preserve legibility and do not cover controls.
- [ ] Edge Blur is pointer-transparent and remains positioned correctly during scroll.
- [ ] Offscreen shader work is paused or bounded; pixel ratio and pixel count are capped.
- [ ] Reduced motion disables or substantially calms animation without removing content.
- [ ] A static visual fallback appears when WebGL or shader initialization fails.

## Home page

- [ ] `CUMULUS` is the dominant hero text and remains fully readable without clipping.
- [ ] `lab` is visibly subordinate and intentionally small.
- [ ] The `ocque41` GitHub graph has an accessible heading, loading state, empty state, error state, and source link.
- [ ] GitHub activity is clearly labeled as public activity and does not imply facts the API cannot prove.
- [ ] The page is intentionally large but has purposeful pacing, section hierarchy, and orientation cues.
- [ ] The literal branch follows the supplied reference's macro order, grid, spacing rhythm, and density without copying third-party wording or media.
- [ ] The original branch is structurally distinct while retaining the same brand, content, routes, and behavior.

## Index, post, and footer pages

- [ ] The log index exposes every published post exactly once and excludes drafts.
- [ ] Every post page is expansive, readable, and uses multiple varied dither components without turning prose into texture.
- [ ] Titles, project labels, dates, sources, related posts, and next navigation remain clear on mobile.
- [ ] Every source backlink is visually identifiable, keyboard reachable, and resolves to a public HTTPS source.
- [ ] Related-post backlinks resolve and do not create dead ends.
- [ ] The footer is visually prominent and dither-led while retaining semantic navigation, notification controls, and readable legal links.
- [ ] Empty, loading, error, long-title, long-source-list, and no-related-post states do not break the layout.

## Interaction and accessibility

- [ ] A keyboard-only user can reach and operate navigation, sign-in, notification preferences, post links, sources, and unsubscribe.
- [ ] Focus indicators are consistently visible and do not rely on color alone.
- [ ] Heading order, landmarks, link names, labels, descriptions, and error messages are meaningful.
- [ ] Dialog focus is trapped while open and restored on close; Escape closes where expected.
- [ ] Status changes and form errors are announced appropriately.
- [ ] Touch targets and spacing are usable at the narrowest viewport.
- [ ] Text zoom to 200% and browser zoom do not hide content or controls.
- [ ] Contrast is checked for every gray role and the minimal orange accent in its actual context.

## Runtime quality

- [ ] No unexpected error, warning, failed request, hydration message, or unhandled rejection appears in the browser console.
- [ ] Routes work when loaded directly and after client-side navigation.
- [ ] Back/forward navigation restores the correct route and scroll behavior.
- [ ] The page remains usable with GitHub unavailable, Supabase unavailable, Resend unavailable, or JavaScript shader support absent.
- [ ] Initial load, scroll, and route transitions remain responsive on a representative mobile device or throttled profile.
- [ ] Browser assets contain no secret, private path, internal URL, customer data, or unapproved font/component asset.

## Sign-off

Record defects with severity, route, viewport, reproduction steps, and evidence. Do not check an item because the implementation appears plausible. Mark the branch design-ready only after every applicable item has direct proof and all high-severity defects are resolved.
