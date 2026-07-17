# Project journal and source-evidence policy

This policy applies whenever Cumulus content is derived from first-party project work, local repositories, Git history, public repositories, releases, documentation, or runtime artifacts. It separates a maintainer-authored journal from a reproducible public-source review so a private implementation observation is never disguised as a public citation.

## Publication modes

Every published post must use one of these modes.

### First-party project journal

A first-party journal may describe product intent, an architectural decision, a tradeoff, a locally observed constraint, and the evidence still needed. Its underlying source can remain private. Every rendered article route must identify the entry as a maintainer-authored first-party account and must not imply that an anonymous reader can reproduce the implementation claim. A shared page-level disclosure may carry that mode consistently; body prose should explain the topic-specific evidence limit without repeating one corpus-wide formula.

The current Requisia, Insuja, Hyoka Hanesu, and gy corpus uses this mode. Those articles intentionally have no `sourceLinks`: inventing a public URL, linking an inaccessible repository, or pointing to a mutable page that does not support the claim would be less honest than publishing no source link.

A journal may publish only material that has been approved for the public product narrative. It may not disclose private source text, repository locations, branch or issue names, commit messages, local paths, infrastructure topology, provider identifiers, customer or tenant information, credentials, private URLs, unpublished security findings, or operational evidence. Code-level or deployment-level specifics that are not already approved public facts must be generalized or omitted.

### Public-source review

A public-source review analyzes anonymously reachable source or documentation. It requires at least one direct public primary-source link, and normally uses an immutable commit or release URL. Its claims must remain inside the cited snapshot: source can show that a guard exists in code, but it cannot prove live configuration, adoption, reliability, security closure, or production behavior.

Public-source reviews and first-party journals must not be mixed silently. If an article uses both, each material claim must make its evidence boundary understandable and every public link must support the nearby claim.

## Evidence classes

Use evidence in this order while drafting:

1. Current owning source, focused tests, product contracts, and maintainer documentation.
2. Current public repository pages, releases, and commit history when the repository is confirmed public.
3. Maintainer-authored public documentation linked from the project.
4. Secondary context only when clearly labeled and a primary source is unavailable.

Private evidence can inform a first-party journal, but it remains private evidence. A plan, comment, previous assistant statement, passing narrow test, or plausible filename is not independent proof of implementation or production state.

## Research workflow

1. **Set an allowlist.** Inspect only the projects explicitly in scope under an approved root. Do not crawl the machine.
2. **Inspect read-only for content research.** Read the owning documentation, focused source, tests, manifest, and relevant history. Do not run setup scripts or mutate another project merely to collect facts.
3. **Classify visibility.** Confirm whether every intended citation is anonymously reachable. Treat unknown visibility as private.
4. **Choose the publication mode.** Use a public-source review only when its sources are actually public. Otherwise use a first-party journal and keep the claim at the approved narrative boundary.
5. **Create a claim ledger.** Record the post, project, mode, publication-safe claim boundary, review date, and explicit exclusions before drafting.
6. **Draft original analysis.** Explain the problem, decision, tradeoffs, failure cases, evidence limits, and next proof without copying source or repeating a corpus-wide template.
7. **Run a privacy and claim review.** Remove unsupported precision, private identifiers, internal operational detail, and statements that turn local success into production confidence.
8. **Validate the corpus.** Resolve related posts, verify dates and routes, calculate reading time, and make sure the rendered page communicates the correct evidence mode.

## Claim ledger fields

The public ledger records only safe summaries:

| Post | Project | Mode | Public claim boundary | Reviewed | Explicitly not claimed |
| --- | --- | --- | --- | --- | --- |
| `example-slug` | Example | First-party journal | Maintainer-authored discussion of an approved design boundary | `YYYY-MM-DD` | Public source, deployment, production use, or security closure |

Do not place credentials, private URLs, repository locations, customer data, real subscriber addresses, local usernames, absolute paths, or sanitized copies of private operational values in the ledger.

## Current corpus acceptance criteria

The focused release contains exactly twenty published first-party journals:

- eight Requisia posts;
- seven Insuja posts;
- three Hyoka Hanesu posts;
- two gy posts.

Every published post must have:

- a unique stable slug, title, explicit editorial publication date, excerpt, project label, category, and published state;
- at least 600 body words of original, topic-specific prose across three to six substantial sections;
- a concrete operating problem, selected approach, meaningful tradeoffs, failure handling, and bounded verification or next-evidence section;
- specific tags, a deterministic dither illustration description, and at least two related posts that resolve;
- exactly one corpus-wide `featured` placement, with every other placement rendered by the home or archive experience;
- a clear first-party evidence limit and no unsupported public-source, deployment, production, security, scale, adoption, or reliability claim;
- no invented or inaccessible backlink, no copied private source, and no private identifier;
- a public route that renders without authentication.

Dates describe the editorial publication order chosen for the candidate; they are not an invented development history and do not prove that a route is live. Actual anonymous publication requires current provider and domain evidence after an approved promotion. `verifiedAt` records the date the public copy and its boundary were reviewed; it does not mean the implementation, deployment, or security posture was independently verified.

## Evidence retention

Keep the public-safe ledger and review summaries in this repository. Keep private implementation evidence, deployment records, provider configuration, security material, and recovery proof in the private production overlay. A public journal can honestly report that such evidence is missing or private without exposing it or converting it into a reproducible public claim.
