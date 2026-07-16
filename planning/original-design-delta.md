# Original design branch

`request/cumulus-original` starts from the first complete reference implementation and preserves its routes, content, and behavior. Later shared runtime, accessibility, content, and security corrections are reconciled across both branches. Its visible composition is an independent Cumulus treatment: the contribution calendar becomes a continuous shader-backed signal field, orange rules create a different section rhythm, and the closing field uses a restrained orange signal rather than an orange-dominant wordmark.

The original visual delta landed alone in `c9d2b49`: one planning record, the GitHub graph component and test, and the stylesheet. The later commits on the branch are shared security, routing, public-data, and release corrections rather than additions to the design scope.

The original Cumulus pass makes the brand signal its own rather than leaving the reference as the visible endpoint:

- the small `lab` counterpoint is orange against the oversized white `CUMULUS` wordmark;
- orange rules mark the transition from the hero into the editorial body and frame the full-width signal field;
- section labels use orange as a navigational signal instead of a decorative fill;
- the `ocque41` contribution calendar, its activity cells, legend, and unavailable state sit inside one continuous shader-backed dither field;
- the closing dither footer keeps the large neutral Cumulus wordmark and uses orange only as a compact signal accent.

Assumptions:

- black remains the dominant canvas and orange remains scarce enough to communicate state and hierarchy;
- no new visual asset is needed because the change operates on existing typography, rules, and supplied dither components;
- the content, routing, auth, notification, source-evidence, and accessibility contracts are identical to the verified reference branch.
