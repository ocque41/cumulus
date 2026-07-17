import type { Post } from "./post-types.js";

export const RESEARCHED_POSTS = [
  {
    "title": "An Honest GitHub Activity Field: Rich Interaction Without Invented Data",
    "slug": "honest-github-activity-field",
    "body": [
      {
        "heading": "The graph is a data product, not decoration",
        "paragraphs": [
          "A contribution graph looks like a simple matrix of colored squares. In practice, it combines at least three different claims: how much activity happened on each date, what kind of activity it was, and whether the displayed details can be trusted. Cumulus treats those claims separately. The aggregate calendar can be available while individual commits, pull requests, or issues are missing; the interface says so instead of filling gaps with plausible-looking numbers.",
          "That distinction drives the whole design. The browser requests one same-origin endpoint, validates the returned shape, and renders a fixed 53-week field. Every cell has a date and either a verified contribution value or an explicit unknown state. On failure, the grid remains visible as a visual and navigational structure, but it contains no inferred counts. The fallback is deliberately honest: an empty patterned field communicates temporary unavailability without impersonating the real profile."
        ]
      },
      {
        "heading": "A fixed-user server boundary",
        "paragraphs": [
          "The server endpoint cannot be turned into a general GitHub proxy. The account login is a literal in the GraphQL query, and requests with query parameters are rejected. When a least-privilege token is configured, the server asks GitHub GraphQL for the contribution calendar plus recent commit, issue, and pull-request contributions. Without a token, it reads the fixed public contribution-calendar HTML, public events, and public commit search.",
          "Those fallback responses are untrusted input. The parser caps response sizes, enforces timeouts, accepts only canonical dates and nonnegative safe integers, requires 52 or 53 weeks and 364 to 371 sequential days, and allows activity links only on https://github.com. Repository identifiers and titles are length- and character-bounded. A malformed response causes a stable 503 rather than leaking an upstream body or rendering partial nonsense.",
          "The tradeoff is intentional rigidity. A fixed account makes the endpoint less reusable, but it dramatically reduces proxy abuse, credential scope, and cache-key complexity. Public events are also a recent window, not a historical ledger, so older cells may carry an aggregate count without item-level detail."
        ]
      },
      {
        "heading": "Merging aggregates and interactions",
        "paragraphs": [
          "The contribution calendar is authoritative for daily density. Recent public events add opened pull requests, issue activity, and push summaries. Public commit search can replace coarse push counts with concrete recent commit titles and links. Merging happens by canonical UTC date, and highlights are capped per day. That keeps hover cards useful without turning a compact graph into an unbounded event browser.",
          "The response carries activityDetailStatus independently of the calendar. This is a small but important contract choice: the client can say “aggregate verified, details unavailable” instead of collapsing all upstream conditions into a generic loading error. The endpoint also emits an ETag derived from the visible payload and uses shared-cache directives with stale-on-error windows. The browser still asks the same-origin route with cache: no-store; edge caching and browser freshness are different responsibilities."
        ]
      },
      {
        "heading": "Interaction with a keyboard path",
        "paragraphs": [
          "Pointer movement tilts and shifts the entire field through CSS custom properties, while the active cell rises along the Z axis. Hovering reveals a dithered rectangular panel with the full date, contributions, commits, pull requests, issues, and up to six highlights. Clicking pins a day for touch users. Focus triggers the same panel, arrow keys move through the week-oriented grid, and Escape clears the selection.",
          "Each of the 371 cells is a button with a complete accessible label. The graph itself announces the reported total and active-day count. Reduced-motion CSS disables wobble, transforms, and transitions, and failed data leaves profile links available. The limitation is density: 371 focusable semantic controls would be noisy if all entered the tab order, so only the current calendar endpoint is tabbable and arrow keys provide internal navigation."
        ]
      },
      {
        "heading": "What this architecture buys",
        "paragraphs": [
          "The result is interactive without confusing motion for truth. Presentation layers can wobble, dither, zoom, and glow; the data boundary remains fixed, bounded, and explicit about uncertainty. Tests protect both sides: server tests reject arbitrary users and malformed calendars, while component tests verify 371 dithered cells, accessible labels, honest fallback copy, keyboard movement, and real interaction links.",
          "The main operational limit remains GitHub itself. Anonymous endpoints are rate-limited, public event detail is time-bounded, and contribution totals can reflect activity that public event feeds cannot describe. That is why the design never promises complete historical commit reconstruction. It promises an authoritative aggregate field with best-effort, clearly labeled recent detail."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public cumulus source 1",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/server/github/client.ts"
      },
      {
        "label": "Public cumulus source 2",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/server/github/handler.ts"
      },
      {
        "label": "Public cumulus source 3",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/src/components/github/GitHubContributionGraph.tsx"
      }
    ],
    "relatedSlugs": [
      "dither-without-burning-the-gpu",
      "sending-a-new-post-email-once",
      "public-repository-private-operations"
    ],
    "category": "Cumulus lab",
    "project": "cumulus",
    "date": "2026-07-16",
    "excerpt": "A contribution graph looks like a simple matrix of colored squares. In practice, it combines at least three different claims: how much activity happened on each date, what kind of activity it was, and whether the displayed details can be trusted. Cumulus.",
    "status": "published",
    "tags": [
      "Cumulus lab",
      "Public source review",
      "The graph is a data product, not decoration"
    ],
    "readingTime": 0,
    "placement": "featured",
    "visual": {
      "variant": "cloud-gate",
      "alt": "Dither study for An Honest GitHub Activity Field: Rich Interaction Without Invented Data"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Dither Without Burning the GPU: Building a Resilient Visual Primitive",
    "slug": "dither-without-burning-the-gpu",
    "body": [
      {
        "heading": "A shader is the enhancement, not the component",
        "paragraphs": [
          "Animated dithering can establish an entire visual identity, but it is easy to make the effect synonymous with a continuously running WebGL canvas. Cumulus takes a different view: the component is a layered visual contract, and the shader is one possible implementation of that contract. A static dot matrix is rendered first. The animated Paper Shaders surface mounts only when the browser, viewport, and pixel budget all say it is safe.",
          "That ordering matters. A reader on an older browser, a device under graphics pressure, or a page with many offscreen cards still receives the intended black-and-gray texture. The site does not replace a failed canvas with a blank rectangle. The fallback also makes server rendering and test environments predictable because the meaningful visual substrate does not depend on a GPU context."
        ]
      },
      {
        "heading": "Mount only near the viewport",
        "paragraphs": [
          "The HeroDither primitive measures its container with ResizeObserver and watches proximity with IntersectionObserver. Its root margin begins preparation shortly before the element enters view, but offscreen instances do not retain live WebGL canvases. This is especially important on editorial grids: one shader per card can exhaust a browser’s finite context pool long before the page feels visually complex.",
          "A WebGL2 probe runs only when the element is near the viewport. Successful support is cached per document in a WeakSet, and the probe explicitly loses its temporary context when the extension is available. Context-creation errors and context-loss events switch the component back to the static layer. A React error boundary catches render-time shader failures too.",
          "The tradeoff is a small activation delay as a visual approaches the viewport. That is preferable to keeping every canvas hot, and the already-painted fallback makes the transition feel like enhancement rather than loading."
        ]
      },
      {
        "heading": "Budget real pixels, not CSS dimensions",
        "paragraphs": [
          "High-density displays can turn a modest CSS rectangle into millions of shader pixels. The component calculates CSS pixel count, applies a device-pixel-ratio ceiling, and then intersects that with an absolute pixel budget. The render ratio is derived from the smallest safe constraint and never drops below a defined floor. The shader therefore scales with the layout without silently multiplying cost on a 3x screen.",
          "Different placements can set different budgets. The compact activity field, for example, uses a lower cap than a full hero. That makes performance policy part of the component interface rather than a hidden global guess. The cost is that very dense displays may render a slightly softer shader. In a dither system, that softness is usually compatible with the aesthetic and much cheaper than uncontrolled fill rate."
        ]
      },
      {
        "heading": "Motion preference and composable texture",
        "paragraphs": [
          "Reduced-motion preference sets shader speed to zero, and a site-level media query removes wobble, transforms, and transitions from the contribution field. This does not remove the information architecture or the texture. Dither remains a pattern language rather than a mandatory animation language.",
          "The broader visual kit uses the same progressive approach. DitherImage wraps native images with typed CSS variables for grayscale, contrast, brightness, blur, matrix size, and opacity. Captions remain outside the filtered frame so they stay crisp. Reveal overlays duplicate the image decoratively and apply directional masks. EdgeBlur first verifies support for both backdrop filtering and masking; unsupported browsers get no edge treatment rather than an opaque blur slab.",
          "These primitives are constrained on purpose. A narrow vocabulary makes pages feel related and keeps licensing provenance visible. It also means a new visual effect should usually be expressed as a derivative of the existing system instead of importing another animation library."
        ]
      },
      {
        "heading": "Failure modes become design inputs",
        "paragraphs": [
          "The strongest part of this approach is not the shader itself; it is the list of conditions under which the shader should disappear. Missing observers, absent WebGL2, lost context, render errors, offscreen position, and reduced-motion preference all lead to explicit behavior. Each condition preserves content and layout.",
          "That discipline is reusable beyond dither. Expensive visual systems should define a static baseline, an activation boundary, a resource ceiling, and an accessible motion policy before tuning the effect. Once those constraints are encoded in the primitive, every hero, card, graph, and footer inherits the same resilience without reimplementing browser checks."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public cumulus source 1",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/src/components/visual/HeroDither.tsx"
      },
      {
        "label": "Public cumulus source 2",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/src/components/visual/DitherImage.tsx"
      },
      {
        "label": "Public cumulus source 3",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/src/components/visual/EdgeBlur.tsx"
      }
    ],
    "relatedSlugs": [
      "sending-a-new-post-email-once",
      "public-repository-private-operations",
      "honest-github-activity-field"
    ],
    "category": "Cumulus lab",
    "project": "cumulus",
    "date": "2026-07-15",
    "excerpt": "Animated dithering can establish an entire visual identity, but it is easy to make the effect synonymous with a continuously running WebGL canvas. Cumulus takes a different view: the component is a layered visual contract, and the shader is one possible.",
    "status": "published",
    "tags": [
      "Cumulus lab",
      "Public source review",
      "A shader is the enhancement, not the component"
    ],
    "readingTime": 0,
    "placement": "feature-rail",
    "visual": {
      "variant": "signal-window",
      "alt": "Dither study for Dither Without Burning the GPU: Building a Resilient Visual Primitive"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Sending a New-Post Email Once: Leases, Idempotency, and Suppression",
    "slug": "sending-a-new-post-email-once",
    "body": [
      {
        "heading": "“Send to everyone” is a distributed workflow",
        "paragraphs": [
          "A new-post notification sounds like a loop: load subscribers and call an email API. Cumulus deliberately narrows that workflow around Resend's own durable primitives. A Contact holds the address, a dedicated Segment defines the Cumulus audience, an opt-out-by-default Topic records consent, and a named Broadcast owns one publication. Vercel functions provide the access and publication boundary without introducing a second subscriber database.",
          "The public endpoint accepts only a bearer-authenticated POST with a strict slug-shaped body. It resolves that slug against published content instead of allowing an arbitrary title, recipient, or template to arrive over the network. A dry run validates the Resend Segment and Topic without creating or sending a Broadcast. Responses return only publication status, never addresses or Contact IDs."
        ]
      },
      {
        "heading": "Claim before contacting the provider",
        "paragraphs": [
          "Every post maps to a deterministic Broadcast name and an idempotency key derived from its immutable slug. Before creating anything, the function searches existing Broadcasts. If it finds one, it loads the full provider record and compares Segment, Topic, sender, subject, HTML, and text. A mismatch is a hard conflict rather than permission to overwrite history.",
          "Concurrent invocations therefore converge on one provider resource. Resend's idempotency header covers the create race, while the deterministic lookup recovers when a provider response is lost. A matching draft may be sent; a matching queued or sent Broadcast becomes an already-sent result. An idempotency payload conflict is never treated as success.",
          "This is not a mathematical exactly-once claim. It is a deliberately small delivery identity whose durable state lives with the delivery provider. That removes cross-system reconciliation between a subscriber database and Resend while preserving an inspectable conflict boundary."
        ]
      },
      {
        "heading": "Bound the serverless invocation",
        "paragraphs": [
          "The Vercel function does not fan out to Contacts itself. It creates one Resend Broadcast targeted to the dedicated Segment and Topic, then asks Resend to send that draft. The provider owns audience expansion, unsubscribe headers, and delivery pacing. This keeps serverless runtime proportional to one control-plane operation rather than subscriber count.",
          "Resource checks happen before dry runs and sends. The Topic must exist and default to opt-out, which prevents a newly created Contact or topic association from becoming consent by accident. Provider identifiers remain deployment configuration, so a fork cannot inherit the live audience from Git.",
          "Network and provider failures return a retryable service response without exposing provider payloads. Invalid resource state and content conflicts fail closed. Operational tooling can safely retry the same slug because it reuses the same Broadcast identity rather than constructing another recipient loop."
        ]
      },
      {
        "heading": "Unsubscribe and provider feedback close the loop",
        "paragraphs": [
          "Every Broadcast includes Resend's standards-based unsubscribe URL. Readers manage consent through a notification-only magic link whose token lives in the URL fragment, then a signed HttpOnly session cookie. The session grants no profile or publishing capability. Preference changes update only the dedicated Cumulus Topic.",
          "Resend webhooks are verified with Svix against the unmodified raw body. Only bounced, complained, and suppressed events are processed. The handler normalizes unique recipients, verifies that each Contact belongs to the Cumulus Segment, and opts out only the Cumulus Topic. Outlook and unrelated Contact state stay outside this flow."
        ]
      },
      {
        "heading": "The cost of correctness is explicit state",
        "paragraphs": [
          "Named Broadcasts, exact content comparison, topic consent, and suppression handling make ambiguous conditions visible without adding an application subscriber database. The system can answer whether a publication was validated, created, already sent, rejected as conflicting, or suppressed through the same provider control plane.",
          "The remaining limits are operational. Sender verification, truthful postal configuration, webhook registration, retention policy, and monitoring cannot be proven by repository code. The architecture provides safe contracts; production still requires provider configuration and a retrying publication operator. A controlled lifecycle must also demonstrate magic-link receipt, deliberate opt-in, one Broadcast receipt, provider unsubscribe, and later suppression before anyone calls the system complete."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public cumulus source 1",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/server/notifications/publish.ts"
      },
      {
        "label": "Public cumulus source 2",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/server/notifications/resend.ts"
      },
      {
        "label": "Public cumulus source 3",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/server/notifications/resend-webhook.ts"
      }
    ],
    "relatedSlugs": [
      "public-repository-private-operations",
      "honest-github-activity-field",
      "dither-without-burning-the-gpu"
    ],
    "category": "Cumulus lab",
    "project": "cumulus",
    "date": "2026-07-14",
    "excerpt": "A new-post notification sounds like a loop: load subscribers and call an email API. That model fails as soon as two publish requests overlap, a serverless function approaches its time limit, or the provider accepts a message but the response disappears..",
    "status": "published",
    "tags": [
      "Cumulus lab",
      "Public source review",
      "“Send to everyone” is a distributed workflow"
    ],
    "readingTime": 0,
    "placement": "recent",
    "visual": {
      "variant": "terminal-rain",
      "alt": "Dither study for Sending a New-Post Email Once: Leases, Idempotency, and Suppression"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "A Forkable Public App with Private Production Operations",
    "slug": "public-repository-private-operations",
    "body": [
      {
        "heading": "Open source should not mean operational exposure",
        "paragraphs": [
          "A public web application is most useful when the repository contains enough to understand, run, test, and adapt the product. Production, however, necessarily includes values and records that should never be forkable: credentials, subscriber data, provider dashboards, incident notes, and domain-control details. Cumulus defines this as a public application plus a private production overlay, not as a public demo hiding a second secret codebase.",
          "The public side includes the React/Vite interface, server-function contracts, tests, placeholder environment examples, self-hosting documentation, and third-party license notices. The private side holds real Vercel and Resend values; live Contact records; verified sender state; delivery events; internal operator tooling; and production runbooks. Shared behavior stays reviewable. Live authority stays out of Git."
        ]
      },
      {
        "heading": "Environment names are an exposure model",
        "paragraphs": [
          "The boundary is enforced first through naming. Only the canonical site origin is intentionally browser-visible. Provider credentials and resource IDs, webhook secrets, publisher authorization, notification-session signing material, postal address, and optional GitHub token are server-only.",
          "That list is documented in the README, private-overlay guide, and environment template. Documentation matters because Vite can be configured to expose multiple prefixes; a variable is not safe merely because it lives in a deployment dashboard. The browser bundle is the real boundary. A release script scans built JavaScript, CSS, HTML, JSON, and maps for server-only identifiers, token patterns, and local absolute paths.",
          "The tradeoff is some duplication between docs, configuration, and scanning rules. That duplication is useful when it forms independent checks: a developer-facing contract, a deploy-time placement guide, and a mechanical release failure."
        ]
      },
      {
        "heading": "Licensing is architecture too",
        "paragraphs": [
          "The root application is Apache-2.0, while bundled fonts retain SIL Open Font License 1.1 terms. Imported visual components preserve their MIT or Apache notices. The repository includes the exact license texts and a check that fails if required notices disappear or the package license changes.",
          "This arrangement prevents a common open-source mistake: treating every file in one repository as if the root license automatically absorbed it. Font conversions remain font software under the OFL. Copied or derived components retain upstream obligations. The project can distribute a coherent application while acknowledging that assets and dependencies carry different grants.",
          "The limitation is that a manifest check cannot prove the provenance of an unrecorded copied asset. Human review still has to identify what entered the tree, where it came from, and whether attribution is sufficient."
        ]
      },
      {
        "heading": "A release is a sequence of independent proofs",
        "paragraphs": [
          "The public release checklist separates local correctness from external state. Lint, type checking, unit tests, dependency audit, security scanning, license checks, build, and end-to-end tests prove properties of a candidate commit. They do not prove that a sender domain is verified, a webhook is registered, a Segment or Topic has the intended policy, or the intended deployment owns the live domain.",
          "The recommended cutover therefore uses distinct gates: configure preview variables, inspect Resend resources, publish a branch only after approval, inspect the existing Vercel project, run synthetic end-to-end checks, and then approve main replacement or promotion. Keeping the prior deployment available provides an explicit rollback target.",
          "This process is slower than treating a green build as permission to deploy. It is also much clearer about what “ready” means. A repository can be release-ready while production wiring remains incomplete, and the handoff should say exactly that."
        ]
      },
      {
        "heading": "Mechanical checks protect the social contract",
        "paragraphs": [
          "The security scanner examines tracked and untracked public files, blocks private-looking paths, flags private keys and provider-token shapes, and rejects symlinks that escape the repository. It skips binary fonts and the lockfile where text heuristics would be noisy, then separately inspects built browser assets. The license checker verifies root, font, and component notices.",
          "Neither script replaces secret scanning at the host, code review, provider access controls, or incident response. Their value is narrower: repeated mistakes become deterministic failures instead of another paragraph someone might forget. Together with the public/private map, they make the forkability promise concrete. A new contributor can see which work belongs in code, which values belong in an operator environment, and which claims need live evidence before anyone calls a deployment complete."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public cumulus source 1",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/docs/private-overlay.md"
      },
      {
        "label": "Public cumulus source 2",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/scripts/security-scan.mjs"
      },
      {
        "label": "Public cumulus source 3",
        "href": "https://github.com/ocque41/cumulus/blob/ec98f05dece09b3a4ed48468f90a24639b3e848b/docs/public-release.md"
      }
    ],
    "relatedSlugs": [
      "honest-github-activity-field",
      "dither-without-burning-the-gpu",
      "sending-a-new-post-email-once"
    ],
    "category": "Cumulus lab",
    "project": "cumulus",
    "date": "2026-07-13",
    "excerpt": "A public web application is most useful when the repository contains enough to understand, run, test, and adapt the product. Production, however, necessarily includes values and records that should never be forkable: credentials, subscriber data, provider.",
    "status": "published",
    "tags": [
      "Cumulus lab",
      "Public source review",
      "Open source should not mean operational exposure"
    ],
    "readingTime": 0,
    "placement": "recent",
    "visual": {
      "variant": "archive-lines",
      "alt": "Dither study for A Forkable Public App with Private Production Operations"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Provider Isolation Is a Wire Protocol Problem",
    "slug": "provider-boundaries-across-llm-apis",
    "body": [
      {
        "heading": "A port is more than a new base URL",
        "paragraphs": [
          "Adding another model provider to an established coding agent can look deceptively small: change the endpoint, select a different authentication header, and reuse the existing request machinery. That approach works only while the original implementation is already provider-neutral. Grok Build was not. Its sampler had accumulated xAI-specific headers, hosted tools, response metadata, diagnostics, and credential-refresh assumptions.",
          "The OpenAI distribution therefore treats provider support as a wire-boundary problem. A model profile chooses the Responses API, but the decisive control lives closer to the network. The sampler parses the configured base URL once and grants xAI extensions only to narrowly recognized first-party origins. OpenAI and custom endpoints are denied those extensions by default.",
          "That inversion matters. Instead of asking every feature to remember whether it should run, the transport establishes a restrictive capability boundary."
        ]
      },
      {
        "heading": "Recognizing a provider without trusting suffixes",
        "paragraphs": [
          "The sampler’s is_first_party_xai_url function accepts HTTPS on the default port and validates host boundaries. It recognizes x.ai and its real subdomains, while rejecting deceptive suffixes such as api.x.ai.evil.example. The production CLI proxy receives an equally narrow host-and-path check.",
          "That result becomes xai_wire_extensions, a value computed when the sampling client is created. Request construction consults it before adding x-grok-* headers, deployment identifiers, user identifiers, doom-loop headers, or raw xAI tools. Extra headers are filtered again, and the per-request post path removes any xAI-only names that might have entered through another configuration layer.",
          "This is defense in depth around a simple rule: provider-private state follows an explicitly trusted origin, not a model label or a caller’s intention."
        ]
      },
      {
        "heading": "Translating Responses events into agent semantics",
        "paragraphs": [
          "The Responses API integration is not only an HTTP adapter. The Rust stream transformer converts raw server-sent events into the agent’s internal sampling events: text tokens, reasoning channels, tool-call progress, model metadata, terminal success, and typed failure.",
          "Tool execution receives especially careful treatment. Argument deltas can drive progress in the interface, but they are not authoritative enough to execute. At the terminal boundary, finalize_function_calls requires a non-empty call ID, a non-empty function name, valid JSON arguments, and a completed state or authoritative “arguments done” event. Incomplete, truncated, or refused calls are discarded.",
          "The same transformer classifies incomplete responses, refusals, rate limits, authentication failures, and server errors. It guarantees one terminal event per request and keeps retry policy centralized by mapping stream errors onto existing HTTP-like error classes."
        ]
      },
      {
        "heading": "Redirects are part of the trust boundary",
        "paragraphs": [
          "Even correctly filtered initial requests can leak through redirects. A sampling request may contain a bearer token, custom provider headers, and private prompt content. An HTTP library knows that Authorization is sensitive, but it cannot infer that a custom header or request body belongs to one provider.",
          "The shared HTTP client therefore follows redirects only when scheme, host, and effective port remain identical. A cross-origin redirect is returned without being followed. Tests start two local servers, send provider credentials and a private body to the redirecting origin, and prove that the second origin receives nothing.",
          "Connection pooling remains enabled for normal HTTP/2 use, with keepalive and idle eviction. A pool-less HTTP/1.1 client provides a transport fallback, and both clients share the same redirect rule."
        ]
      },
      {
        "heading": "What this design buys—and what it does not",
        "paragraphs": [
          "The benefit is compositional safety. New callers can use the sampler without reproducing every historical xAI exception. OpenAI support also remains compatible with the agent loop’s text, reasoning, tool, usage, and retry abstractions.",
          "The cost is maintenance at two layers: typed API translation and explicit provider policy. Every newly supported hosted tool or response event needs a deliberate mapping. Static host allowlists can also become stale when a provider changes infrastructure. The fork intentionally leaves OpenAI-hosted web search disabled until its request and lifecycle behavior has dedicated isolation tests.",
          "This architecture does not prove that every compatible gateway implements Responses events identically. It instead fails closed around malformed tool calls, unknown trust origins, cross-origin redirects, and provider-specific state—the places where optimistic compatibility would be most dangerous."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public grok-build source 1",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/crates/codegen/xai-grok-sampler/src/client.rs"
      },
      {
        "label": "Public grok-build source 2",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/crates/codegen/xai-grok-sampler/src/stream/responses.rs"
      },
      {
        "label": "Public grok-build source 3",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/crates/codegen/xai-grok-sampler/src/shared_http.rs"
      }
    ],
    "relatedSlugs": [
      "two-lane-auth-without-secret-sprawl",
      "transactional-upstream-sync",
      "release-proof-without-paid-api-calls"
    ],
    "category": "grok-build",
    "project": "grok-build",
    "date": "2026-07-12",
    "excerpt": "Adding another model provider to an established coding agent can look deceptively small: change the endpoint, select a different authentication header, and reuse the existing request machinery. That approach works only while the original implementation is.",
    "status": "published",
    "tags": [
      "grok-build",
      "Public source review",
      "A port is more than a new base URL"
    ],
    "readingTime": 0,
    "placement": "recent",
    "visual": {
      "variant": "split-horizon",
      "alt": "Dither study for Provider Isolation Is a Wire Protocol Problem"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Two Authentication Lanes Without Secret Sprawl",
    "slug": "two-lane-auth-without-secret-sprawl",
    "body": [
      {
        "heading": "One launcher, two deliberately separate modes",
        "paragraphs": [
          "The OpenAI distribution supports two ways to reach a Responses endpoint. Direct Platform mode uses OPENAI_API_KEY. Codex-plan mode uses a loopback CLIProxyAPI service that owns the interactive OAuth lifecycle and exposes an OpenAI-compatible endpoint on 127.0.0.1.",
          "These modes share the TUI and runtime, but not their credentials or state directories. The installer creates an OpenAI Platform profile under one runtime home and a Codex-plan profile under another. The launcher selects the Platform profile when a Platform key is present; otherwise, it can select the loopback profile using a protected local client-token file.",
          "This separation avoids a common integration mistake: treating every bearer-shaped value as interchangeable. A ChatGPT or Codex session is not silently converted into Platform quota, and a Platform key is not handed to the local OAuth proxy."
        ]
      },
      {
        "heading": "The checked-in profiles contain routing, not secrets",
        "paragraphs": [
          "Both TOML profiles are designed to be publishable. They define model aliases, base URLs, context metadata, reasoning levels, the responses backend, and the environment-variable name that should supply credentials. They contain no credential values.",
          "The Platform profile routes to https://api.openai.com/v1 and names OPENAI_API_KEY as its credential source. The Codex-plan profile routes only to the loopback proxy and names GROK_CODEX_PROXY_TOKEN. Auxiliary model slots—including summaries, image descriptions, prompt suggestions, and web-search selection—are pinned to the same provider family so an internal task cannot fall back to a compiled xAI default.",
          "Telemetry, feedback, managed configuration, remote model fetching, voice, video, and hosted backend tools are disabled in both profiles. That is not cosmetic configuration; it shrinks the number of service surfaces that would otherwise need independent credential and provider analysis."
        ]
      },
      {
        "heading": "Keychain without putting a key in argv",
        "paragraphs": [
          "On macOS, the key setup helper delegates secret entry directly to the system Keychain command. The secret is entered through the Keychain prompt rather than through a script argument, shell pipeline, repository file, or echoed input. Existing credentials are preserved unless replacement is explicitly requested.",
          "At launch time, an already supplied non-empty environment key takes priority. Otherwise, the launcher can read the named Keychain item and export it only to the child process. On Linux or in CI, the same launcher can rely on a process-level secret injector instead.",
          "The installer uses a restrictive umask, writes profiles with private modes, refuses symbolic-link runtime homes, and declines to install into the legacy ~/.grok tree. It also does not edit shell startup files or add its binary directory to PATH."
        ]
      },
      {
        "heading": "The proxy token is not the OAuth credential",
        "paragraphs": [
          "Codex-plan mode deliberately reads only CLIProxyAPI’s client token. The proxy remains responsible for acquiring and refreshing OAuth credentials. The launcher requires the token path to be absolute, the file to be regular rather than a symbolic link, and its mode to be 0400 or 0600.",
          "The token is exported to the child as GROK_CODEX_PROXY_TOKEN, while the profile points requests to the local loopback address. Before launching either mode, the wrapper unsets xAI API keys, session paths, and external auth-provider variables. If neither a Platform key nor an acceptable proxy token exists, it stops with an actionable error instead of borrowing another provider’s session.",
          "The Rust credential resolver reinforces that rule. Declaring an api_key or env_key source opts a model into provider isolation even when the value is missing or blank. A missing OpenAI credential therefore resolves to no key; it cannot fall through to a cached xAI session or XAI_API_KEY."
        ]
      },
      {
        "heading": "Tradeoffs and remaining trust",
        "paragraphs": [
          "The two-lane design keeps product entitlements honest and reduces secret copying. It also makes uninstallation and troubleshooting easier because each runtime has a distinct profile and home.",
          "There are operational costs. Codex-plan mode depends on a separately installed and running compatibility proxy. The client token protects local proxy access, so filesystem permissions and local process trust still matter. Platform mode depends on Keychain availability on macOS or disciplined secret injection elsewhere.",
          "Most importantly, loopback is a boundary, not a sandbox. A compromised local proxy could still observe prompts and responses. The design limits which credential the launcher handles and where it sends requests; it does not make an untrusted local service safe. That explicit limit is preferable to describing OAuth compatibility as automatic or credential-free."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public grok-build source 1",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/scripts/install-openai.sh"
      },
      {
        "label": "Public grok-build source 2",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/scripts/setup-openai-key.sh"
      },
      {
        "label": "Public grok-build source 3",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/config/codex-plan.toml"
      }
    ],
    "relatedSlugs": [
      "transactional-upstream-sync",
      "release-proof-without-paid-api-calls",
      "provider-boundaries-across-llm-apis"
    ],
    "category": "grok-build",
    "project": "grok-build",
    "date": "2026-07-11",
    "excerpt": "The OpenAI distribution supports two ways to reach a Responses endpoint. Direct Platform mode uses OPENAI_API_KEY. Codex-plan mode uses a loopback CLIProxyAPI service that owns the interactive OAuth lifecycle and exposes an OpenAI-compatible endpoint on.",
    "status": "published",
    "tags": [
      "grok-build",
      "Public source review",
      "One launcher, two deliberately separate modes"
    ],
    "readingTime": 0,
    "placement": "recent",
    "visual": {
      "variant": "key-vault",
      "alt": "Dither study for Two Authentication Lanes Without Secret Sprawl"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "A Transactional Updater for an Upstream That Rewrites History",
    "slug": "transactional-upstream-sync",
    "body": [
      {
        "heading": "“Fetch, merge, push” is not a release process",
        "paragraphs": [
          "A maintained fork needs upstream changes, but a convenience script can easily combine too many irreversible actions. A successful fetch says nothing about merge correctness. A successful merge says nothing about provider isolation. A green build says nothing if the remote branch moved while tests ran.",
          "The fork’s updater models synchronization as a transaction. It begins only from a clean local main that exactly matches origin/main. It validates the identities of the writable fork and read-only upstream, disables pushes to upstream, fetches both, and creates a temporary candidate branch and worktree.",
          "The real branch, installed binary, and published fork remain unchanged while integration and validation happen inside that candidate."
        ]
      },
      {
        "heading": "The upstream marker is a trust anchor",
        "paragraphs": [
          "Normal Git ancestry is enough while upstream history advances conventionally. It is not enough after a force rewrite, rebase, rewind, or rollback. Two histories may share an old ancestor while the new upstream omits the exact source snapshot previously incorporated.",
          "A tracked .grok-openai-upstream file records that last integrated snapshot. The updater requires it to be a non-executable regular tracked file containing exactly one full lowercase commit SHA. The commit must exist and be an ancestor of the fork’s current head.",
          "If the fetched upstream no longer descends from that marker, the updater refuses to infer intent. It prints an exact acceptance pair in the form previous-sha..fetched-sha. A rerun must provide precisely that pair after review. A stale pair is rejected, and the option is also rejected when history is normal.",
          "This turns a vague “allow unrelated histories” override into approval for one observed transition."
        ]
      },
      {
        "heading": "Bridging rewritten history without rewriting the fork",
        "paragraphs": [
          "After explicit acceptance, the candidate creates a synthetic bridge commit. Its tree is exactly the fetched upstream tree. Its first parent is the previously integrated upstream snapshot; its second parent is the fetched rewritten commit.",
          "Merging that bridge applies the tree delta from the last trusted snapshot to the newly reviewed snapshot while making the rewritten upstream commit an ancestor of the result. The fork’s history stays append-only. No force push, reset, rebase, stash, replacement ref, or graft is used.",
          "The script immediately verifies the bridge tree and both parent IDs. It then makes a candidate merge commit, updates the marker, and verifies that commit’s parent structure, marker mode, marker value, and ancestry.",
          "Conflicts remain isolated in the candidate worktree for inspection. The main checkout and remote branch stay on the last known-good commit."
        ]
      },
      {
        "heading": "Validation happens before publication—and races are closed",
        "paragraphs": [
          "Candidate validation runs with a disposable HOME and a mostly empty environment. Cargo and rustup locations are passed explicitly, but ambient API keys, bearer tokens, cloud variables, and implicit Git authentication are withheld from candidate-derived scripts.",
          "The gate checks shell workflows, Rust formatting, the relevant crate graph, provider and stream tests, the release build, vendor-updater refusal, and a built-binary prompt against a local authenticated mock. It then stages the exact release artifact through the installer in a disposable home.",
          "Before publishing, the updater fetches both remotes again. It refuses if local main, origin/main, upstream/main, candidate HEAD, the candidate branch ref, or the candidate tree changed during validation. Only the exact tested commit is pushed to origin/main. Local main is then fast-forwarded to it, followed by installation of that validated artifact.",
          "If installation fails after publication, the script reports that narrower state honestly and retains the candidate rather than pretending the entire transaction rolled back."
        ]
      },
      {
        "heading": "Safety is explicit, not absolute",
        "paragraphs": [
          "This design protects Git state and release identity unusually well. It also makes rewrite acceptance reviewable and repeatable without normalizing force pushes.",
          "Its limits are equally important. Environment scrubbing is not an operating-system sandbox. Candidate source, build scripts, procedural macros, and tests still execute with the local user’s filesystem permissions. An unexpected upstream rewrite should therefore be inspected before acceptance, and stronger external isolation may be warranted.",
          "The workflow is also intentionally strict: dirty worktrees, malformed markers, missing toolchains, merge conflicts, moving remotes, or mutated candidate commits stop publication. That can feel slower than an automatic merge bot. The tradeoff is that failure leaves a debuggable candidate and a stable published branch rather than a partially validated release."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public grok-build source 1",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/scripts/update-from-upstream.sh"
      },
      {
        "label": "Public grok-build source 2",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/docs/UPDATING.md"
      },
      {
        "label": "Public grok-build source 3",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/scripts/tests/run.sh"
      }
    ],
    "relatedSlugs": [
      "release-proof-without-paid-api-calls",
      "provider-boundaries-across-llm-apis",
      "two-lane-auth-without-secret-sprawl"
    ],
    "category": "grok-build",
    "project": "grok-build",
    "date": "2026-07-10",
    "excerpt": "A maintained fork needs upstream changes, but a convenience script can easily combine too many irreversible actions. A successful fetch says nothing about merge correctness. A successful merge says nothing about provider isolation. A green build says nothing.",
    "status": "published",
    "tags": [
      "grok-build",
      "Public source review",
      "“Fetch, merge, push” is not a release process"
    ],
    "readingTime": 0,
    "placement": "recent",
    "visual": {
      "variant": "paper-field",
      "alt": "Dither study for A Transactional Updater for an Upstream That Rewrites History"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Proving an AI Distribution Without Spending API Quota",
    "slug": "release-proof-without-paid-api-calls",
    "body": [
      {
        "heading": "A live prompt is a weak release gate",
        "paragraphs": [
          "A successful paid API request proves that one key, account, model, network path, and moment happened to work. It does not prove that the checked-in profile is secret-free, that xAI headers are absent, that tool calls survive streaming, that missing credentials fail closed, or that the built binary matches the code under review.",
          "The OpenAI distribution separates product verification from account acceptance. Its release gate is keyless and deterministic. A real API call remains an optional check for billing, entitlement, and network access after the software itself has passed.",
          "This distinction matters for open-source CI: contributors can prove behavior without receiving a production secret or incurring usage."
        ]
      },
      {
        "heading": "The profile is an executable contract",
        "paragraphs": [
          "The acceptance test parses the checked-in OpenAI TOML through the application’s real configuration path. It recursively rejects secret-like values, verifies that no credential headers are embedded, and confirms every curated model routes to the OpenAI base URL with the Responses backend and Codex agent type.",
          "It also checks the negative space: telemetry, feedback, managed configuration, remote fetch, voice, video, error reporting, and hosted backend tools remain disabled. The model picker is constrained so compiled xAI defaults do not appear. Auxiliary model slots are asserted rather than assumed.",
          "For each model, the test resolves credentials with the provider variable absent and confirms that no xAI session is borrowed. With a temporary provider key present, it confirms the route becomes ordinary API-key authentication without changing provider.",
          "That makes configuration drift a test failure rather than a documentation discrepancy."
        ]
      },
      {
        "heading": "The mock exercises the real binary path",
        "paragraphs": [
          "The end-to-end acceptance test starts a local authenticated Responses server, rewrites only the profile’s base URL to that mock, and launches the compiled binary in headless mode. The prompt triggers a streamed tool call and a second model turn before returning the expected final text.",
          "The mock records requests. Assertions verify Bearer authentication, the /responses path, tool-call round trips, and the absence of x-grok-*, x-xai-*, xAI hosted search, and provider-private body extensions. Standard output must contain the exact completion, while standard error must not contain crashes, xAI login prompts, remote xAI model fetches, or credential material.",
          "This is stronger than mocking the Rust client directly because it covers profile loading, model selection, shell composition, agent-loop behavior, streaming conversion, tool execution, and final rendering through the shipped binary."
        ]
      },
      {
        "heading": "The release gate binds source, tests, and artifact",
        "paragraphs": [
          "The validation script first checks shell syntax and runs workflow tests. It verifies Rust formatting, builds the production dependency surface with the lockfile, and runs focused tests for model parsing, sampling types, provider wire behavior, Responses streaming, credential boundaries, tool-call cycles, and voice authentication isolation.",
          "It then creates the hardened release-dist binary at an explicitly pinned Cargo target path. The artifact must pass a version smoke test and reject the vendor updater even when a global option appears before the update subcommand. Finally, that exact binary runs the ignored built-binary acceptance case against the local mock.",
          "The companion shell suite tests installer isolation, symbolic-link refusals, protected proxy tokens, preservation of customized profiles, normal upstream merges, unrelated rewrites, rebases, rollbacks, malformed markers, dirty trees, merge conflicts, remote races, ambient-secret removal, candidate mutation, and gate failure."
        ]
      },
      {
        "heading": "What remains unproven",
        "paragraphs": [
          "The gate proves the distribution’s contracts without a live provider, but it cannot prove an account has credits, a model is enabled in a region, current rate limits are sufficient, or the external API is available. Those belong to the optional live command and should be reported as “not run” unless actually executed.",
          "A mock can also drift from a provider’s evolving event schema. The defense is to keep parsing strict for malformed known events, tolerate unknown event types narrowly, review official API changes, and add fixtures when new capabilities are enabled.",
          "The suite is substantial and release builds are expensive. Focused crate targets keep it bounded, but the project consciously spends build time to avoid publishing an artifact validated only through unit-level substitutions."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Public grok-build source 1",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/scripts/validate-openai.sh"
      },
      {
        "label": "Public grok-build source 2",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/crates/codegen/xai-grok-shell/tests/openai_distribution_acceptance.rs"
      },
      {
        "label": "Public grok-build source 3",
        "href": "https://github.com/ocque41/grok-build/blob/4508303932620fac40a63541d18be83609609240/scripts/tests/run.sh"
      }
    ],
    "relatedSlugs": [
      "provider-boundaries-across-llm-apis",
      "two-lane-auth-without-secret-sprawl",
      "transactional-upstream-sync"
    ],
    "category": "grok-build",
    "project": "grok-build",
    "date": "2026-07-09",
    "excerpt": "A successful paid API request proves that one key, account, model, network path, and moment happened to work. It does not prove that the checked-in profile is secret-free, that xAI headers are absent, that tool calls survive streaming, that missing.",
    "status": "published",
    "tags": [
      "grok-build",
      "Public source review",
      "A live prompt is a weak release gate"
    ],
    "readingTime": 0,
    "placement": "recent",
    "visual": {
      "variant": "local-orbit",
      "alt": "Dither study for Proving an AI Distribution Without Spending API Quota"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Explainable Matching Under Real Capacity Constraints",
    "slug": "explainable-matching-under-capacity",
    "body": [
      {
        "heading": "Matching is a suggestion, not a verdict",
        "paragraphs": [
          "A mental-health referral system should resist the temptation to behave like a recommendation feed. The public matching module takes a narrower position: it ranks eligible volunteers for a coordinator, but it does not turn the score into an automatic clinical decision. Language alignment contributes thirty points, support-area alignment twenty, crisis experience ten when urgency is high, and remaining capacity adds a small load-balancing signal. The result is deliberately legible. A coordinator can see why one candidate appeared before another instead of being asked to trust an opaque model.",
          "That separation matters. Code is well suited to filtering obviously ineligible candidates and making a stable first pass through a queue. It is not a substitute for professional judgment, informed consent, or emergency triage. The design therefore uses a simple score to organize work while keeping assignment authority outside the scoring function."
        ]
      },
      {
        "heading": "Eligibility comes before ranking",
        "paragraphs": [
          "The most important matching rule is not a weight. It is the database query that defines who can enter the candidate pool. The query requires an approved status, current acceptance of requests, remote availability, and active load below the configured maximum. It also projects an explicit set of public-safe fields rather than loading contact details, account identifiers, license data, or internal notes into the path used by the public confirmation page.",
          "This is a strong boundary because ranking cannot accidentally rehabilitate an ineligible record. A suspended volunteer with an ideal language match is absent from the pool; a full volunteer cannot win by accumulating other points. Explicit projection also limits the damage of a later rendering mistake. Data that was never fetched cannot leak through a component refactor."
        ]
      },
      {
        "heading": "A pure function makes policy reviewable",
        "paragraphs": [
          "The scoring, explanation, and ordering functions operate on already-fetched records. That makes them easy to test without a database and easy to inspect as policy. Ties fall back to lower current load, and the result is capped at three suggestions. The paired explanation function emits human-readable reasons—language, area, crisis experience, and free capacity—derived from the same inputs used for scoring.",
          "This pairing prevents a common failure mode: an interface that invents plausible explanations after the ranking has already happened. Here, the score and its reasons share one small vocabulary. A policy change, such as removing urgency from the score, can be expressed in code and protected with a focused test rather than hidden in prompt text or administrator folklore."
        ]
      },
      {
        "heading": "Assignment needs stronger concurrency controls",
        "paragraphs": [
          "Ranking can be pure; claiming scarce capacity cannot. The assignment module uses guarded writes because Cloudflare D1 does not support the transaction pattern the original SQLite-oriented ORM path would suggest. Capacity is reserved with an atomic update whose WHERE clause rechecks approval, availability, and the maximum. A unique assignment index catches duplicate request-professional pairs. If insertion loses a race, the reserved capacity is compensated.",
          "The code then atomically claims a request only while it remains new or offered. Losing that race closes the provisional assignment and returns the capacity. Pending sibling offers are marked missed after a successful claim. These compensating actions are more verbose than a single transaction, but they encode the actual datastore constraint instead of pretending local transaction semantics exist in production."
        ]
      },
      {
        "heading": "Limits and the next review questions",
        "paragraphs": [
          "An explainable score is still a policy choice. Fixed weights may overvalue a categorical match, underrepresent schedule compatibility, or preserve historical assumptions. JSON-encoded lists can also hide taxonomy drift. Capacity is only as accurate as every close, suspension, and reassignment path that increments or decrements it. Sequential compensation reduces race damage but cannot make a multi-statement workflow perfectly atomic if the process fails between steps.",
          "The right review therefore asks more than whether the top three look sensible. Tests should cover ties, malformed list data, high urgency, full capacity, simultaneous offers, duplicate claims, and failures after each successful write. Operational review should sample explanations for unfair patterns without exposing requester details. The goal is not a smarter black box. It is a bounded, inspectable queue aid whose eligibility rules, race handling, and human authority remain visible."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Matching and explanation functions",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/lib/matching.ts"
      },
      {
        "label": "Capacity reservation and assignment compensation",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/lib/assignment.ts"
      },
      {
        "label": "Focused matching tests",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/tests/matching.test.ts"
      }
    ],
    "relatedSlugs": [
      "anonymous-access-with-real-revocation",
      "verification-as-a-state-machine",
      "privacy-aware-observability-for-care-platforms"
    ],
    "category": "Nido",
    "project": "psicoayuda",
    "date": "2026-07-08",
    "excerpt": "A mental-health referral system should resist the temptation to behave like a recommendation feed. The public matching module takes a narrower position: it ranks eligible volunteers for a coordinator, but it does not turn the score into an automatic clinical.",
    "status": "published",
    "tags": [
      "Nido",
      "Public source review",
      "Matching is a suggestion, not a verdict"
    ],
    "readingTime": 0,
    "placement": "stories",
    "visual": {
      "variant": "record-lattice",
      "alt": "Dither study for Explainable Matching Under Real Capacity Constraints"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Anonymous Access Still Needs Real Revocation",
    "slug": "anonymous-access-with-real-revocation",
    "body": [
      {
        "heading": "No account does not mean no security model",
        "paragraphs": [
          "Requiring an account from a person asking for help creates friction at exactly the wrong moment. The public source takes a different approach: a requester can enter the support flow without creating a profile, while professionals authenticate separately. When a conversation is created, the requester receives an opaque, signed token tied to one random session identifier and one conversation. The payload does not need an email address, full name, or IP address to authorize the browser.",
          "This is useful data minimization, but anonymity alone does not solve authorization. A bearer token copied into another context is still a credential. The implementation therefore binds the token to a role, conversation, issue time, and expiry, signs it with HMAC-SHA256, and compares signatures in constant time. The server can answer a narrow question: may this browser join this specific room as the requester?"
        ]
      },
      {
        "heading": "Two identities, one room, no client-selected role",
        "paragraphs": [
          "The WebSocket gate recognizes exactly two roles: requester or assigned professional. It parses HTTP-only cookies, verifies the matching token type, and checks that the token’s conversation identifier equals the requested room. Only after that decision does the server add trusted role headers for the Durable Object. The browser cannot declare itself a professional in a message frame.",
          "Origin checks reduce cross-site WebSocket hijacking, but the token remains the primary authorization control. The allowed host can come from the configured canonical URL or the actual request host, which accommodates custom domains and previews without accepting arbitrary origins. A malformed explicit origin is rejected. This is a pragmatic balance between deployment flexibility and same-site expectations."
        ]
      },
      {
        "heading": "Expiration is not revocation",
        "paragraphs": [
          "A signed token can be cryptographically valid after the underlying relationship should end. Closing a conversation, anonymizing a request, or suspending a professional must take effect before a seventy-two-hour cookie naturally expires. The gate therefore consults global state when available. Requester sessions can be revoked or expired, and conversation state can be closed or anonymized. Professional access is denied when the conversation is closed or the professional is suspended.",
          "There is also a live-socket problem. A database check occurs during connection, not continuously while an already-open socket hibernates. Closing or suspending therefore triggers a best-effort disconnect against the conversation object. Reconnection re-enters the gate and sees the revoked state. This combination—durable status plus active disconnection—is what makes the kill switch real rather than merely eventual."
        ]
      },
      {
        "heading": "Sensitive content has a separate deletion path",
        "paragraphs": [
          "Conversation metadata lives in the global database, while message content lives in per-conversation Durable Object SQLite. That split limits broad queries over transcripts, but it also means anonymizing one row is insufficient. The retention module closes assignments, revokes requester sessions, calls a protected purge endpoint for each conversation, clears the remaining requester hash, and only then removes identifying fields from the help request.",
          "The failure behavior is especially important. If transcript deletion fails, the code records an anonymization failure and does not mark the request successfully anonymized. It leaves the record eligible for a later retry. A green database flag must not conceal a surviving transcript. The scheduled policy closes inactive requests after thirty days and attempts anonymization after ninety, but deletion truth depends on every storage boundary succeeding."
        ]
      },
      {
        "heading": "Limits and evidence worth demanding",
        "paragraphs": [
          "Some database checks fail open after a valid HMAC token when D1 is unavailable. That choice favors continuity during transient infrastructure failure, but it weakens immediate revocation precisely when global state cannot be consulted. The disconnect call is best effort, so a network or binding failure may leave an existing socket alive until another control intervenes. HMAC security also depends on secret rotation, cookie attributes, delivery-channel safety, and protection of links sent by email.",
          "Verification should cover token tampering, role substitution, room mismatch, expiry boundaries, revoked sessions, suspended professionals, closed conversations, hostile origins, live disconnects, and purge failures. Retention tests should prove that a failed transcript purge never produces a successful anonymization claim. Anonymous access is not the absence of identity. It is a deliberately small, revocable identity with a deletion story that includes every place sensitive content can live."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Conversation authorization gate",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/server/auth-gate.ts"
      },
      {
        "label": "Signed requester and professional tokens",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/lib/seeker-token.ts"
      },
      {
        "label": "End-to-end retention and anonymization",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/lib/retention.ts"
      }
    ],
    "relatedSlugs": [
      "verification-as-a-state-machine",
      "privacy-aware-observability-for-care-platforms",
      "explainable-matching-under-capacity"
    ],
    "category": "Nido",
    "project": "psicoayuda",
    "date": "2026-07-07",
    "excerpt": "Requiring an account from a person asking for help creates friction at exactly the wrong moment. The public source takes a different approach: a requester can enter the support flow without creating a profile, while professionals authenticate separately. When.",
    "status": "published",
    "tags": [
      "Nido",
      "Public source review",
      "No account does not mean no security model"
    ],
    "readingTime": 0,
    "placement": "stories",
    "visual": {
      "variant": "release-bars",
      "alt": "Dither study for Anonymous Access Still Needs Real Revocation"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Professional Verification Is a State Machine, Not a Badge",
    "slug": "verification-as-a-state-machine",
    "body": [
      {
        "heading": "Verification begins with restricted defaults",
        "paragraphs": [
          "A volunteer directory can make “verified” look like a decorative badge. The public implementation treats it as an authorization state. A newly onboarded professional starts pending review. Only approved professionals who are accepting requests, available remotely, and below capacity enter matching. Suspended or rejected records are excluded from new work, and release routines return their active requests to the queue rather than leaving requesters attached to an unavailable account.",
          "This default matters more than the visual badge. The safe state is no assignment authority until the evidence has been reviewed. Interface copy can explain the process, but the server-side eligibility query and status transitions enforce it. A stale browser or cached page cannot transform pending into approved."
        ]
      },
      {
        "heading": "External registry checks are evidence, not authority",
        "paragraphs": [
          "The verification helper queries the public API of the national professional federation from the server. It supports exact searches by national identification number and registration number, normalizes returned values, applies a timeout, bounds the response size, and rejects unexpected shapes. Those are useful defensive controls around an external dependency.",
          "The result should still be understood as one piece of evidence. Registry uptime, schema stability, spelling variation, reused numbers, delayed updates, and upstream compromise remain possible. A successful match can support a coordinator’s review; it should not silently perform the final approval. Conversely, a timeout should not be translated into an accusation that a professional is invalid. The product needs distinct states for “not found,” “provider unavailable,” “mismatch,” and “review complete.”"
        ]
      },
      {
        "heading": "State transitions carry operational consequences",
        "paragraphs": [
          "Approval enables eligibility. Suspension and rejection must do more than change a label. The assignment module closes active assignments in both assigned and accepted states, returns claimable requests to new, closes related conversations, revokes requester access, disconnects live sockets, and resets active capacity. That is a cascade across coordination, chat, and accounting boundaries.",
          "The implementation also writes audit events for consequential actions. This creates a reviewable record without turning the audit log into another source of sensitive narrative. The important lesson is structural: status transitions should be commands with explicit side effects, not arbitrary column edits from an admin form. Otherwise a suspended professional can remain connected, capacity can stay consumed, or a requester can become silently orphaned.",
          "Reinstatement deserves equal care. Resetting a status should not restore old assignments or silently reuse evidence that has expired. A clean transition can make the professional eligible for future matching while leaving prior closures and audit history intact. That asymmetry—suspension tears down live authority, reinstatement grants only prospective eligibility—reduces surprising recovery behavior."
        ]
      },
      {
        "heading": "The onboarding form is part of the control surface",
        "paragraphs": [
          "The public onboarding component is large because the data model is not a single credential field. It gathers professional profile information, languages, support areas, availability, capacity, and verification inputs. Client-side usability helps people complete the form, but server validation remains the trust boundary. Files, phone numbers, identifiers, and booleans require normalization and size limits before persistence.",
          "Good onboarding also distinguishes public presentation data from private verification data. A display name or short biography may appear in a directory; a national identifier, landline, internal note, or account mapping should not. The matching path reinforces this split with an explicit safe projection. That separation reduces the chance that future UI reuse publishes evidence collected solely for review."
        ]
      },
      {
        "heading": "Limits and a stronger verification program",
        "paragraphs": [
          "No software workflow can prove professional fitness from a registry lookup alone. Licensing status may not capture current scope, supervision, local practice rules, identity theft, or conduct concerns. Manual review introduces its own inconsistency and bias. Audit logs help reconstruct decisions, but they do not make a weak decision correct. Reverification cadence, appeal handling, and incident response need policy beyond the code shown here.",
          "A robust test plan should exercise every transition: pending to approved, rejected to resubmitted if allowed, approved to suspended, and reinstatement. It should inject registry timeouts, oversized responses, malformed JSON, ambiguous matches, and upstream changes. Integration tests should prove that non-approved records never enter suggestions and that suspension releases assignments and blocks reconnection. Finally, an operator checklist should define which evidence is required, which fields are private, who may approve, and how often a prior approval must be revisited. Verification is trustworthy only when its state, evidence, authority, and downstream effects agree."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Server-side federation verification helper",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/lib/fpv.ts"
      },
      {
        "label": "Professional onboarding form",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/components/professional-onboarding-form.tsx"
      },
      {
        "label": "Assignment release on professional status change",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/lib/assignment.ts"
      }
    ],
    "relatedSlugs": [
      "privacy-aware-observability-for-care-platforms",
      "explainable-matching-under-capacity",
      "anonymous-access-with-real-revocation"
    ],
    "category": "Nido",
    "project": "psicoayuda",
    "date": "2026-07-06",
    "excerpt": "A volunteer directory can make “verified” look like a decorative badge. The public implementation treats it as an authorization state. A newly onboarded professional starts pending review. Only approved professionals who are accepting requests, available.",
    "status": "published",
    "tags": [
      "Nido",
      "Public source review",
      "Verification begins with restricted defaults"
    ],
    "readingTime": 0,
    "placement": "stories",
    "visual": {
      "variant": "shared-notebook",
      "alt": "Dither study for Professional Verification Is a State Machine, Not a Badge"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Privacy-Aware Observability for a Care Platform",
    "slug": "privacy-aware-observability-for-care-platforms",
    "body": [
      {
        "heading": "Measure the journey without recording the story",
        "paragraphs": [
          "A support platform needs to know whether people can find help, whether referrals are used, and whether volunteers respond. It does not need to turn distress into an analytics payload. The public tracking endpoint takes a deliberately small event: a bounded type, label, destination, page, selected UTM fields, country code from infrastructure headers, and timestamp. It does not accept a free-form account profile or the contents of a help request.",
          "Every string is trimmed and truncated. Cross-site requests are discarded using an origin check, malformed bodies return an empty success response, and database errors never interrupt navigation. This is a fire-and-forget channel rather than a critical dependency. The endpoint illustrates a useful rule: analytics failure should reduce visibility, not block access to support.",
          "The same rule shapes prioritization during incidents. If the analytics store is unavailable, support requests and professional access should continue. If the support datastore is unavailable, a green analytics endpoint is irrelevant. Keeping the beacon on a separate failure path makes that hierarchy concrete in code."
        ]
      },
      {
        "heading": "Collection boundaries need server enforcement",
        "paragraphs": [
          "Saying “no personally identifiable information” in documentation is insufficient if the endpoint accepts arbitrary objects. The source defines maximum lengths by field, names the accepted shape, and writes only those columns. A client can still place sensitive text in a label or URL, so call sites and review conventions remain important, but the bounded schema narrows the channel and prevents unbounded rows.",
          "Same-site origin checking cuts trivial third-party pollution, yet it is not strong authentication. Requests without an Origin are accepted to preserve legitimate beacon behavior. Automated traffic from the same site can still inflate counts. The design appropriately treats the resulting numbers as product signals rather than financial records or clinical evidence."
        ]
      },
      {
        "heading": "Aggregation should match the operational question",
        "paragraphs": [
          "The administrative metrics route groups events into rolling twenty-four-hour, seven-day, and thirty-day windows. It counts calls to action, leads, signups, contact forms, referral shares, and selected outbound contacts. A single grouped query calculates several windows to stay within D1 connection and invocation limits, while additional queries summarize source, campaign, event type, and recent activity. The response disables caching because the page is an operational view.",
          "These metrics answer concrete questions: Are people reaching a professional contact? Which outreach campaign leads to a completed form? Is a referral program producing signups? The route excludes known verification events and applies carefully scoped filters to avoid classifying every outbound click as the same kind of conversion. The implementation shows that useful observability depends as much on definitions as on instrumentation."
        ]
      },
      {
        "heading": "Response time can be honest without being exposing",
        "paragraphs": [
          "The response-bucket module avoids exact public wait times. Once at least three real samples exist, a median first-response time and answered ratio map to warm labels such as “usually responds in minutes” or “may take more than a day.” Low response ratios degrade the label. During cold start, the card reports only current availability and capacity rather than inventing a speed estimate.",
          "This design reduces false precision and protects both sides from a public performance leaderboard. Median values resist extreme outliers, and minimum sample size prevents one unusually fast conversation from defining the label. The bucket remains an aggregate product hint, not a service-level guarantee."
        ]
      },
      {
        "heading": "Limits, governance, and verification",
        "paragraphs": [
          "Event labels and destinations can still contain sensitive data if a call site is careless. Country headers introduce location data, even at coarse granularity. UTM parameters sent to third parties create their own disclosure surface. Small samples can make response buckets unstable, while medians hide long-tail delays. Counts also say nothing about whether the contact led to appropriate care.",
          "A stronger program starts with a data dictionary: every event, field, retention period, access role, and decision it supports. Automated tests should reject oversized inputs, hostile origins, malformed JSON, and unexpected fields; query tests should protect classification rules and rolling windows. Privacy review should inspect call sites, not only the endpoint. Operational dashboards should label approximate or incomplete data and avoid exposing recent event detail beyond authorized staff. Observability is successful when it helps improve the path to support while preserving the crucial distinction between measuring a workflow and collecting a person’s story."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Bounded, same-site click-event endpoint",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/app/api/track/route.ts"
      },
      {
        "label": "Administrative aggregation route",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/app/api/admin/metrics/route.ts"
      },
      {
        "label": "Honest response-time buckets",
        "href": "https://github.com/ocque41/psicoayuda/blob/13bd5fe471e8be651a6782560a88349741274caa/src/lib/response-bucket.ts"
      }
    ],
    "relatedSlugs": [
      "explainable-matching-under-capacity",
      "anonymous-access-with-real-revocation",
      "verification-as-a-state-machine"
    ],
    "category": "Nido",
    "project": "psicoayuda",
    "date": "2026-07-05",
    "excerpt": "A support platform needs to know whether people can find help, whether referrals are used, and whether volunteers respond. It does not need to turn distress into an analytics payload. The public tracking endpoint takes a deliberately small event: a bounded.",
    "status": "published",
    "tags": [
      "Nido",
      "Public source review",
      "Measure the journey without recording the story"
    ],
    "readingTime": 0,
    "placement": "stories",
    "visual": {
      "variant": "event-river",
      "alt": "Dither study for Privacy-Aware Observability for a Care Platform"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Wireframes as Executable Handoffs",
    "slug": "wireframes-as-executable-handoffs",
    "body": [
      {
        "heading": "A screen list is not a product plan",
        "paragraphs": [
          "Long implementation tasks often begin with a polished screenshot and a vague instruction to “build this.” The public Diffs workflow inserts a structural stage before code. It requires rough wireframes, a state map, a visual-pass checklist, an implementation plan, a machine-readable stage manifest, and a continuation prompt. Together, these artifacts answer different questions: what views exist, how states change, where feedback appears, what remains unknown, and whether implementation may start.",
          "The choice of low-fidelity, black-and-white wireframes is intentional. Rough boxes keep attention on hierarchy and behavior. A polished mockup can make an unhandled permission state feel finished; a labeled rectangle makes the missing behavior harder to ignore."
        ]
      },
      {
        "heading": "States turn drawings into contracts",
        "paragraphs": [
          "The workflow asks for primary, empty, loading, error, permission, and confirmation states. It also names affordances and signifiers: what can be clicked, what looks interactive, which status is visible, and what feedback follows an action. A Mermaid map connects those states so reviewers can see transitions rather than isolated screens.",
          "This does not make a Markdown file executable in the compiler sense. It makes the handoff falsifiable. If the plan says an action has confirmation and error states, a reviewer can inspect the implementation for both. If an unknown data source remains marked missing, nobody can quietly substitute invented data and still claim fidelity to the wireframe."
        ]
      },
      {
        "heading": "The generator creates a scaffold, not an answer",
        "paragraphs": [
          "The Python generator accepts a repository, task text or task file, optional image reference, and output directory. It writes seven starter artifacts under .diffs/pipeline/. The state map includes a happy path and blocked branches; the manifest records outputs, validation flags, blockers, and next stage. Every project-specific section begins as a TODO.",
          "That last detail prevents automation theater. The script can guarantee consistent file names and a complete skeleton, but it cannot discover the actual views or decide whether a destructive action needs confirmation. The skill explicitly requires an agent to read the source and fill the scaffold. Generated structure reduces omission; it does not replace design judgment.",
          "The generated handoff prompt also carries absolute artifact locations and repeats the task. That helps a fresh session resume without relying on the original chat. However, absolute paths can make artifacts machine-specific or unsafe to publish, so repositories that commit these files should normalize paths or treat the generated version as local scaffolding. The script’s timestamp is useful for sequencing, but it should not be mistaken for review approval. Review status belongs in the manifest’s validation and blocker fields, where another tool can inspect it directly."
        ]
      },
      {
        "heading": "A stage manifest makes “ready” inspectable",
        "paragraphs": [
          "The manifest starts with validation fields set to false and a blocker instructing the operator to replace TODOs after source review. Hard gates forbid implementation when primary views are missing, the state map does not exist, actions lack feedback, missing data is unmarked, the first implementation step is unclear, or blockers remain.",
          "This creates a clean transition between design exploration and construction. A continuation session can inspect one JSON file instead of inferring readiness from a pile of prose. After implementation, a second skill generates .diffs change documentation, preserving the link between intended structure and delivered files."
        ]
      },
      {
        "heading": "Limits and disciplined use",
        "paragraphs": [
          "Wireframes can become stale, overly literal, or expensive for small changes. A complete state inventory does not prove accessibility, performance, security, or domain correctness. Mermaid diagrams can suggest determinism where asynchronous systems remain messy. The workflow also assumes someone will challenge the artifacts; checking every box without substantive review creates bureaucracy, not clarity.",
          "Use the pipeline for long-horizon, multi-view work where omissions are costly. Keep a narrow bug fix narrow. Version the artifacts with the code, update them when scope changes, and make blocked states specific. Acceptance should connect each named state to a test, story, or manual verification step. The best handoff is not the largest document set. It is the smallest durable set that lets another session distinguish source truth, open questions, accepted behavior, and the exact gate between planning and implementation.",
          "When a supplied image exists, record what is reference, what is interpretation, and what the current code can actually support before visual work begins."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Diffs wireframe pipeline skill",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/diffs/skills/diffs-wireframe-pipeline/SKILL.md"
      },
      {
        "label": "Wireframe-first reference framework",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/diffs/skills/diffs-wireframe-pipeline/references/wireframe-first-framework.md"
      },
      {
        "label": "Pipeline artifact generator",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/diffs/skills/diffs-wireframe-pipeline/scripts/create_pipeline_docs.py"
      }
    ],
    "relatedSlugs": [
      "objective-locks-before-agent-work",
      "parallelism-begins-with-isolation",
      "durable-state-for-long-running-agents"
    ],
    "category": "Cumulus Skills",
    "project": "skills",
    "date": "2026-07-04",
    "excerpt": "Long implementation tasks often begin with a polished screenshot and a vague instruction to “build this.” The public Diffs workflow inserts a structural stage before code. It requires rough wireframes, a state map, a visual-pass checklist, an implementation.",
    "status": "published",
    "tags": [
      "Cumulus Skills",
      "Public source review",
      "A screen list is not a product plan"
    ],
    "readingTime": 0,
    "placement": "stories",
    "visual": {
      "variant": "handoff-map",
      "alt": "Dither study for Wireframes as Executable Handoffs"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Objective Locks Before Agent Work",
    "slug": "objective-locks-before-agent-work",
    "body": [
      {
        "heading": "Parallel work begins before the branch",
        "paragraphs": [
          "Creating more worktrees does not create safe parallelism. Two agents can independently choose different branch names while implementing the same result, or one can start a “cleanup” that overlaps an active feature. The public objective-lock workflow addresses duplication before execution. A proposed objective must name a stable identifier, a content fingerprint, one owner, one branch or worktree, acceptance criteria, validation commands, and explicit non-goals.",
          "The lock is not a motivational label. It is a claim over a bounded result. The fingerprint catches semantically repeated work even if a new objective identifier is invented, while branch and worktree fields locate the owner’s concrete state."
        ]
      },
      {
        "heading": "A deterministic evaluator narrows judgment",
        "paragraphs": [
          "The evaluator script reads a proposed plan, goal, ledger, repository, and base branch. It extracts objective identifiers, fingerprints, branches, worktrees, acceptance items, validation items, risks, and evidence terms. It checks the latest ledger state for matching active or completed identifiers and fingerprints, then inspects whether named branches are merged.",
          "Its score rewards goal alignment, durable output, isolation, non-duplication, identity, measurable acceptance, verification, safety, and progress depth. Duplicate evidence forces a DUPLICATE verdict; weak or non-durable plans are rejected; valuable but underspecified work is revised; sufficiently evidenced work is approved. This does not eliminate judgment, but it makes missing proof visible before a long run consumes time."
        ]
      },
      {
        "heading": "Claiming must be atomic",
        "paragraphs": [
          "Evaluation alone has a race: two workers can both read an empty ledger and both decide to proceed. The goal-package template includes a shell entrypoint that takes an exclusive file lock, reloads the JSONL ledger, rejects any matching active or completed identifier or fingerprint, and only then appends an objective.locked event. The event records the schema, owner, timestamp, current worktree, current branch, summary, and optional file ownership.",
          "This is a compact compare-and-append protocol. The ledger stays human-readable and append-only while the lock file serializes claims. A malformed ledger line fails visibly rather than being skipped, which is important because ignoring corrupt state could permit duplicate work.",
          "The record can also accept a file list, which gives later supervision a more concrete overlap signal than branch names alone. That list is advisory: two objectives may touch different files while changing the same public contract, and one generated file may be owned by several source modules. Still, explicit ownership creates a useful review surface. A parent agent can reject two proposed locks before either worker edits, or deliberately sequence them when a shared migration or interface makes true parallel execution unsafe."
        ]
      },
      {
        "heading": "Completion is a different question",
        "paragraphs": [
          "A successful lock proves only that work may begin. Later events distinguish progress, completion, release, failure, and blocking. The progress tracker treats declared goal checkboxes, objective status, and mainline merge evidence as different measures. A completed branch is not mainline proof until Git confirms it is an ancestor of the target base, and even that does not replace current tests.",
          "This separation prevents a common collapse of meanings: planned, active, coded, merged, deployed, and accepted are not synonyms. A ledger can coordinate ownership without becoming a source of product truth. Source files and validation commands remain authoritative for the result."
        ]
      },
      {
        "heading": "Limits and practical governance",
        "paragraphs": [
          "Fingerprints are only as good as their normalization. Two overlapping objectives can escape detection when described differently, while an overly broad fingerprint can block legitimate follow-up work. File locking assumes workers share a filesystem; distributed environments need a stronger coordination service. JSONL can grow noisy, and manual event edits can undermine append-only expectations. The scoring model also recognizes keywords, so a verbose weak plan may look stronger than it is.",
          "Human review should therefore inspect scope boundaries, dependencies, and acceptance—not only the numeric score. Locks should be closed explicitly, stale active owners investigated, and failed objectives left visible. Tests should simulate simultaneous claims, corrupt lines, reused fingerprints, completed branches, and abandoned worktrees. The objective lock is valuable because it makes ownership and duplication reviewable. It is not permission to stop reading the repository.",
          "Delivery-only locks also deserve scrutiny: publishing an already verified branch can be valid progress, but wrapping a push command in a long plan is not implementation."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Objective lock evaluator contract",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/skills/objective-lock-evaluator/SKILL.md"
      },
      {
        "label": "Deterministic evaluator implementation",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/skills/objective-lock-evaluator/scripts/evaluate_objective_lock.py"
      },
      {
        "label": "Atomic objective claim script",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/templates/goal-package/scripts/codex/claim-objective-lock.sh"
      }
    ],
    "relatedSlugs": [
      "parallelism-begins-with-isolation",
      "durable-state-for-long-running-agents",
      "wireframes-as-executable-handoffs"
    ],
    "category": "Cumulus Skills",
    "project": "skills",
    "date": "2026-07-03",
    "excerpt": "Creating more worktrees does not create safe parallelism. Two agents can independently choose different branch names while implementing the same result, or one can start a “cleanup” that overlaps an active feature. The public objective-lock workflow addresses.",
    "status": "published",
    "tags": [
      "Cumulus Skills",
      "Public source review",
      "Parallel work begins before the branch"
    ],
    "readingTime": 0,
    "placement": "stories",
    "visual": {
      "variant": "compact-grid",
      "alt": "Dither study for Objective Locks Before Agent Work"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Parallelism Begins With Isolation",
    "slug": "parallelism-begins-with-isolation",
    "body": [
      {
        "heading": "Agent count is not the unit of progress",
        "paragraphs": [
          "A large goal invites a simple response: split the checklist among several agents. That can increase throughput only when the slices do not compete for the same files, decisions, or outcome. The public parallel-goal orchestrator therefore requires every worker to receive one objective identifier, one fingerprint, one branch, one worktree, one isolated goal area, measurable acceptance, validation commands, a shared ledger, and a prohibition against duplicating active or completed work.",
          "The unit of progress is a verified objective, not an active agent. More workers can make a poorly partitioned roadmap slower by generating conflicts, duplicate investigations, and incompatible architecture."
        ]
      },
      {
        "heading": "Candidate generation is deliberately mechanical",
        "paragraphs": [
          "The planning script parses unchecked Markdown checklist items under their nearest headings. It groups items by section, derives a stable fingerprint from the goal title, section, and item text, and proposes a dated objective identifier, branch, worktree, acceptance list, validation commands, and non-goals. Existing identifiers and fingerprints in the ledger are skipped.",
          "This mechanical first pass is useful because it creates consistent dispatch records and exposes sections that are too broad or too small. It is not an automatic scheduler. Grouping by heading cannot detect shared modules, migration order, or architectural coupling. The skill requires every candidate to pass the objective-lock evaluator and to be revised until isolation and proof are credible."
        ]
      },
      {
        "heading": "Dispatch prompts carry the boundary",
        "paragraphs": [
          "The generated worker prompt repeats identity, fingerprint, branch, worktree, local environment setup, ledger location, acceptance criteria, commands, and out-of-scope rules. Before editing, the worker must confirm ownership and stop if another objective already owns the same result. During work, it records progress events; before closure, it evaluates the result and reports evidence.",
          "This repetition is a feature. Parallel workers do not share perfect conversational memory. The dispatch prompt must be self-contained enough to survive a new session, yet narrow enough that the worker cannot reinterpret the whole roadmap. Durable identifiers make later status messages attributable to the correct slice.",
          "Local environment setup is part of that contract. The prompt tells a worker to inspect the provided setup rather than overwrite an existing environment. This prevents every branch from inventing a different dependency or service baseline. It also exposes an important orchestration dependency: if two objectives require incompatible schema states or the same mutable sandbox, they are not operationally isolated even when their Git worktrees are separate. The dispatch plan should name that conflict and serialize the affected validation."
        ]
      },
      {
        "heading": "Supervision is evidence reconciliation",
        "paragraphs": [
          "The orchestrator’s job continues after launch. It polls worker state, inspects progress files and ledger events, stops overlap, routes failed validation back to the owning worker, and sends completed branches through result evaluation before integration. A worker’s completion message is a claim to verify, not a merge instruction.",
          "Branch ancestry provides one useful fact: whether completed work reached the target base. Tests, type checks, linters, migrations, browser checks, or release probes provide other facts according to the objective. Integration order may still matter even when file ownership was disjoint, especially when two features depend on a shared schema or public contract."
        ]
      },
      {
        "heading": "Limits and a safer operating model",
        "paragraphs": [
          "Checklist headings are not dependency graphs. Stable hashes do not understand semantics. Default validation commands in a generic script may be wrong for the target stack, so they must be replaced with repository-native gates. Worktree isolation prevents accidental file overlap on disk but does not isolate external services, deployment environments, or shared databases. Even disjoint branches can encode contradictory product decisions.",
          "A safer dispatch begins with a dependency map and explicit file or subsystem ownership. Start fewer workers than the theoretical maximum, reserve one integration lane, and define which changes require parent approval. Give each objective a stopping condition and a failure report shape. Reconcile the ledger against Git and current tests before declaring roadmap progress. Parallelism earns its complexity when independent evidence can be produced concurrently; it is harmful when coordination costs are merely hidden behind a row of green agent indicators.",
          "The orchestrator should also stop a worker promptly when new evidence shows overlap, then preserve its partial findings as a handoff rather than discard them."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Parallel goal orchestrator skill",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/skills/parallel-goal-orchestrator/SKILL.md"
      },
      {
        "label": "Objective candidate planner",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/skills/parallel-goal-orchestrator/scripts/plan_parallel_objectives.py"
      },
      {
        "label": "Goal progress and merge-evidence tracker",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/skills/goal-progress-tracker/scripts/goal_progress.py"
      }
    ],
    "relatedSlugs": [
      "durable-state-for-long-running-agents",
      "wireframes-as-executable-handoffs",
      "objective-locks-before-agent-work"
    ],
    "category": "Cumulus Skills",
    "project": "skills",
    "date": "2026-07-02",
    "excerpt": "A large goal invites a simple response: split the checklist among several agents. That can increase throughput only when the slices do not compete for the same files, decisions, or outcome. The public parallel-goal orchestrator therefore requires every worker.",
    "status": "published",
    "tags": [
      "Cumulus Skills",
      "Public source review",
      "Agent count is not the unit of progress"
    ],
    "readingTime": 0,
    "placement": "research",
    "visual": {
      "variant": "plan-stack",
      "alt": "Dither study for Parallelism Begins With Isolation"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Durable State for Long-Running Agents",
    "slug": "durable-state-for-long-running-agents",
    "body": [
      {
        "heading": "Conversation history is not a control plane",
        "paragraphs": [
          "An end-to-end build can span context compaction, machine restarts, review cycles, and multiple workers. If the only plan lives in chat, the project loses its operating state whenever the conversation changes. The public long-running-agent skill stores the approved goal, plans, standards, implementation instructions, and progress under a project-local .agent directory. Each file has a distinct role, and the orchestrator rereads plans and progress before milestones, dispatches, merges, reviews, and fixes.",
          "This is not documentation after the fact. It is the control plane that lets a new session recover what is approved, what changed, what passed, and what remains."
        ]
      },
      {
        "heading": "Milestones need acceptance and review loops",
        "paragraphs": [
          "The workflow decomposes work into milestones with dependencies, likely files, tests, and acceptance criteria. Substantial independent work can be delegated when the runtime and user authorization permit it, but workers receive disjoint scopes and no more than five implementation lanes operate at once. After a worker returns, the orchestrator inspects the diff and reruns relevant checks before integration.",
          "Milestone completion triggers another review cycle. Gaps discovered by tests or inspection become owned fix work, followed by re-verification. This creates a rhythm of implement, inspect, validate, record, and continue. It avoids the fragile pattern where every subtask reports success but nobody tests the combined system.",
          "The skill also defines a fallback for repositories without Git: create a timestamped backup before changing durable orchestration state, then write a manifest and verification log. Git remains the better review surface, but the fallback preserves before-and-after evidence. If subagents or worktrees are unavailable, the process continues locally and records that limitation instead of pretending isolation occurred."
        ]
      },
      {
        "heading": "Progress has several independent measures",
        "paragraphs": [
          "The companion progress tracker separates the declared Markdown checklist, latest objective-ledger states, and Git merge evidence. It detects duplicate identifiers or fingerprints across owners, reports active, completed, failed, and blocked objectives, and checks whether a completed objective branch is an ancestor of the target base. The report explicitly warns that checklist percentage is declared roadmap state and ledger completion is execution status, not total product proof.",
          "This distinction is essential for durable state. A checked box can be stale. A completed event can point to a missing branch. A merged branch can fail today’s build. Recording each measure lets a reviewer identify disagreement instead of averaging unlike facts into a reassuring percentage."
        ]
      },
      {
        "heading": "Installation preserves user-owned goal state",
        "paragraphs": [
          "The package installer supports bundle selection, custom homes, dry runs, and forced replacement. When an existing goal package is present without --force, template files are merged while GOAL.md, PROGRESS.md, and the objective ledger are protected. With force, the existing package is copied to a timestamped backup before replacement. A marker records which bundles were installed.",
          "These are small implementation choices with large trust consequences. A tool intended to improve durable state must not silently erase the state it is supposed to protect. Dry-run output gives operators a preview, protected files preserve active work, and backup-before-force makes destructive intent recoverable."
        ]
      },
      {
        "heading": "Limits and recovery discipline",
        "paragraphs": [
          "Project-local Markdown can drift from code, accumulate contradictory decisions, or expose sensitive notes if committed to a public repository. Append-only ledgers can contain malformed or misleading events. A progress file updated by several workers can conflict, and a backup is useful only if someone knows where it is and how to restore it. No orchestration document can recover an external credential, deleted database, or unpublished branch by itself.",
          "Durable-state practice should define ownership for each file, public-versus-private content rules, update frequency, and validation commands that reconcile prose with the repository. Test installer behavior against non-empty targets and interrupted copies. Periodically confirm that active objectives still have worktrees, completed branches reached the intended base, and listed commands still exist. Keep secrets and customer data out of shared state. The aim is not exhaustive narration. It is enough structured evidence that another trusted session can resume safely, challenge stale claims, and know the exact condition under which the work may stop.",
          "Archive superseded decisions with a reason instead of silently rewriting history; future reviewers need to know whether a contradiction reflects drift or a deliberate change."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Long-running agent orchestration contract",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/skills/long-running-agent/SKILL.md"
      },
      {
        "label": "Goal progress tracker contract",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/packages/goal-triad/skills/goal-progress-tracker/SKILL.md"
      },
      {
        "label": "Safe installer and goal-package preservation",
        "href": "https://github.com/ocque41/skills/blob/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92/bin/cmls-skills.mjs"
      }
    ],
    "relatedSlugs": [
      "wireframes-as-executable-handoffs",
      "objective-locks-before-agent-work",
      "parallelism-begins-with-isolation"
    ],
    "category": "Cumulus Skills",
    "project": "skills",
    "date": "2026-07-01",
    "excerpt": "An end-to-end build can span context compaction, machine restarts, review cycles, and multiple workers. If the only plan lives in chat, the project loses its operating state whenever the conversation changes. The public long-running-agent skill stores the.",
    "status": "published",
    "tags": [
      "Cumulus Skills",
      "Public source review",
      "Conversation history is not a control plane"
    ],
    "readingTime": 0,
    "placement": "research",
    "visual": {
      "variant": "context-rings",
      "alt": "Dither study for Durable State for Long-Running Agents"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "A Workflow Graph Should Fail Before It Runs",
    "slug": "rune-workflow-graph-validation-before-execution",
    "body": [
      {
        "heading": "Start with reachability, not field validation",
        "paragraphs": [
          "Visual workflow builders make composition feel immediate: connect a trigger to a few steps, draw a branch, and press run. The dangerous part is that a graph can look plausible while encoding an impossible or operationally unsafe program. Rune’s validation layer treats the canvas as a program that deserves a compile-like pass before execution. That distinction—between a graph that can be drawn and a graph that can be run—is the foundation of a dependable automation system. Rune first looks for a valid entry point: a start, webhook, or schedule node. Without one, validation returns immediately with a hard error. Once a trigger exists, the validator builds an adjacency map, traverses outward from every trigger, and reports nodes that cannot be reached. Those nodes are warnings rather than errors because disconnected work may be intentional while a workflow is being assembled.",
          "This ordering is useful. Field-level errors matter only after the engine knows there is a runnable shape. Reachability also catches a class of errors that form controls cannot: a perfectly configured email node still does nothing if no path reaches it."
        ]
      },
      {
        "heading": "Runtime modes become structural rules",
        "paragraphs": [
          "The validator does more than check graph theory in the abstract. It applies different rules for lineal, branching, and circular modes. Lineal mode rejects branch, parallel, and loop nodes, as well as fan-in and fan-out. Both lineal and branching modes reject cycles. Circular mode permits cycles but emits warnings so operators know to watch for long-running execution.",
          "That makes a workflow mode a real contract rather than a cosmetic label. A linear workflow cannot silently acquire a second path. A circular workflow acknowledges its risk at validation time. The deeper design lesson is that product-level concepts should compile into enforceable invariants."
        ]
      },
      {
        "heading": "Normalize old nodes before judging them",
        "paragraphs": [
          "Graphs tend to outlive UI implementations. Rune keeps a canonical node-kind catalog and maps legacy labels and component types onto it. Validation and simulation both resolve through that catalog instead of branching on whatever label happens to be visible on the canvas.",
          "This prevents a common migration failure: an old saved workflow opens, but new runtime code no longer recognizes its nodes. Centralized normalization also keeps display names separate from executable identity. Labels remain editable; kinds remain stable."
        ]
      },
      {
        "heading": "Dry runs are useful because they are explicitly fake",
        "paragraphs": [
          "Rune’s browser-side simulator walks the graph with a queue, records node-level logs, and carries outputs forward. External effects—HTTP calls, email, database queries, approvals, waits—return mock results. Conditions and transforms execute locally, and a five-executions-per-node guard prevents an accidental infinite loop from freezing the simulation.",
          "The simulator is valuable precisely because its boundary is visible. It previews control flow and data shape; it does not prove provider credentials, network behavior, database permissions, or delivery. A dry run should answer “does this graph behave as intended?” without pretending to answer “will production succeed?”"
        ]
      },
      {
        "heading": "The tradeoff: two validators can drift",
        "paragraphs": [
          "The repository contains both a graph validator and a lighter simulator configuration check. They differ in severity for some missing fields and do not enforce exactly the same mode rules. That is an understandable evolution path, but it creates a maintenance risk: the editor may approve something the simulator rejects, or vice versa.",
          "A strong next step would be to make the simulator consume the canonical validation result, then add simulation-only advisories separately. The current design already contains the right building blocks—stable kinds, deterministic cycle detection, and structured error codes. Consolidating the final policy would turn them into one authoritative preflight."
        ]
      },
      {
        "heading": "Why this architecture matters",
        "paragraphs": [
          "The important idea is not merely “validate inputs.” It is to validate the executable topology, normalize persisted history, and make runtime modes enforceable before side effects begin.",
          "That creates a workflow builder in which the visual model and the execution model can disagree less often—and when they do disagree, the user gets a specific, local explanation before a production run exists."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Graph validator",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/workflow-validator.ts"
      },
      {
        "label": "Client-side simulator",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/workflow-simulator.ts"
      },
      {
        "label": "Canonical node catalog",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/workflow/node-catalog.ts"
      }
    ],
    "relatedSlugs": [
      "rune-runtime-modes-and-execution-guardrails",
      "rune-user-scoped-secrets-by-reference",
      "rune-autonomy-with-explicit-approval-boundaries"
    ],
    "category": "Rune",
    "project": "rune",
    "date": "2026-06-30",
    "excerpt": "Visual workflow builders make composition feel immediate: connect a trigger to a few steps, draw a branch, and press run. The dangerous part is that a graph can look plausible while encoding an impossible or operationally unsafe program. Rune’s validation.",
    "status": "published",
    "tags": [
      "Rune",
      "Public source review",
      "Start with reachability, not field validation"
    ],
    "readingTime": 0,
    "placement": "research",
    "visual": {
      "variant": "cost-contours",
      "alt": "Dither study for A Workflow Graph Should Fail Before It Runs"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Runtime Modes as an Operational Safety Envelope",
    "slug": "rune-runtime-modes-and-execution-guardrails",
    "body": [
      {
        "heading": "One engine, multiple entry shapes",
        "paragraphs": [
          "A loop on a canvas is just an arrow returning to an earlier node. In production it is an open-ended resource claim: more tool calls, more tokens, more database writes, and potentially more external side effects. Rune addresses that gap by making workflow mode part of runtime policy. The engine does not rely on the diagram alone; it tracks how execution behaves and applies limits while the queue is moving. The workflow engine can start from an explicit trigger, auto-detect a start/webhook/schedule node, or accept a plan containing multiple start nodes. In every case, it converts the entry points into a queue of node-and-input pairs. That provides a single execution core for interactive runs, external triggers, and planned subgraphs.",
          "The choice is pragmatic: execution semantics stay centralized even when initiation differs. It also makes the start decision observable. Multiple triggers without a canonical start produce a warning rather than silently hiding the selection rule."
        ]
      },
      {
        "heading": "Policy travels with the run",
        "paragraphs": [
          "The constructor normalizes the requested workflow mode and its configuration, then builds an execution policy. It also records which nodes are approvals and initializes counters for total and per-node executions. While consuming the queue, the engine calls policy enforcement before every node.",
          "This is the crucial boundary. Static validation can reject a cycle in a branching workflow, but only runtime policy can notice that an allowed circular workflow is consuming its budget. Counting executions at the engine level avoids asking every node implementation to defend itself independently."
        ]
      },
      {
        "heading": "Waiting is a first-class outcome",
        "paragraphs": [
          "Approval and wait-oriented steps are not modeled as failures. When a node pauses the workflow, the engine marks the run as waiting, persists what it is waiting for, records the current outputs, and emits an autonomy event. Completion and failure follow the same pattern: update durable run state, emit a deduplicated event, and return a structured run object.",
          "That state model is more honest than keeping a request open until a human responds. It separates orchestration time from HTTP time and gives the UI, worker, or notification layer a stable record to resume later."
        ]
      },
      {
        "heading": "Errors are data, but sensitive data is filtered",
        "paragraphs": [
          "On failure, the engine updates the run and sends an event containing the error. Before either operation, the message is passed through the secret redactor. This matters because workflow failures often echo provider responses or configuration fragments. Operational visibility should not turn the run log into a credential side channel.",
          "The pattern—persist status, emit an event, return a typed outcome—also supports downstream automation. A monitoring job can react to run.failed without scraping console text. A separate planner can react to run.waiting without owning the runtime’s queue."
        ]
      },
      {
        "heading": "Idempotency protects request-level repetition",
        "paragraphs": [
          "Rune also includes an idempotency wrapper for API operations. A new key is inserted as processing; a completed duplicate receives the cached response; a concurrent duplicate receives 409 with Retry-After; and a prior failure returns a distinct error. Successful 2xx responses are cached, while unsuccessful responses mark the record failed.",
          "This solves a different problem from per-node execution limits. Runtime policy bounds behavior inside one run. Idempotency prevents two equivalent requests from creating two runs or side effects. Dependable systems need both layers."
        ]
      },
      {
        "heading": "Limits and open questions",
        "paragraphs": [
          "The engine’s queue is process-local during execution, so durability depends on the surrounding run store and resume paths rather than on the array itself. Likewise, idempotency records make retries predictable, but the present failed-key policy blocks automatic retry instead of offering a reset window. Those are explicit tradeoffs, not universal defaults.",
          "There is also no claim that a circular mode makes arbitrary loops safe. Budgets and alerts reduce blast radius; they do not make repeated third-party calls reversible. Nodes that mutate external systems still need provider-specific idempotency and compensation.",
          "Rune’s useful abstraction is an operational envelope: the graph declares a mode, validation checks whether the topology fits it, and the engine enforces behavior as nodes execute. Waiting, completion, and failure become durable states rather than incidental logs. Combined with request idempotency, this turns a workflow mode into something operators can reason about under retries, approvals, and loops—not just a label shown in the editor."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Workflow engine",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/workflow-engine.ts"
      },
      {
        "label": "Mode policy",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/workflow/modes.ts"
      },
      {
        "label": "Idempotency wrapper",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/idempotency.ts"
      }
    ],
    "relatedSlugs": [
      "rune-user-scoped-secrets-by-reference",
      "rune-autonomy-with-explicit-approval-boundaries",
      "rune-workflow-graph-validation-before-execution"
    ],
    "category": "Rune",
    "project": "rune",
    "date": "2026-06-29",
    "excerpt": "A loop on a canvas is just an arrow returning to an earlier node. In production it is an open-ended resource claim: more tool calls, more tokens, more database writes, and potentially more external side effects. Rune addresses that gap by making workflow mode.",
    "status": "published",
    "tags": [
      "Rune",
      "Public source review",
      "One engine, multiple entry shapes"
    ],
    "readingTime": 0,
    "placement": "research",
    "visual": {
      "variant": "contract-bridge",
      "alt": "Dither study for Runtime Modes as an Operational Safety Envelope"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "User-Scoped Secrets by Reference, Not by Accident",
    "slug": "rune-user-scoped-secrets-by-reference",
    "body": [
      {
        "heading": "References are part of the workflow format",
        "paragraphs": [
          "Workflow products create an unusually broad secret-handling surface. Credentials can arrive through settings forms, live inside saved node configuration, be interpolated into generated code, appear in provider errors, and leak again through run logs. Rune’s secret architecture attacks that surface as a chain: identify secret-looking values, reject inline credentials, resolve named references only on the server, encrypt stored values, and redact outputs before they become diagnostics. The secret policy recognizes templated references such as {{secrets.MAIL_API_KEY}} as safe indirection. High-confidence patterns catch common provider keys, cloud access keys, Slack tokens, JWT-like strings, and private-key blocks. A second heuristic looks at sensitive field names and suspicious long values.",
          "This two-level approach is important. Prefix signatures are precise but incomplete; field-name heuristics are broader but can produce false positives. Placeholders and references are exempted so the policy can fail closed on real values without punishing the intended authoring model."
        ]
      },
      {
        "heading": "Redaction and rejection solve different problems",
        "paragraphs": [
          "assertNoInlineSecrets rejects a workflow or payload that appears to embed raw credentials. redactSecrets recursively replaces sensitive material in strings, arrays, and objects. The first protects persistence and code generation. The second protects logs and error paths when a secret still appears at runtime.",
          "Tests make the distinction concrete. They verify that inline provider keys are blocked, generated workflows call a secret resolver instead of reading provider environment variables, and emitted node output is redacted before it reaches the run stream. Secret values accepted by management endpoints are not returned in responses; clients receive names and metadata."
        ]
      },
      {
        "heading": "Runtime lookup is user-scoped",
        "paragraphs": [
          "The runtime resolver requires a user identifier. It caches by userId:key, fetches through the managed secret provider, and refuses to preload secrets without an explicitly user-scoped runtime. That cache key matters: a global cache keyed only by the secret name could return one tenant’s credential to another.",
          "The manager supports environment variables, AWS Secrets Manager, Vault, and Supabase-backed storage. Environment lookup is disabled in production-like deployments, while Supabase is the default. The provider abstraction is useful, but the security rule is more important than the provider list: runtime code asks for a named secret on behalf of a known user."
        ]
      },
      {
        "heading": "Encryption must fail closed",
        "paragraphs": [
          "The local encryption helper uses AES-256-GCM and expects a configured encryption key. The test suite explicitly deletes the key and verifies that encryption throws. This avoids an especially damaging fallback: silently writing plaintext because production configuration is incomplete.",
          "Authenticated encryption also gives stored values integrity protection. A modified ciphertext fails authentication instead of decrypting into corrupted material. The implementation uses a fresh 12-byte IV and stores IV, authentication tag, and ciphertext together."
        ]
      },
      {
        "heading": "Provider flexibility has operational cost",
        "paragraphs": [
          "Supporting several backends lets self-hosters choose existing infrastructure, but not every backend has the same capabilities. The code exposes create, update, and delete only for the Supabase provider; environment variables are read-only, while AWS and Vault implementations focus on listing and fetching. Operators should not infer full lifecycle parity from a shared read interface.",
          "The in-memory runtime cache is another deliberate compromise. It reduces repeated lookups but has no visible TTL in the module. Rotated credentials may remain in a warm process until the cache is cleared or the instance restarts. A production deployment that requires immediate revocation should add time-bounded caching or invalidation tied to updates."
        ]
      },
      {
        "heading": "A complete boundary is more than encryption",
        "paragraphs": [
          "Encryption at rest is necessary, but it would not stop a key embedded in a workflow JSON document or echoed into a run log. Rune’s stronger contribution is the end-to-end boundary: references in authored workflows, user-scoped resolution on the server, fail-closed encryption, non-returning APIs, and recursive redaction at observability points.",
          "The design still depends on disciplined call sites and correctly configured provider infrastructure. Yet it makes the safe path the normal path. Authors store names, runtimes resolve values, and logs receive sanitized structures. That is the right division of responsibility for a system whose primary job is to move data through user-defined automation."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Secret detection and redaction policy",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/security/secrets-policy.ts"
      },
      {
        "label": "User-scoped runtime resolver",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/runtime/secrets.ts"
      },
      {
        "label": "Secret-safety tests",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/__tests__/secret-safety.test.ts"
      }
    ],
    "relatedSlugs": [
      "rune-autonomy-with-explicit-approval-boundaries",
      "rune-workflow-graph-validation-before-execution",
      "rune-runtime-modes-and-execution-guardrails"
    ],
    "category": "Rune",
    "project": "rune",
    "date": "2026-06-28",
    "excerpt": "Workflow products create an unusually broad secret-handling surface. Credentials can arrive through settings forms, live inside saved node configuration, be interpolated into generated code, appear in provider errors, and leak again through run logs. Rune’s.",
    "status": "published",
    "tags": [
      "Rune",
      "Public source review",
      "References are part of the workflow format"
    ],
    "readingTime": 0,
    "placement": "research",
    "visual": {
      "variant": "workspace-beacon",
      "alt": "Dither study for User-Scoped Secrets by Reference, Not by Accident"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Autonomy with Explicit Approval Boundaries",
    "slug": "rune-autonomy-with-explicit-approval-boundaries",
    "body": [
      {
        "heading": "Events become jobs before they become tool calls",
        "paragraphs": [
          "An autonomous workflow system has to answer two questions independently: can a tool execute, and should it execute without a person? Rune’s autonomy modules separate event intake, planning, policy, approval, and execution so those questions do not collapse into a single model response. The result is not “unlimited autonomy.” It is a control plane in which automated progress is bounded by budgets, leases, status transitions, and one-use approval decisions. The autonomy service processes pending events, triages them, and creates jobs before execution. Planning produces a sequence of steps and chooses an initial state. Depending on policy and plan characteristics, a job can wait for approval or begin execution. This intermediary job record matters: it is a durable object that can be inspected, notified, leased, retried, or stopped without asking an LLM to reconstruct history.",
          "The architecture also logs model usage during triage. Token counts, source, workflow, job, and status can enter a unified usage ledger, letting operators distinguish reasoning cost from actual tool execution."
        ]
      },
      {
        "heading": "Effective policy combines defaults and user controls",
        "paragraphs": [
          "The policy module defines system defaults and resolves an effective policy for a user. Budget checks compare current cost with a configured maximum. That moves spending limits out of prompts and into deterministic code.",
          "This is an important pattern for agent systems. A prompt can explain that a budget exists; only code can refuse the next operation consistently. The same principle applies to allowed tools, notification behavior, and approval requirements: models may propose, but policy decides."
        ]
      },
      {
        "heading": "Approval links are stateful capabilities",
        "paragraphs": [
          "Rune generates random approval tokens, stores only the token hash, assigns an expiration, and records an intended action. Validation checks existence, expiry, and prior use. Applying a token verifies that the job is actually waiting for approval, records the decision, marks the token used, and resumes execution only for an approval.",
          "This is stronger than a yes/no query parameter. The link is a time-bounded capability tied to one job and one decision. Reuse is visible, and stale links cannot silently authorize a job that has moved to another state."
        ]
      },
      {
        "heading": "Execution is resumable in small increments",
        "paragraphs": [
          "The executor reads the job and plan, ignores jobs outside executable states, runs at most five unfinished steps per batch, updates step timestamps and results, and clears the lease marker when it yields for another worker invocation. A non-autonomous plan waits for approval before its first execution; once running, allowlists, blocklists, and budget checks can fail or pause it. Completion, pause, and failure each trigger user notification through the configured policy path.",
          "The incremental model fits serverless workers better than one long autonomous loop. It also gives operators checkpoints. A partially completed job has persisted steps rather than only a long transcript."
        ]
      },
      {
        "heading": "Boundaries the implementation does not erase",
        "paragraphs": [
          "Approval tokens reduce accidental execution; they do not prove who clicked the link beyond possession of the capability. Sensitive deployments may need an authenticated approval page, stronger actor recording, or multi-party review. Notification delivery also depends on external email configuration.",
          "Likewise, leases and durable rows reduce duplicate work but do not make every downstream tool idempotent. If a worker loses its lease after a third-party side effect but before persisting success, a retry can repeat the call unless the tool itself accepts an idempotency key. Approval is a governance boundary, not a transaction protocol.",
          "The triage and planning path also parses structured model output. Malformed output, prompt injection in event content, and provider outages remain operational risks. Deterministic validation of plans and strict tool schemas should continue to sit between generated intent and execution."
        ]
      },
      {
        "heading": "The real product is controlled continuation",
        "paragraphs": [
          "Rune’s autonomy design is compelling because it treats continuation as a controlled operation. Events do not jump straight to tools. Plans become durable steps. Policy can stop spending. High-impact work can suspend for approval. One-use tokens move a job forward, and workers advance it in inspectable increments.",
          "That structure makes autonomy legible. A user can ask what the system plans to do, what it already did, why it paused, and what approving a link will unlock. Those answers are more valuable than the appearance of an agent that simply keeps running."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Autonomy service and planning",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/autonomy/service.ts"
      },
      {
        "label": "Approval token lifecycle",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/autonomy/approvals.ts"
      },
      {
        "label": "Incremental job execution",
        "href": "https://github.com/ocque41/rune/blob/d0a73dd0fa99c7a001eea954e7066ec32a4416b7/lib/autonomy/execution.ts"
      }
    ],
    "relatedSlugs": [
      "rune-workflow-graph-validation-before-execution",
      "rune-runtime-modes-and-execution-guardrails",
      "rune-user-scoped-secrets-by-reference"
    ],
    "category": "Rune",
    "project": "rune",
    "date": "2026-06-27",
    "excerpt": "An autonomous workflow system has to answer two questions independently: can a tool execute, and should it execute without a person? Rune’s autonomy modules separate event intake, planning, policy, approval, and execution so those questions do not collapse.",
    "status": "published",
    "tags": [
      "Rune",
      "Public source review",
      "Events become jobs before they become tool calls"
    ],
    "readingTime": 0,
    "placement": "build-business",
    "visual": {
      "variant": "cloud-gate",
      "alt": "Dither study for Autonomy with Explicit Approval Boundaries"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Deterministic Intent Resolution for Agent Infrastructure",
    "slug": "relay-deterministic-intent-resolution",
    "body": [
      {
        "heading": "Parse phrases with stable precedence",
        "paragraphs": [
          "“Add a database and transactional email” sounds like a simple agent request. Turning it into infrastructure is not simple: the system must interpret categories, choose providers, reuse existing accounts, avoid duplicate provisioning, and return credentials without improvising a new answer on every run. Relay handles that path with deterministic parsing and selection before any signup workflow begins. The model-facing feature is natural language; the operating core is ordinary, inspectable code. The intent parser lowercases the goal, removes punctuation, and scans a curated phrase map longest-first. That ordering lets “transactional email” resolve before the shorter word “email,” while “vector search” can intentionally map to more than one category. Matched ranges cannot overlap, categories are deduplicated, and results are sorted by a canonical category order.",
          "Unrecognized residual tokens are returned as unmatchedTerms after stop words and plain numbers are removed. This is an underrated API choice. Instead of silently discarding unfamiliar language, Relay gives callers enough information to refine the request or surface a warning."
        ]
      },
      {
        "heading": "Provider choice is deterministic—and willing to abstain",
        "paragraphs": [
          "Within each category, the selector ranks providers by pricing model: free, free tier, freemium, usage-based, then paid. Provider IDs provide stable ordering, but an equal top pricing rank does not produce an arbitrary winner. The result is marked ambiguous and returns candidates, requiring the caller to pin a provider.",
          "That abstention is safer than fake confidence. An agent can ask a user to choose, apply an explicit policy, or retry with a pin. The selection rule is also easy to test because it has no model call, random tie-breaker, or hidden personalization."
        ]
      },
      {
        "heading": "Resolution reuses before it provisions",
        "paragraphs": [
          "For every resolved category, Relay checks the selected workspace for an existing non-failed account with the same provider and alias. If found, it returns account metadata and, when available, a one-time reveal endpoint for the latest active key. If no account exists, it checks for a pending or email-waiting signup job and returns its poll URL instead of starting another.",
          "Only after both checks miss does the resolver build provider-specific default input and kick a signup workflow. Providers that cannot supply safe defaults are reported as unsatisfied with guidance to call the explicit signup endpoint. This ordering reduces duplicate resources and makes “intent” a reconciliation operation, not just a provisioning command."
        ]
      },
      {
        "heading": "Partial success is the normal response",
        "paragraphs": [
          "The result can include existing accounts, provisioning jobs, ambiguous slots, missing providers, and unmatched words at the same time. Relay formats environment-variable placeholders for the selected shell style and returns a batch reveal URL only when credentials are actually available.",
          "That response shape matches real infrastructure work. One category may be ready, another may need email verification, and a third may need a user decision. Returning one global failure would throw away useful progress; claiming total success would hide unresolved work."
        ]
      },
      {
        "heading": "Idempotency sits at the HTTP boundary",
        "paragraphs": [
          "The route accepts an Idempotency-Key and stores the response for 24 hours, scoped to the calling agent. A retry can receive the same resolution rather than repeating database decisions or starting another signup. Authentication also verifies that the agent is user-scoped and that the requested workspace belongs to that user before resolution begins.",
          "The resolver itself still performs reads and can launch workflows, so correctness under concurrent first-time requests depends on database constraints and the route-level idempotency discipline. Clients should treat the key as required for retryable automation even if the protocol makes it optional."
        ]
      },
      {
        "heading": "What the heuristic cannot know",
        "paragraphs": [
          "A curated keyword map is fast and explainable, but it cannot infer nuanced requirements such as data residency, compliance, latency, existing contracts, or a preference for a paid provider. Pricing rank is a product default, not an objective definition of “best.” Pins and explicit signup input are therefore essential escape hatches.",
          "The architecture succeeds by keeping that limitation visible. Natural language narrows the search; deterministic code produces a repeatable proposal; ambiguity and unmatched terms travel back to the caller; and provisioning starts only after workspace reconciliation. For agents operating infrastructure, reproducibility is often more valuable than a clever answer that changes between runs."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Intent phrase parser",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/intent/parse.ts"
      },
      {
        "label": "Deterministic provider selector",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/intent/select.ts"
      },
      {
        "label": "Workspace-aware resolver",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/intent/resolve.ts"
      }
    ],
    "relatedSlugs": [
      "relay-human-agent-authentication-split",
      "relay-workspace-pinning-and-credential-envelopes",
      "relay-idempotent-action-dispatch-and-fair-billing"
    ],
    "category": "Relay",
    "project": "relay",
    "date": "2026-06-26",
    "excerpt": "“Add a database and transactional email” sounds like a simple agent request. Turning it into infrastructure is not simple: the system must interpret categories, choose providers, reuse existing accounts, avoid duplicate provisioning, and return credentials.",
    "status": "published",
    "tags": [
      "Relay",
      "Public source review",
      "Parse phrases with stable precedence"
    ],
    "readingTime": 0,
    "placement": "build-business",
    "visual": {
      "variant": "signal-window",
      "alt": "Dither study for Deterministic Intent Resolution for Agent Infrastructure"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Separate Authentication Paths for Humans and Agents",
    "slug": "relay-human-agent-authentication-split",
    "body": [
      {
        "heading": "Human login begins with possession, then creates a session",
        "paragraphs": [
          "An agent platform serves at least two kinds of actors. People need sessions they can understand, revoke, and strengthen with passkeys. Agents need scoped tokens that work in REST and tool protocols without gaining every privilege of the person who launched them. Relay models those as separate authentication paths instead of stretching one credential format across browsers, scripts, and MCP clients. The email path sends a six-digit one-time code, verifies it, and issues a browser session. WebAuthn endpoints add passkey registration and login. The session is an HS256-signed JWT stored in an HttpOnly cookie with SameSite=Lax; HTTPS requests receive the Secure flag.",
          "The JWT is not the whole session. Each token carries a jti that must still exist in the database. Logout deletes that row and clears the cookie, so a signature-valid token can be revoked server-side. The verifier also checks expiry, user ownership, and the current active workspace context before returning a session user."
        ]
      },
      {
        "heading": "Agent tokens are shown once and stored as hashes",
        "paragraphs": [
          "The minting helper generates a random bearer token, returns the plaintext once, and stores its SHA-256 hash. New tokens expire after 30 days by default. A request for a non-expiring token is honored only when the caller also asserts that a human explicitly requested it; otherwise the helper falls back to the default lifetime.",
          "Scopes receive similar defense in depth. The special admin scope is stripped unless the caller passes an explicit allowAdmin capability. That keeps a self-service route from accidentally turning a routine token into a platform-wide credential."
        ]
      },
      {
        "heading": "Workspace pinning prevents ambient authority",
        "paragraphs": [
          "Agent tokens can carry a user workspace ID. Unlike a browser session, which can switch the person’s active workspace, a bearer token stays pinned to the workspace where it was minted. The difference is deliberate: interactive context can change visibly, but unattended credentials should not inherit a later UI choice.",
          "This makes the token’s authority easier to review. Revoking or rotating a token does not require reconstructing which workspace happened to be active during each request."
        ]
      },
      {
        "heading": "MCP moves authentication into the tool contract",
        "paragraphs": [
          "Some MCP clients cannot conveniently add HTTP authorization headers. Relay’s MCP server therefore accepts an agent_token argument per protected tool and validates it using the same hash lookup, revocation, and expiry rules as REST bearer authentication. The transport remains stateless: one MCP request yields one response.",
          "Placing a token in tool input is a compatibility choice, not a relaxation. Each tool must authenticate before touching protected data, and clients must keep tool arguments out of traces and model-visible history. A gateway that can supply headers securely may still prefer the REST surface."
        ]
      },
      {
        "heading": "Distinct actors deserve distinct failure modes",
        "paragraphs": [
          "Expired agent tokens produce a specific agent_token_expired error so an orchestrator can ask the person to bootstrap again. Invalid browser sessions simply resolve to unauthenticated state. Email OTP start has an email-level rate limit, while passkey flows depend on WebAuthn challenges and relying-party configuration.",
          "These distinctions improve recovery. “Sign in again,” “mint a new agent token,” and “check passkey origin configuration” are different operator actions; collapsing them into 401 everywhere would make automation brittle."
        ]
      },
      {
        "heading": "Security still depends on deployment choices",
        "paragraphs": [
          "Hashing bearer tokens protects database disclosure but cannot protect a plaintext token leaked from a client log. HS256 sessions depend on a strong SESSION_SECRET, and passkeys depend on correct origin and relying-party values. Email OTP inherits the security and availability of outbound mail and the recipient’s mailbox.",
          "Thirty-day agent tokens are a default, not a guarantee of least privilege. High-impact environments may need shorter expiries, automated rotation, narrower scopes, and stronger anomaly detection. Likewise, a SHA-256 token hash is appropriate for high-entropy random tokens, not for human passwords.",
          "Relay’s main architectural win is clarity: people authenticate through email or passkeys and receive revocable browser sessions; agents receive scoped, expiring, workspace-pinned credentials; MCP adapts that credential to tool-level clients. Each path can then be hardened according to how it is actually used instead of inheriting the compromises of the others."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Human authentication routes",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/routes/auth.ts"
      },
      {
        "label": "Revocable browser sessions",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/auth/session.ts"
      },
      {
        "label": "Agent-token minting policy",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/auth/mint-token.ts"
      }
    ],
    "relatedSlugs": [
      "relay-workspace-pinning-and-credential-envelopes",
      "relay-idempotent-action-dispatch-and-fair-billing",
      "relay-deterministic-intent-resolution"
    ],
    "category": "Relay",
    "project": "relay",
    "date": "2026-06-25",
    "excerpt": "An agent platform serves at least two kinds of actors. People need sessions they can understand, revoke, and strengthen with passkeys. Agents need scoped tokens that work in REST and tool protocols without gaining every privilege of the person who launched.",
    "status": "published",
    "tags": [
      "Relay",
      "Public source review",
      "Human login begins with possession, then creates a session"
    ],
    "readingTime": 0,
    "placement": "build-business",
    "visual": {
      "variant": "terminal-rain",
      "alt": "Dither study for Separate Authentication Paths for Humans and Agents"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Workspace Pinning and Credential Envelopes",
    "slug": "relay-workspace-pinning-and-credential-envelopes",
    "body": [
      {
        "heading": "Personal workspaces have explicit invariants",
        "paragraphs": [
          "Multi-account products often treat “workspace” as navigation. Relay treats it as an authorization boundary: accounts, signup jobs, inbox aliases, audit records, share links, and agent credentials all need a stable place to belong. The repository pairs that boundary with an encrypted credential model that can represent both old single-key integrations and newer structured handoffs. Every user receives a default workspace, and the resolver can fall back to it if an older account has no active-workspace pointer. Workspace creation enforces a maximum count, creates a unique slug and inbox alias, and can update the active selection. Renames preserve identity because routes operate on the workspace ID rather than the display name.",
          "Deletion is intentionally difficult. The requested workspace must belong to the caller; the default and final remaining workspaces cannot be removed; and the caller must provide the exact current name as confirmation. If a deletable workspace is active, the user is moved back to the default before cascading rows. That ordering avoids a dangling active-workspace reference."
        ]
      },
      {
        "heading": "Browser context can switch; bearer context cannot",
        "paragraphs": [
          "A browser session may switch the user’s active personal workspace. A user-scoped agent token is pinned to one workspace when created, and bearer callers cannot use the switch route to redirect their own authority. Legacy tokens without a pinned workspace fall back to the user’s active or default workspace, preserving compatibility while new tokens use the stricter model.",
          "This is a sound split between interactive and unattended access. A person can intentionally navigate; an agent cannot wake up with access to a newly selected client environment merely because the UI changed yesterday."
        ]
      },
      {
        "heading": "Credentials can be strings or structured records",
        "paragraphs": [
          "Provider handoffs are not always one API key. Relay’s credential envelope accepts either a string or an object. Structured credentials are wrapped under a versioned marker before serialization, while unmarked values decode as legacy plaintext keys. Consumers receive either initialApiKey or initialCredentials, making migration additive rather than destructive.",
          "The envelope itself is an encoding convention, not encryption. The cryptographic layer separately encrypts serialized credential material with AES-256-GCM. That separation keeps payload evolution independent of the storage cipher."
        ]
      },
      {
        "heading": "Authenticated encryption includes a rotation path",
        "paragraphs": [
          "The encryption helper creates a fresh 12-byte nonce, stores the GCM authentication tag with ciphertext, and validates that the configured master key decodes to exactly 32 bytes. Database rows carry a key version, allowing the decrypt path to select an older key during migration.",
          "The documented rotation sequence stages a new versioned key, begins writing with it, re-encrypts old rows, and only then retires the former key. This is operationally heavier than replacing one environment variable, but it avoids making existing ciphertext unreadable during rollout."
        ]
      },
      {
        "heading": "Tenant credentials follow a one-time handoff rule",
        "paragraphs": [
          "The storage helper returns null for tenant-backed provider credentials while allowing built-in provider credentials to proceed to account storage. That small function encodes an important boundary: Relay can deliver tenant integration credentials without necessarily retaining a second durable copy in the account record.",
          "Structured handoffs still need careful lifecycle design. A credential returned once must reach the intended user, and retries must not mint uncontrolled duplicates. Encryption protects the database copy that exists; it does not protect plaintext after reveal or inside a downstream client."
        ]
      },
      {
        "heading": "App-level isolation requires relentless tests",
        "paragraphs": [
          "Workspace scoping is enforced through application queries and foreign keys, not through a magical property of the word “workspace.” Every new REST route, MCP tool, background workflow, and dashboard query must include the correct workspace filter. Legacy fallbacks deserve particular attention because they deliberately infer context.",
          "The master key is another concentrated risk. Anyone who obtains it and the ciphertext can decrypt stored credentials. Versioning improves rotation but does not replace secret-manager controls, access logging, or backup handling. Deletion cascades also make the confirmation rules consequential; operators need reliable backups and retention policy outside the request path.",
          "The combined architecture is still valuable: stable workspace identities constrain data and tokens, while versioned envelopes let provider credentials evolve without abandoning older accounts. It recognizes that tenancy and secret format are both long-lived contracts—contracts that must survive UI changes, migrations, and automation clients."
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "User workspace invariants and token pinning",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/user-workspaces.ts"
      },
      {
        "label": "Credential envelope compatibility",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/credentials/envelope.ts"
      },
      {
        "label": "Versioned AES-GCM cryptography",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/crypto.ts"
      }
    ],
    "relatedSlugs": [
      "relay-idempotent-action-dispatch-and-fair-billing",
      "relay-deterministic-intent-resolution",
      "relay-human-agent-authentication-split"
    ],
    "category": "Relay",
    "project": "relay",
    "date": "2026-06-24",
    "excerpt": "Multi-account products often treat “workspace” as navigation. Relay treats it as an authorization boundary: accounts, signup jobs, inbox aliases, audit records, share links, and agent credentials all need a stable place to belong. The repository pairs that.",
    "status": "published",
    "tags": [
      "Relay",
      "Public source review",
      "Personal workspaces have explicit invariants"
    ],
    "readingTime": 0,
    "placement": "build-business",
    "visual": {
      "variant": "archive-lines",
      "alt": "Dither study for Workspace Pinning and Credential Envelopes"
    },
    "verifiedAt": "2026-07-16"
  },
  {
    "title": "Idempotent Action Dispatch and Fair Billing",
    "slug": "relay-idempotent-action-dispatch-and-fair-billing",
    "body": [
      {
        "heading": "Reject invalid work before spending quota",
        "paragraphs": [
          "Calling a third-party action on behalf of a user crosses several boundaries at once: identity, schema validation, provider reliability, billing, retries, and auditability. Relay’s action path makes that sequence explicit. It validates before dispatch, binds a stable external identity, signs the request, records its state, and distinguishes a known failure from a timeout whose outcome is unknown. An action request first resolves the tenant and a public, enabled action. The caller must be a user-scoped agent. If an external user ID is supplied, it must match the existing user-to-tenant binding; otherwise Relay creates or reuses a stable generated identity.",
          "Input is validated against the action’s JSON Schema before billing or network dispatch. A circuit breaker can then stop calls to a degraded integrator. This ordering prevents malformed requests from consuming quota and avoids hammering an endpoint already exhibiting repeated failures."
        ]
      },
      {
        "heading": "Idempotency keys turn retries into lookup",
        "paragraphs": [
          "For requests carrying an idempotency key, Relay searches for a matching invocation by tenant, action, external identity, and key. A successful result within 24 hours becomes a replay response without another webhook. Failed and unknown invocations also return their recorded states rather than dispatching again.",
          "The scope is important. A key alone is not globally unique; it is meaningful within the action and identity it protects. Clients should generate a stable key per intended side effect and retain it across network retries."
        ]
      },
      {
        "heading": "Lifecycle billing claims are reversible receipts",
        "paragraphs": [
          "Signup and API-key lifecycle routes can use a shared billing helper that returns a receipt containing the idempotency key, quota claim, whether the user counter moved, and whether a fairness debounce absorbed the request. If downstream work fails, those callers can refund the exact quota claim and decrement the user counter. Refunds are themselves idempotent on the charge key.",
          "The fairness rule collapses same-day key lifecycle actions—mint, reveal, rotate, and revoke—for the same user, tenant, and provider into one integrator-quota debit. Signup and delete remain fully billable. An abuse counter still runs for repeated user activity, so fairness does not become a free infinite loop. The generic action dispatcher uses its own tenant action-quota claim rather than this lifecycle receipt path.",
          "This is a nuanced separation: commercial metering can forgive repetitive lifecycle work while abuse controls still limit load."
        ]
      },
      {
        "heading": "HMAC dispatch creates an auditable trust boundary",
        "paragraphs": [
          "Relay serializes the exact JSON body and computes an HMAC-SHA256 signature with the integrator’s secret. Requests include the signature, an action identifier, a request ID, nonce, timestamp, and stable external user identity. The shared dispatcher applies a timeout and returns a non-throwing result that classifies network, timeout, HTTP, and non-JSON failures.",
          "A 2xx JSON response becomes succeeded or overage. An integrator error becomes failed. A timeout becomes unknown, because the remote service may have completed the action after Relay stopped waiting. Tenant operators can reconcile an unknown invocation later rather than guessing that it failed and repeating it."
        ]
      },
      {
        "heading": "Process-local controls have a clear ceiling",
        "paragraphs": [
          "Relay also has a fixed-window, per-agent rate limiter for read and write routes. It explicitly documents that counters live in process memory. In a multi-instance deployment the true aggregate ceiling can be the per-instance limit multiplied by the number of active instances.",
          "That is suitable for catching runaway loops inside warm instances, not for a strict global quota. High-scale operators should move burst counters to shared storage. The same caution applies to the in-memory circuit breaker: it protects a process but is not a globally coordinated health system."
        ]
      },
      {
        "heading": "Exactly-once is still not guaranteed",
        "paragraphs": [
          "Idempotency at Relay prevents a recorded duplicate from being dispatched again. It cannot make a third-party endpoint transactional. If the integrator performs the side effect but the response is lost, the invocation is unknown until reconciliation. The action route deliberately retains the quota claim for an unknown outcome; unlike the lifecycle helper, it does not expose a receipt-based refund path in this flow. Integrators should therefore persist the request ID or idempotency key and return the original result on repeated signed calls.",
          "HMAC authenticates the body but replay resistance depends on the receiver checking timestamp, nonce, and its own request ledger. Secrets also need rotation and secure storage. Finally, fairness policy is a business choice; operators should test whether one daily debit matches their economics.",
          "The design’s strength is honest state. Validation happens before charge, charge produces a refundable receipt, dispatch is signed, and timeout does not masquerade as failure. That gives agents and operators a recoverable protocol for the messy interval between “request sent” and “side effect definitely happened.”"
        ]
      }
    ],
    "sourceLinks": [
      {
        "label": "Action execution state machine",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/routes/actions.ts"
      },
      {
        "label": "Fair, refundable action charging",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/billing/charge-action.ts"
      },
      {
        "label": "Shared HMAC dispatcher",
        "href": "https://github.com/ocque41/relay/blob/5f8f116bb1cd82db789e165c2e22bd5566cfe952/src/server/providers/hmac.ts"
      }
    ],
    "relatedSlugs": [
      "relay-deterministic-intent-resolution",
      "relay-human-agent-authentication-split",
      "relay-workspace-pinning-and-credential-envelopes"
    ],
    "category": "Relay",
    "project": "relay",
    "date": "2026-06-23",
    "excerpt": "Calling a third-party action on behalf of a user crosses several boundaries at once: identity, schema validation, provider reliability, billing, retries, and auditability. Relay’s action path makes that sequence explicit. It validates before dispatch, binds a.",
    "status": "published",
    "tags": [
      "Relay",
      "Public source review",
      "Reject invalid work before spending quota"
    ],
    "readingTime": 0,
    "placement": "build-business",
    "visual": {
      "variant": "split-horizon",
      "alt": "Dither study for Idempotent Action Dispatch and Fair Billing"
    },
    "verifiedAt": "2026-07-16"
  }
] as const satisfies readonly Post[];
