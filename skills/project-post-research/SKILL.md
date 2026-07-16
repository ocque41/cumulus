---
name: project-post-research
description: Research authorized local software projects and their public GitHub repositories, build claim-to-source ledgers, and draft substantial public Cumulus project posts with stable source and related-post backlinks. Use when inventorying projects for the Cumulus log, checking project claims against current GitHub evidence, creating or revising project posts, validating a mixed-project post corpus, or auditing posts for unsupported, private, stale, or broken-source content.
---

# Project Post Research

Create public, source-grounded posts without exposing local or private project details. Read [`planning/source-evidence-policy.md`](../../planning/source-evidence-policy.md) before collecting evidence.

## Workflow

### 1. Bound the research scope

1. Obtain or derive an explicit allowlist under a configurable `PROJECTS_ROOT`.
2. Keep inspection read-only unless the user separately requests project changes.
3. Treat unknown repository visibility, ownership, or publication safety as private until verified.
4. Record assumptions before drafting.

### 2. Inspect local project evidence

Read the project's public-facing documentation, manifest, focused source, tests, Git remote, and relevant history. Use targeted searches rather than broad machine scans. Do not execute setup scripts, applications, migrations, deployment commands, or provider tools merely to learn about the project.

Extract candidate claims about architecture, behavior, design decisions, and verification. Do not publish local absolute paths, private remotes, internal branches, credentials, customer data, issue notes, or source that is not already public.

### 3. Verify the public repository

Match the local remote to the intended public GitHub repository. Use current GitHub primary sources to verify mutable facts such as visibility, default branch, current release, topics, and activity. Record the source URL and UTC retrieval time. Do not infer GitHub ownership from a local folder name.

Prefer stable repository, documentation, release, tag, or commit permalinks. Do not cite search-result pages or private URLs.

### 4. Build a claim ledger

For every material factual claim, record:

- post slug;
- claim text;
- direct primary source;
- retrieval date;
- public/private classification;
- confidence and known limit.

Remove claims that lack public evidence or that reveal private operational context. Distinguish what code declares, what tests prove, and what is actually verified in production.

### 5. Draft an original post

Give the post a stable slug, title, date, excerpt, project label, published state, source backlinks, and related published slugs. Write original analysis with:

1. context and motivation;
2. a concrete technical or design problem;
3. the chosen approach;
4. meaningful alternatives and tradeoffs;
5. verification, limitations, or current status;
6. direct public primary-source backlinks.

Do not copy a README into prose, invent outcomes, or use unsupported superlatives. Make uncertainty visible.

### 6. Validate the corpus

Require at least twenty published posts across multiple projects for the complete Cumulus corpus. Count only posts that meet the acceptance criteria in the source policy. Mechanically check:

- unique slugs and valid dates;
- draft exclusion from public selectors;
- route resolution for every published slug;
- public HTTPS source links;
- related links that resolve to other published posts;
- meaningful project distribution;
- absence of local paths, secrets, internal URLs, and placeholder claims.

Manually review depth and claim support; structural tests cannot prove either.

### 7. Handoff evidence

Report the projects inspected, public repositories verified, post slugs created or revised, exact checks run, unsupported claims removed, and requirements still unproven. Keep private evidence in the private overlay and summarize it without exposing values. Never claim current GitHub or production state from stale evidence.
