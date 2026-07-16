import { describe, expect, it, vi } from "vitest";
import { NotificationStoreError, SupabaseNotificationStore } from "./supabase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DELIVERY_ID = "22222222-2222-4222-8222-222222222222";
const LEASE_TOKEN = "33333333-3333-4333-8333-333333333333";
const SERVICE_KEY = "service-role-key".repeat(4);

function store(fetcher: typeof fetch) {
  return new SupabaseNotificationStore({
    supabaseUrl: "https://project.supabase.co",
    serviceRoleKey: SERVICE_KEY,
    fetcher,
    now: () => new Date("2026-07-16T12:00:00.000Z"),
  });
}

describe("Supabase notification adapter", () => {
  it("lists only active confirmed subscriptions with legacy service-role headers", async () => {
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify([{ user_id: USER_ID }]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )) as unknown as typeof fetch;
    const result = await store(fetcher).listActiveConfirmedSubscriptions();

    expect(result).toEqual([{ userId: USER_ID }]);
    const [input, init] = vi.mocked(fetcher).mock.calls[0];
    const url = new URL(String(input));
    expect(url.searchParams.get("status")).toBe("eq.active");
    expect(url.searchParams.get("confirmed_at")).toBe("not.is.null");
    expect(url.searchParams.get("unsubscribed_at")).toBe("is.null");
    expect(url.searchParams.get("order")).toBe("user_id.asc");
    expect(url.searchParams.get("limit")).toBe("500");
    const headers = new Headers(init?.headers);
    expect(headers.get("apikey")).toBe(SERVICE_KEY);
    expect(headers.get("authorization")).toBe(`Bearer ${SERVICE_KEY}`);
    const rangeHeader = Object.entries(
      init?.headers as Record<string, string>,
    ).find(([name]) => name.toLowerCase() === "range");
    expect(rangeHeader?.[1]).toBe("0-499");
    expect(url.toString()).not.toContain(SERVICE_KEY);
  });

  it("uses a user-id keyset so concurrent removals cannot shift later pages", async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) => ({
      user_id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    }));
    const finalUser = "99999999-9999-4999-8999-999999999999";
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input));
      return new Response(JSON.stringify(
        url.searchParams.has("user_id")
          ? [{ user_id: finalUser }]
          : firstPage,
      ), { status: 200, headers: { "Content-Type": "application/json" } });
    });

    const result = await store(fetcher).listActiveConfirmedSubscriptions();
    expect(result).toHaveLength(501);
    const secondUrl = new URL(String(fetcher.mock.calls[1][0]));
    expect(secondUrl.searchParams.get("user_id")).toBe(
      `gt.${firstPage[499].user_id}`,
    );
    expect(secondUrl.searchParams.get("limit")).toBe("500");
  });

  it("uses new Supabase secret keys only as apikey values", async () => {
    const secretKey = `sb_secret_${"s".repeat(48)}`;
    const fetcher = vi.fn(async () => new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;
    const adapter = new SupabaseNotificationStore({
      supabaseUrl: "https://project.supabase.co",
      serviceRoleKey: secretKey,
      fetcher,
    });

    await adapter.listActiveConfirmedSubscriptions();
    const [, init] = vi.mocked(fetcher).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("apikey")).toBe(secretKey);
    expect(headers.get("authorization")).toBeNull();
  });

  it("uses Auth Admin as the authoritative confirmed recipient source", async () => {
    const confirmedFetcher = vi.fn(async () => new Response(JSON.stringify({
      id: USER_ID,
      email: "reader@example.com",
      email_confirmed_at: "2026-07-15T00:00:00.000Z",
      is_anonymous: false,
      banned_until: null,
    }), { status: 200 })) as unknown as typeof fetch;
    await expect(store(confirmedFetcher).getAuthoritativeRecipient(USER_ID)).resolves.toEqual({
      email: "reader@example.com",
      emailConfirmedAt: "2026-07-15T00:00:00.000Z",
    });
    expect(String(vi.mocked(confirmedFetcher).mock.calls[0][0])).toContain(
      `/auth/v1/admin/users/${USER_ID}`,
    );

    const unconfirmedFetcher = vi.fn(async () => new Response(JSON.stringify({
      id: USER_ID,
      email: "reader@example.com",
      email_confirmed_at: null,
    }), { status: 200 })) as unknown as typeof fetch;
    await expect(store(unconfirmedFetcher).getAuthoritativeRecipient(USER_ID)).resolves.toBeNull();
  });

  it("parses an atomic leased claim and never sends recipient data in its RPC body", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify([{
      disposition: "claimed",
      delivery_id: DELIVERY_ID,
      delivery_lease_token: LEASE_TOKEN,
      delivery_attempt_count: 2,
      token_expires_at: "2027-01-12T12:00:00.000Z",
    }]), { status: 200 })) as unknown as typeof fetch;
    const result = await store(fetcher).claimDelivery(
      "hello-world",
      USER_ID,
      "a".repeat(64),
      `blog-notification-${"b".repeat(64)}`,
    );

    expect(result).toMatchObject({
      disposition: "claimed",
      deliveryId: DELIVERY_ID,
      leaseToken: LEASE_TOKEN,
      attemptCount: 2,
    });
    const [input, init] = vi.mocked(fetcher).mock.calls[0];
    expect(String(input).endsWith("/rest/v1/rpc/claim_blog_notification_delivery")).toBe(true);
    expect(JSON.parse(String(init?.body))).toEqual({
      requested_post_slug: "hello-world",
      requested_user_id: USER_ID,
      requested_content_hash: "a".repeat(64),
      requested_provider_idempotency_key:
        `blog-notification-${"b".repeat(64)}`,
    });
    expect(String(init?.body)).not.toContain("reader@example.com");
  });

  it("uses lease-bound RPCs for dispatch reservation, provider start, completion, and failure", async () => {
    const responses = [
      "2026-07-16T12:00:00.550Z",
      true,
      true,
      "retryable",
    ];
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify(responses.shift()),
      { status: 200 },
    )) as unknown as typeof fetch;
    const adapter = store(fetcher);

    await expect(
      adapter.reserveDispatchSlot(DELIVERY_ID, LEASE_TOKEN),
    ).resolves.toEqual(new Date("2026-07-16T12:00:00.550Z"));
    await expect(adapter.startProviderAttempt(DELIVERY_ID, LEASE_TOKEN)).resolves.toBe(true);
    await expect(
      adapter.completeDelivery(DELIVERY_ID, LEASE_TOKEN, "provider-id"),
    ).resolves.toBe(true);
    await expect(adapter.recordDeliveryFailure({
      deliveryId: DELIVERY_ID,
      leaseToken: LEASE_TOKEN,
      failureCode: "resend_http_503",
      retryable: true,
      retryAfterSeconds: 60,
    })).resolves.toBe("retryable");
    const paths = vi.mocked(fetcher).mock.calls.map(([input]) => String(input));
    expect(paths).toEqual([
      "https://project.supabase.co/rest/v1/rpc/reserve_blog_notification_dispatch_slot",
      "https://project.supabase.co/rest/v1/rpc/start_blog_notification_provider_attempt",
      "https://project.supabase.co/rest/v1/rpc/complete_blog_notification_delivery",
      "https://project.supabase.co/rest/v1/rpc/record_blog_notification_delivery_failure",
    ]);
  });

  it("unsubscribes idempotently and cancels pending leased work", async () => {
    const fetcher = vi.fn(async () => new Response("2", {
      status: 200,
    })) as unknown as typeof fetch;
    await store(fetcher).unsubscribe(USER_ID);

    const [input, init] = vi.mocked(fetcher).mock.calls[0];
    expect(String(input)).toBe(
      "https://project.supabase.co/rest/v1/rpc/unsubscribe_blog_notifications",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      requested_user_id: USER_ID,
    });
  });

  it("maps provider messages and processes only bounded suppression events", async () => {
    const responses = [USER_ID, "suppressed"];
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify(responses.shift()),
      { status: 200 },
    )) as unknown as typeof fetch;
    const adapter = store(fetcher);

    await expect(adapter.findDeliveryOwner("provider-message-id")).resolves.toBe(
      USER_ID,
    );
    await expect(adapter.processProviderSuppressionEvent({
      providerEventId: "msg_provider-event-id",
      providerMessageId: "provider-message-id",
      eventType: "email.complained",
      userId: USER_ID,
      recipientMatches: true,
    })).resolves.toBe("suppressed");

    expect(vi.mocked(fetcher).mock.calls.map(([input]) => String(input))).toEqual([
      "https://project.supabase.co/rest/v1/rpc/find_blog_notification_delivery_owner",
      "https://project.supabase.co/rest/v1/rpc/process_blog_notification_resend_event",
    ]);
    expect(JSON.parse(String(vi.mocked(fetcher).mock.calls[1][1]?.body))).toEqual({
      requested_provider_event_id: "msg_provider-event-id",
      requested_provider_message_id: "provider-message-id",
      requested_event_type: "email.complained",
      requested_user_id: USER_ID,
      requested_recipient_matches: true,
    });
  });

  it("rejects malformed provider identifiers before making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const adapter = store(fetcher);
    await expect(adapter.findDeliveryOwner("bad/id")).rejects.toMatchObject({
      code: "delivery_owner_invalid_input",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("applies a deadline and redacts transport failures", async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      throw new Error("reader@example.com timed out");
    });
    await expect(
      store(fetcher).listActiveConfirmedSubscriptions(),
    ).rejects.toMatchObject({
      name: "NotificationStoreError",
      code: "subscription_list_unavailable",
    });
  });

  it("turns upstream bodies into stable redacted errors", async () => {
    const fetcher = vi.fn(async () => new Response(
      "reader@example.com and a private provider response",
      { status: 500 },
    )) as unknown as typeof fetch;
    let error: unknown;
    try {
      await store(fetcher).listActiveConfirmedSubscriptions();
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(NotificationStoreError);
    expect(String(error)).not.toContain("reader@example.com");
    expect(String(error)).toContain("subscription_list_failed");
  });
});
