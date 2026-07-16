import { describe, expect, it, vi } from "vitest";
import { createPublishHandler, publishPostNotifications } from "./publish";
import type {
  AuthoritativeRecipient,
  DeliveryClaim,
  MailResult,
  NotificationEmail,
  NotificationMailer,
  NotificationStore,
  NotificationSubscription,
  PublishablePost,
} from "./types";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const DELIVERY_ID = "33333333-3333-4333-8333-333333333333";
const LEASE_TOKEN = "44444444-4444-4444-8444-444444444444";
const PUBLISH_SECRET = "p".repeat(32);
const UNSUBSCRIBE_SECRET = "u".repeat(32);
const POST: PublishablePost = {
  slug: "hello-world",
  title: "Hello world",
  excerpt: "A new log.",
  date: "2026-07-16",
};

class FakeStore implements NotificationStore {
  subscriptions: NotificationSubscription[] = [{ userId: USER_ID }];
  recipients = new Map<string, AuthoritativeRecipient | null>([[
    USER_ID,
    { email: "reader@example.com", emailConfirmedAt: "2026-07-15T00:00:00Z" },
  ]]);
  claims: Array<{
    postSlug: string;
    userId: string;
    contentHash: string;
    providerIdempotencyKey: string;
  }> = [];
  completions: string[] = [];
  failures: Array<{ failureCode: string; retryable: boolean }> = [];
  cancellations: string[] = [];
  claimImpl: () => Promise<DeliveryClaim> = async () => ({
    disposition: "claimed",
    deliveryId: DELIVERY_ID,
    leaseToken: LEASE_TOKEN,
    attemptCount: 1,
    unsubscribeTokenExpiresAt: new Date("2030-01-01T00:00:00Z"),
  });
  startImpl: () => Promise<boolean> = async () => true;
  reserveImpl: () => Promise<Date | null> = async () => new Date(0);
  completeImpl: () => Promise<boolean> = async () => true;
  failureImpl: () => Promise<"retryable" | "failed" | null> = async () => "failed";

  async listActiveConfirmedSubscriptions() {
    return this.subscriptions;
  }

  async getAuthoritativeRecipient(userId: string) {
    return this.recipients.get(userId) ?? null;
  }

  async claimDelivery(
    postSlug: string,
    userId: string,
    contentHash: string,
    providerIdempotencyKey: string,
  ) {
    this.claims.push({
      postSlug,
      userId,
      contentHash,
      providerIdempotencyKey,
    });
    return this.claimImpl();
  }

  async reserveDispatchSlot() {
    return this.reserveImpl();
  }

  async startProviderAttempt() {
    return this.startImpl();
  }

  async completeDelivery(deliveryId: string) {
    this.completions.push(deliveryId);
    return this.completeImpl();
  }

  async recordDeliveryFailure(input: {
    failureCode: string;
    retryable: boolean;
  }) {
    this.failures.push(input);
    return this.failureImpl();
  }

  async cancelDelivery(deliveryId: string) {
    this.cancellations.push(deliveryId);
    return true;
  }

  async unsubscribe() {}
}

class FakeMailer implements NotificationMailer {
  messages: NotificationEmail[] = [];
  result: MailResult = { ok: true, providerMessageId: "provider-id" };

  async send(message: NotificationEmail): Promise<MailResult> {
    this.messages.push(message);
    return this.result;
  }
}

async function publish(store: FakeStore, mailer: FakeMailer, dryRun = false) {
  return publishPostNotifications({
    post: POST,
    dryRun,
    store,
    mailer,
    siteOrigin: "https://cumulush.com",
    unsubscribeSecret: UNSUBSCRIBE_SECRET,
    postalAddress: "Cumulus Test, 42 Cloud Avenue, Madrid, Spain",
    senderIdentity: "Cumulus <hi@cumulush.com>",
    sleep: async () => {},
  });
}

