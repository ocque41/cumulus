import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260716000000_blog_notifications.sql",
  ),
  "utf8",
);
const advisorHardening = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260716150000_blog_notifications_advisor_hardening.sql",
  ),
  "utf8",
);
const rlsPerformance = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260716153000_blog_notification_rls_performance.sql",
  ),
  "utf8",
);

describe("notification migration contract", () => {
  it("keeps addresses out of public tables and uses auth user ownership", () => {
    expect(migration).toContain("user_id uuid primary key references auth.users (id)");
    expect(migration).toContain("user_id uuid not null references auth.users (id)");
    expect(migration).not.toMatch(/^\s*(?:recipient_)?email\s+/im);
    expect(migration).toContain("(select auth.uid()) = user_id");
    expect(migration).toContain("auth.jwt() ->> 'is_anonymous'");
  });

  it("uses the settled status contract, RLS, and explicit least-privilege grants", () => {
    expect(migration).toContain("status in ('pending', 'active', 'unsubscribed')");
    expect(migration).toContain(
      "status in ('processing', 'retryable', 'sent', 'failed', 'cancelled')",
    );
    expect(migration).toContain(
      "alter table public.blog_notification_subscriptions enable row level security",
    );
    expect(migration).toContain(
      "alter table public.blog_notification_deliveries enable row level security",
    );
    expect(migration).toContain("from public, anon, authenticated, service_role");
    expect(migration).toContain("grant update (user_id, status)");
    expect(migration).not.toMatch(/grant .*blog_notification_deliveries\s+to authenticated/i);
    expect(migration).not.toMatch(/grant .*blog_notification_dispatch_gate\s+to authenticated/i);
  });

  it("enforces immutable post/user identity and bounded atomic retry leases", () => {
    expect(migration).toContain(
      "constraint blog_notification_deliveries_post_user_key unique (post_slug, user_id)",
    );
    expect(migration).toContain("notification delivery identity is immutable");
    expect(migration).toContain("attempt_count between 1 and 5");
    expect(migration).toContain("interval '10 minutes'");
    expect(migration).toContain("interval '23 hours'");
    expect(migration).toContain("on conflict (post_slug, user_id) do nothing");
    expect(migration).toContain("for update;");
    expect(migration).toContain("claim_blog_notification_delivery");
    expect(migration).toContain("start_blog_notification_provider_attempt");
    expect(migration).toContain("complete_blog_notification_delivery");
    expect(migration).toContain("record_blog_notification_delivery_failure");
    expect(migration).toContain("provider_idempotency_key text not null");
    expect(migration).toContain("reserve_blog_notification_dispatch_slot");
    expect(migration).toContain("interval '550 milliseconds'");
  });

  it("ties retries to one consent generation and cancels queued unsubscribe work", () => {
    expect(migration).toContain("consent_confirmed_at timestamptz not null");
    expect(migration).toContain("consent_version text not null");
    expect(migration).toContain("new-post-email-v1");
    expect(migration).toContain(
      "current_delivery.consent_confirmed_at <> active_consent_at",
    );
    expect(migration).toContain(
      "subscription.confirmed_at = delivery.consent_confirmed_at",
    );
    expect(migration).toContain("unsubscribe_blog_notifications");
    expect(migration).toContain("for update;");
    expect(migration).toContain("delivery.consent_confirmed_at = expected_consent_at");
    expect(migration).toContain("subscription.status = 'unsubscribed'");
    expect(migration).not.toContain("cancel_blog_notification_pending_deliveries");
    expect(migration).toContain("delivery.provider_started_at is null");
  });

  it("makes the server-only tables and delivery foreign-key index explicit", () => {
    expect(advisorHardening).toContain(
      "create index blog_notification_deliveries_user_id_idx",
    );
    expect(advisorHardening).toContain("to anon, authenticated");
    expect(advisorHardening.match(/using \(false\)/g)).toHaveLength(2);
    expect(advisorHardening.match(/with check \(false\)/g)).toHaveLength(2);
    expect(advisorHardening).not.toMatch(/grant\s+/i);
  });

  it("caches Supabase Auth helpers without changing subscription policy semantics", () => {
    const policyNames = [
      "Users can read their own notification subscription",
      "Users can create their own notification subscription",
      "Users can update their own notification subscription",
    ];

    for (const policyName of policyNames) {
      expect(rlsPerformance).toContain(`drop policy if exists "${policyName}"`);
      expect(rlsPerformance).toContain(`create policy "${policyName}"`);
    }

    expect(rlsPerformance.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(4);
    expect(rlsPerformance.match(/\(select auth\.jwt\(\)\)/g)).toHaveLength(4);
    expect(rlsPerformance).not.toMatch(/(?<!select )auth\.(?:uid|jwt)\(\)/);
    expect(rlsPerformance.match(/to authenticated/g)).toHaveLength(3);
    expect(rlsPerformance).toContain("for select");
    expect(rlsPerformance).toContain("for insert");
    expect(rlsPerformance).toContain("for update");
    expect(rlsPerformance.match(/with check \(/g)).toHaveLength(2);
    expect(rlsPerformance.match(/not coalesce\(/g)).toHaveLength(4);
  });
});
