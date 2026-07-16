# Agent collaboration records

This directory contains public-safe coordination material for the Cumulus rebuild. Root [`AGENTS.md`](../AGENTS.md) remains the governing repository policy.

- [Current rebuild handoff](handoffs/2026-07-16-rebuild.md)
- [Installed third-party skills](third-party-skills.md)
- [Implementation plan](../planning/implementation-plan.md)
- [Completion matrix](../planning/requirement-evidence-matrix.md)

## Handoff contract

Every agent handoff must state:

1. scope and assumptions;
2. files touched;
3. behavior implemented;
4. exact checks run and their results;
5. requirements still unproven;
6. known defects, risks, and conflicting edits;
7. external reads or mutations performed;
8. the narrowest useful next action.

Do not include prompts, memory contents, credentials, subscriber data, private project names, internal URLs, local absolute paths, or raw provider output. A handoff is orientation evidence, not completion evidence; revalidate current files and external state before acting on it.