describe("publish notification service", () => {
  it("dry-runs only authoritative confirmed recipients without claims or sends", async () => {
    const store = new FakeStore();
    store.subscriptions = [{ userId: USER_ID }, { userId: OTHER_USER_ID }];
    store.recipients.set(OTHER_USER_ID, null);
    const mailer = new FakeMailer();
    const result = await publish(store, mailer, true);

    expect(result).toMatchObject({
      dryRun: true,
      subscriptions: 2,
      eligible: 1,
      claimed: 0,
      sent: 0,
      skipped: 1,
    });
    expect(store.claims).toHaveLength(0);
    expect(mailer.messages).toHaveLength(0);
  });

  it("sends only once across repeated publication requests", async () => {
    const store = new FakeStore();
    const mailer = new FakeMailer();
    let sent = false;
    store.claimImpl = async () => sent
      ? {
        disposition: "sent",
        deliveryId: DELIVERY_ID,
        leaseToken: null,
        attemptCount: 1,
        unsubscribeTokenExpiresAt: new Date("2030-01-01T00:00:00Z"),
      }
      : {
        disposition: "claimed",
        deliveryId: DELIVERY_ID,
        leaseToken: LEASE_TOKEN,
        attemptCount: 1,
        unsubscribeTokenExpiresAt: new Date("2030-01-01T00:00:00Z"),
      };
    store.completeImpl = async () => {
      sent = true;
      return true;
    };

    const first = await publish(store, mailer);
    const second = await publish(store, mailer);
    expect(first.sent).toBe(1);
    expect(second).toMatchObject({ sent: 0, skipped: 1 });
    expect(mailer.messages).toHaveLength(1);
    expect(mailer.messages[0].idempotencyKey).not.toContain("reader@example.com");
    expect(store.claims[0].providerIdempotencyKey).toBe(
      mailer.messages[0].idempotencyKey,
    );
    expect(mailer.messages[0].browserUnsubscribeUrl).toContain("/unsubscribe#token=");
    expect(mailer.messages[0].browserUnsubscribeUrl).not.toContain("?token=");
    expect(mailer.messages[0].oneClickUnsubscribeUrl).toContain(
      "/api/notifications/unsubscribe?token=",
    );
  });

  it("allows only one provider submission across concurrent publication requests", async () => {
    const store = new FakeStore();
    const mailer = new FakeMailer();
    let claimed = false;
    store.claimImpl = async () => {
      if (claimed) {
        return {
          disposition: "in_progress",
          deliveryId: DELIVERY_ID,
          leaseToken: null,
          attemptCount: 1,
          unsubscribeTokenExpiresAt: new Date("2030-01-01T00:00:00Z"),
        };
      }
      claimed = true;
      await Promise.resolve();
      return {
        disposition: "claimed",
        deliveryId: DELIVERY_ID,
        leaseToken: LEASE_TOKEN,
        attemptCount: 1,
        unsubscribeTokenExpiresAt: new Date("2030-01-01T00:00:00Z"),
      };
    };

    const [first, second] = await Promise.all([
      publish(store, mailer),
      publish(store, mailer),
    ]);

    expect(first.sent + second.sent).toBe(1);
    expect(first.skipped + second.skipped).toBe(1);
    expect(mailer.messages).toHaveLength(1);
  });

  it("rechecks consent atomically before provider submission", async () => {
    const store = new FakeStore();
    const mailer = new FakeMailer();
    store.startImpl = async () => false;
    store.failureImpl = async () => null;
    const result = await publish(store, mailer);

    expect(result).toMatchObject({ claimed: 1, sent: 0, skipped: 1 });
    expect(store.cancellations).toEqual([]);
    expect(mailer.messages).toHaveLength(0);
  });

  it("records retryable provider failures and returns aggregate redacted data", async () => {
    const store = new FakeStore();
    const mailer = new FakeMailer();
    mailer.result = {
      ok: false,
      failureCode: "resend_http_503",
      retryable: true,
      retryAfterSeconds: 60,
    };
    store.failureImpl = async () => "retryable";
    const result = await publish(store, mailer);

    expect(result).toMatchObject({ claimed: 1, retryable: 1, sent: 0 });
    expect(store.failures).toHaveLength(1);
    expect(store.failures[0]).toMatchObject({
      failureCode: "resend_http_503",
      retryable: true,
    });
    expect(JSON.stringify(result)).not.toContain("reader@example.com");
    expect(JSON.stringify(result)).not.toContain(USER_ID);
  });

  it("paces submissions, starts consent checks immediately before send, and continues after partial failure", async () => {
    const store = new FakeStore();
    store.subscriptions = [{ userId: USER_ID }, { userId: OTHER_USER_ID }];
    store.recipients.set(OTHER_USER_ID, {
      email: "other-reader@example.com",
      emailConfirmedAt: "2026-07-15T00:00:00Z",
    });
    store.failureImpl = async () => "retryable";
    const events: string[] = [];
    const clock = new Date("2026-07-16T12:00:00.000Z");
    let reservations = 0;
    store.reserveImpl = async () => {
      events.push("reserve");
      const reservedAt = new Date(clock.getTime() + (reservations * 550));
      reservations += 1;
      return reservedAt;
    };
    store.startImpl = async () => {
      events.push("start");
      return true;
    };
    let sends = 0;
    const mailer: NotificationMailer = {
      async send() {
        events.push("send");
        sends += 1;
        return sends === 1
          ? {
            ok: false,
            failureCode: "resend_http_503",
            retryable: true,
            retryAfterSeconds: 60,
          }
          : { ok: true, providerMessageId: "provider-second" };
      },
    };

    const result = await publishPostNotifications({
      post: POST,
      dryRun: false,
      store,
      mailer,
      siteOrigin: "https://cumulush.com",
      unsubscribeSecret: UNSUBSCRIBE_SECRET,
      postalAddress: "Cumulus Test, 42 Cloud Avenue, Madrid, Spain",
      senderIdentity: "Cumulus <hi@cumulush.com>",
      sleep: async (milliseconds) => {
        expect(milliseconds).toBe(550);
        events.push("sleep");
      },
      now: () => clock,
    });

    expect(events).toEqual([
      "reserve",
      "start",
      "send",
      "reserve",
      "sleep",
      "start",
      "send",
    ]);
    expect(result).toMatchObject({
      eligible: 2,
      claimed: 2,
      retryable: 1,
      sent: 1,
      failed: 0,
      deferred: 1,
      hasMore: true,
      incomplete: true,
    });
  });

  it("caps provider attempts at forty and exposes safe continuation state", async () => {
    const store = new FakeStore();
    store.subscriptions = Array.from({ length: 41 }, (_, index) => ({
      userId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    }));
    store.recipients = new Map(store.subscriptions.map(({ userId }, index) => [
      userId,
      {
        email: `reader-${index}@example.com`,
        emailConfirmedAt: "2026-07-15T00:00:00Z",
      },
    ]));
    const mailer = new FakeMailer();

    const result = await publish(store, mailer);
    expect(mailer.messages).toHaveLength(40);
    expect(result).toMatchObject({
      sent: 40,
      hasMore: true,
      incomplete: true,
    });
  });

  it("defers a far-future global slot without terminal cancellation", async () => {
    const store = new FakeStore();
    const mailer = new FakeMailer();
    const wallClock = new Date("2026-07-16T12:00:00.000Z");
    let runtime = 0;
    store.reserveImpl = async () => {
      runtime = 30_000;
      return new Date(wallClock.getTime() + 60_000);
    };
    store.failureImpl = async () => "retryable";

    const result = await publishPostNotifications({
      post: POST,
      dryRun: false,
      store,
      mailer,
      siteOrigin: "https://cumulush.com",
      unsubscribeSecret: UNSUBSCRIBE_SECRET,
      postalAddress: "Cumulus Test, 42 Cloud Avenue, Madrid, Spain",
      senderIdentity: "Cumulus <hi@cumulush.com>",
      now: () => wallClock,
      runtimeNow: () => runtime,
      sleep: async () => {
        throw new Error("far-future slot must not sleep");
      },
    });

    expect(mailer.messages).toHaveLength(0);
    expect(store.cancellations).toHaveLength(0);
    expect(store.failures).toContainEqual(expect.objectContaining({
      failureCode: "runtime_budget_deferred",
      retryable: true,
    }));
    expect(result).toMatchObject({
      retryable: 1,
      deferred: 1,
      hasMore: true,
      incomplete: true,
      retryAfterSeconds: 61,
    });
  });

  it("stops before another recipient when the preflight runtime window is gone", async () => {
    const store = new FakeStore();
    store.subscriptions = [{ userId: USER_ID }, { userId: OTHER_USER_ID }];
    store.recipients.set(OTHER_USER_ID, {
      email: "other-reader@example.com",
      emailConfirmedAt: "2026-07-15T00:00:00Z",
    });
    let runtime = 0;
    const mailer: NotificationMailer = {
      async send() {
        runtime = 15_000;
        return { ok: true, providerMessageId: "provider-id" };
      },
    };

    const result = await publishPostNotifications({
      post: POST,
      dryRun: false,
      store,
      mailer,
      siteOrigin: "https://cumulush.com",
      unsubscribeSecret: UNSUBSCRIBE_SECRET,
      postalAddress: "Cumulus Test, 42 Cloud Avenue, Madrid, Spain",
      senderIdentity: "Cumulus <hi@cumulush.com>",
      runtimeNow: () => runtime,
      sleep: async () => {},
    });

    expect(result).toMatchObject({
      sent: 1,
      hasMore: true,
      incomplete: true,
      retryAfterSeconds: 1,
    });
    expect(store.claims).toHaveLength(1);
  });

  it("fails closed on changed content for an existing slug", async () => {
    const store = new FakeStore();
    const mailer = new FakeMailer();
    store.claimImpl = async () => ({
      disposition: "content_mismatch",
      deliveryId: DELIVERY_ID,
      leaseToken: null,
      attemptCount: 1,
      unsubscribeTokenExpiresAt: new Date("2030-01-01T00:00:00Z"),
    });
    const result = await publish(store, mailer);
    expect(result).toMatchObject({ conflicts: 1, sent: 0, skipped: 1 });
    expect(mailer.messages).toHaveLength(0);
  });
});

