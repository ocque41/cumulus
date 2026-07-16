# Cumulus brand guidelines

These rules are the visual source of truth for Cumulus 0.0.8. They apply to product UI, public screenshots, and marketing surfaces in this repository.

## Brand premise

Cumulus should feel like an austere publication terminal: black space, legible gray type, deliberate Jacquard texture, and a single hot signal. Decoration earns its place by clarifying hierarchy or movement through the logs.

## Color

The palette is intentionally closed:

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#000000` | Page background and deep surfaces |
| Text primary | `#f2f2f2` | Headings and essential content |
| Text body | `#c7c7c7` | Long-form and supporting copy |
| Text muted | `#8a8a8a` | Metadata and secondary labels |
| Text quiet | `#5f5f5f` | Disabled or low-priority detail with adequate context |
| Divider | `#2a2a2a` | Rules and restrained boundaries |
| Surface | `#111111` | Raised black surface when separation is necessary |
| Signal | `#ff4d00` | Tiny focus, active, live, and call-to-action accents |

Do not introduce white, tinted grays, gradients with new hues, or alternate semantic colors. Gray values may be tuned for contrast, but they must remain neutral. Use the orange signal sparingly: a short rule, dot, focus outline, small label, caret, or compact action is appropriate; large orange panels and paragraphs are not.

Never communicate success, warning, error, or selection with color alone. Pair the signal with text, position, shape, or an icon.

## Typography

Only these supplied font families are part of the brand:

- **Jacquard 24** — display titles and hero statements;
- **Jacquard 12** — reading text, navigation, and interface copy;
- **Jacquarda Bastarda 9** — dates, issue marks, compact labels, and expressive editorial details.

The charted versions of all three families are intentionally omitted. Do not add them to the repository, preload them, or use them in generated artwork.

Recommended scale:

| Role | Family | Responsive size | Line height |
| --- | --- | --- | --- |
| Hero / H1 | Jacquard 24 | `clamp(3.5rem, 12vw, 10rem)` | `0.82–0.92` |
| H2 | Jacquard 24 | `clamp(2.25rem, 6vw, 5.5rem)` | `0.9–1` |
| H3 | Jacquard 12 | `clamp(1.5rem, 3vw, 2.5rem)` | `1–1.1` |
| Body | Jacquard 12 | `clamp(1.05rem, 1.4vw, 1.3rem)` | `1.45–1.65` |
| Label / metadata | Jacquarda Bastarda 9 | `0.85–1rem` | `1.2–1.4` |

Do not synthesize weights or italics the files do not provide. Use size, spacing, tone, and family changes for hierarchy. Do not add generic, system, remote, or icon-font fallbacks to authored font stacks; the three supplied families are the complete typography system.

Keep long lines around 55–72 characters. Test the smallest body and metadata roles on real mobile widths before release.

## Layout

- Use a strong editorial grid and generous black negative space.
- Keep the hero focused on one statement and one restrained notification action.
- Present logs chronologically with visible dates and clear heading order.
- Favor thin gray rules and spacing over cards within cards.
- Make the primary reading column comfortable rather than full viewport width.
- Preserve the source reference's hierarchy on desktop and mobile; do not collapse the visual identity into a generic card stack.

## Component vocabulary

The allowed component system is limited to:

1. Tripwire Dither Kit;
2. Dither Image;
3. Edge Blur;
4. Hero Dithering;
5. faithful local derivatives needed for this product.

Native semantic HTML, small project-local layout wrappers, and accessibility helpers are allowed. They are implementation primitives, not permission to introduce another UI kit.

A faithful derivative preserves the source idea and behavior while adapting it to this React/Vite codebase. For example, a Dither Image derivative may use a normal responsive `<img>` and CSS layers instead of Next.js `Image`; an Edge Blur derivative may use stacked backdrop filters and a gradient mask. Do not install Next.js to reuse Next-specific source.

Before copying third-party source, verify its redistribution terms and record the license in `docs/licensing.md` and `NOTICE`. Cleanly authored local derivatives are preferred when upstream terms or dependencies are unclear.

## Dither and blur

- Dither belongs on artwork or a dedicated visual layer, never on body text or controls.
- Keep captions outside filtered containers so they remain crisp.
- Edge Blur must not intercept pointer input and must stay outside the scrolling element it decorates.
- Keep shader movement calm and stop or simplify it for `prefers-reduced-motion`.
- Preserve a static readable frame if WebGL, canvas, or an image fails.
- Avoid dither density that produces flicker, moiré, or unreadable edges on small screens.

## Interaction and accessibility

- Every interactive element must be keyboard reachable and have an obvious `#ff4d00` or high-contrast gray focus state.
- Keep touch targets at least 44 by 44 CSS pixels where practical.
- Buttons and links need explicit labels; placeholder text is not a label.
- Notification forms must explain what the reader will receive before submission.
- Validation and delivery status must be announced to assistive technology.
- Decorative dither layers should be hidden from assistive technology; content images need useful alternative text.
- Verify at 320 px, 390 px, tablet, standard desktop, and wide desktop widths.

## Assumptions

The supplied regular font files are the authoritative font assets and retain their SIL OFL 1.1 notices. The live production domain and any historical visual assets are external and unverified. If either assumption changes, update this file and the licensing/release records before publishing.
