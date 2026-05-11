# Supabase Migration Governance

The public repository owns a clean, self-hostable migration baseline.

## Rules

- Migrations must run on an empty Supabase-compatible project.
- Migrations must not reference private legacy tables, production tenants, or provider-specific project IDs.
- Additive migrations are preferred after the public baseline.
- Data-only resets must use placeholders and local/demo domains only.
- Production-only schema changes belong in the private production overlay.

## Current Baseline

- `20260512000000_public_baseline.sql`

This baseline creates the public app tables for profiles, product registry, UI preferences, auth telemetry, optional Shopify sync, and basic analytics.