describe("publish Web handler", () => {
  function setup(publishResult?: () => Promise<ReturnType<typeof baseResult>>) {
    const publish = vi.fn(publishResult ?? (async () => baseResult()));
    const logger = { info: vi.fn(), warn: vi.fn() };
    const handler = createPublishHandler({
      publishSecret: PUBLISH_SECRET,
      getPublishedPostBySlug: (slug) => slug === POST.slug ? POST : undefined,
      publish,
      logger,
    });
    return { handler, publish, logger };
  }

  function baseResult() {
    return {
      ok: true as const,
      dryRun: false,
      subscriptions: 0,
      eligible: 0,
      claimed: 0,
      sent: 0,
      retryable: 0,
      failed: 0,
      conflicts: 0,
      deferred: 0,
      skipped: 0,
      hasMore: false,
      incomplete: false,
      retryAfterSeconds: 0,
    };
  }

  function request(body: string, authorization = `Bearer ${PUBLISH_SECRET}`) {
    return new Request("https://cumulush.com/api/notifications/publish", {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body,
    });
  }

  it("authenticates before parsing and gives every bad credential the same response", async () => {
    const { handler, publish } = setup();
    for (const authorization of ["", "Bearer wrong", "Basic value", "Bearer"]) {
      const response = await handler(request("not json", authorization));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ ok: false, error: "unauthorized" });
    }
    expect(publish).not.toHaveBeenCalled();
  });

  it("accepts only a static published slug and dry-run boolean", async () => {
    const { handler, publish } = setup();
    const response = await handler(request(JSON.stringify({
      slug: POST.slug,
      dryRun: true,
    })));
    expect(response.status).toBe(200);
    expect(publish).toHaveBeenCalledWith(POST, true);

    for (const body of [
      { slug: "draft-post" },
      { slug: POST.slug, title: "client supplied" },
      { slug: "UPPERCASE" },
      { slug: POST.slug, dryRun: "yes" },
    ]) {
      const invalid = await handler(request(JSON.stringify(body)));
      expect([400, 404]).toContain(invalid.status);
    }
  });

  it("redacts upstream errors from responses and logs", async () => {
    const { handler, logger } = setup(async () => {
      throw new Error(`reader@example.com ${USER_ID} provider secret`);
    });
    const response = await handler(request(JSON.stringify({ slug: POST.slug })));
    const responseText = await response.text();
    expect(response.status).toBe(502);
    expect(responseText).not.toContain("reader@example.com");
    expect(responseText).not.toContain(USER_ID);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("reader@example.com");
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(USER_ID);
  });

  it("returns 202 while continuation or delayed retry work remains", async () => {
    const { handler } = setup(async () => ({
      ...baseResult(),
      retryable: 1,
      deferred: 1,
      hasMore: true,
      incomplete: true,
    }));
    const response = await handler(request(JSON.stringify({ slug: POST.slug })));
    expect(response.status).toBe(202);
    expect(response.headers.get("retry-after")).toBe("1");
    await expect(response.json()).resolves.toMatchObject({
      hasMore: true,
      incomplete: true,
    });
  });
});
