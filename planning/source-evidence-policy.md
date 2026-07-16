# Project and GitHub source evidence policy

This policy applies whenever Cumulus content is derived from local projects, Git history, GitHub repositories, releases, issues, documentation, or runtime artifacts.

## Evidence classes

Prefer sources in this order:

1. Current project source, tests, manifests, migrations, and user-facing documentation.
2. Current public GitHub repository pages, API responses, release records, and commit history.
3. Maintainer-authored public documentation linked from the repository.
4. Secondary context only when it is clearly labeled and a primary source is unavailable.

A local filename or plausible implementation is not enough to establish a public claim. A passing narrow test proves only what that test covers. A plan, comment, draft, or previous assistant statement is not implementation evidence.

## Research workflow

1. **Set the scope.** Use an explicit project allowlist under a configurable `PROJECTS_ROOT`. Do not crawl the whole machine.
2. **Inspect read-only.** Read the owning documentation, manifest, focused source, tests, Git remote, and relevant commit history. Do not run setup scripts or project code merely to collect content facts.
3. **Classify visibility.** Confirm whether each repository and cited page is public. Treat unknown visibility as private.
4. **Map identity.** Verify that the local remote matches the intended public GitHub repository. Do not infer ownership from a folder name.
5. **Refresh live facts.** Use GitHub's official API, CLI, or repository pages for repository visibility, default branch, topics, current release, and recent activity. Record the UTC retrieval time.
6. **Create a claim ledger.** Before drafting, list each material claim, its primary source, retrieval date, confidence, and whether it is safe to publish.
7. **Draft from supported claims.** Paraphrase in original language. Use short quotations only when necessary and attribute them directly.
8. **Validate links and claims.** Resolve every backlink, compare each factual sentence with its ledger entry, and remove anything unsupported or too private.

## Claim ledger template

Use one ledger per post or one table with a post identifier column.

| Post | Claim | Primary source | Retrieved UTC | Public? | Confidence | Publication note |
| --- | --- | --- | --- | --- | --- | --- |
| `example-slug` | Concise factual claim | Public source URL or public-safe repo path | `YYYY-MM-DDThh:mm:ssZ` | Yes/No | High/Medium/Low | Explain limits or omit |

Do not place credentials, private URLs, private repository names, customer data, real subscriber addresses, local usernames, or absolute machine paths in the ledger.

## Publication rules

- Backlink only to public HTTPS pages. Prefer a repository root, stable documentation page, tagged release, or commit permalink over a mutable search result.
- Distinguish observed facts from interpretation. Use wording such as “the current manifest declares” instead of implying deployed behavior.
- Put dates on live facts that can drift. Recheck them before release.
- Do not claim production use, security, performance, scale, adoption, or reliability without direct evidence matching that scope.
- Do not expose a repository merely because it exists locally or has a configured remote.
- Do not publish private issue titles, branch names, commit messages, internal hostnames, dashboards, build logs, screenshots with user data, or proprietary source.
- Do not convert memory, chat context, or an agent handoff into a public citation.
- Keep excerpts within the source's license and copyright terms. Original analysis should dominate every post.

## Robust post acceptance criteria

Each published post must have:

- a unique stable slug, title, date, excerpt, project label, and explicit published state;
- substantive context, a concrete problem, the selected approach, meaningful tradeoffs, and a bounded verification or outcome section;
- at least one direct public primary-source backlink, with more where different claims need different evidence;
- related-post links that resolve to other published posts;
- no unsupported superlatives or claims about private or live production state;
- no copied project README presented as original prose;
- a route that renders without authentication and exposes its sources to readers.

The corpus must contain at least twenty published posts mixed across projects. Count only posts that pass all acceptance criteria; drafts and placeholder entries do not count.

## Evidence retention

Keep public-safe ledgers and verification summaries in an approved repository artifact location. Keep private deployment evidence in the private production overlay. Public evidence must be reproducible without privileged access; private evidence may prove a gate but must be summarized without exposing its values.
