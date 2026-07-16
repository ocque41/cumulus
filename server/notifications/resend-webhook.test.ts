import { Webhook } from "svix";
import { describe, expect, it, vi } from "vitest";
import { createResendWebhookHandler } from "./resend-webhook";
import type {
  ProviderSuppressionDisposition,
  ProviderSuppressionStore,
  SafeLogger,
} from "./types";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const EVENT_ID = "msg_provider-event-id";
const MESSAGE_ID = "56761188-7520-42d8-8898-ff6fc54ce618";
const SECRET = `whsec_${Buffer.from("w".repeat(32)).toString("base64")}`;

function payload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: "email.bounced",
    created_at: new Date().toISOString(),
    data: {
      email_id: MESSAGE_ID,
      to: ["reader@example.com"],
      tags: { category: "cumulus_blog_notification" },
    },
    ...overrides,
  });
}

function signedRequest(body: string, options: {
  signatureBody?: string;
  method?: string;
} = {}): Request {
  const timestamp = new Date();
  const verifier = new Webhook(SECRET);
  const signature = verifier.sign(
    EVENT_ID,
    timestamp,
    options.signatureBody ?? body,
  );
  return new Request("https://cumulush.com/api/notifications/resend-webhook", {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      "svix-id": EVENT_ID,
      "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "svix-signature": signature,
    },
    body: options.method === "GET" ? undefined : body,
  });
}

function dependencies(disposition: ProviderSuppressionDisposition = "suppressed") {
  const store: ProviderSuppressionStore = {
    findDeliveryOwner: vi.fn(async () => USER_ID),
    getAuthoritativeRecipient: vi.fn(async () => ({
      email: "reader@example.com",
      emailConfirmedAt: "2026-07-16T00:00:00.000Z",
    })),
    processProviderSuppressionEvent: vi.fn(async () => disposition),
  };
  const logger: SafeLogger = {
    info: vi.fn(),
    warn: vi.fn(),
  };
  return { store, logger };
}

describe("Resend suppression webhook", () => {
  it("verifies the raw body and atomically suppresses the mapped subscriber", async () => {
    const deps = dependencies();
    const handler = createResendWebhookHandler({
      webhookSecret: SECRET,
      ...deps,
    });
    const response = await handler(signedRequest(payload()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      disposition: "suppressed",
    });
    expect(deps.store.findDeliveryOwner).toHaveBeenCalledWith(MESSAGE_ID);
    expect(deps.store.getAuthoritativeRecipient).toHaveBeenCalledWith(USER_ID);
    expect(deps.store.processProviderSuppressionEvent).toHaveBeenCalledWith({
      providerEventId: EVENT_ID,
      providerMessageId: MESSAGE_ID,
      eventType: "email.bounced",
      userId: USER_ID,
      recipientMatches: true,
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("rejects an invalid signature before any provider data is processed", async () => {
    const deps = dependencies();
    const handler = createResendWebhookHandler({
      webhookSecret: SECRET,
      ...deps,
    });
    const response = await handler(signedRequest(
      payload(),
      { signatureBody: payload({ type: "email.complained" }) },
    ));

    expect(response.status).toBe(400);
    expect(deps.store.findDeliveryOwner).not.toHaveBeenCalled();
    expect(deps.logger.warn).toHaveBeenCalledWith(
      "notification_webhook_rejected",
      { code: "invalid_signature" },
    );
  });

  it("acknowledges unrelated event types and untagged provider traffic", async () => {
    for (const body of [
      payload({ type: "email.delivered" }),
      payload({
        data: {
          email_id: MESSAGE_ID,
          to: ["reader@example.com"],
          tags: { category: "another_product" },
        },
      }),
    ]) {
      const deps = dependencies();
      const handler = createResendWebhookHandler({
        webhookSecret: SECRET,
        ...deps,
      });
      const response = await handler(signedRequest(body));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ok: true,
        disposition: "ignored",
      });
      expect(deps.store.findDeliveryOwner).not.toHaveBeenCalled();
    }
  });

  it("defers a tagged event until its delivery ledger row is visible", async () => {
    const deps = dependencies();
    vi.mocked(deps.store.findDeliveryOwner).mockResolvedValue(null);
    const handler = createResendWebhookHandler({
      webhookSecret: SECRET,
      ...deps,
    });
    const response = await handler(signedRequest(payload()));

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(deps.store.processProviderSuppressionEvent).not.toHaveBeenCalled();
  });

  it("records but does not suppress when the signed address is no longer authoritative", async () => {
    const deps = dependencies("ignored");
    vi.mocked(deps.store.getAuthoritativeRecipient).mockResolvedValue({
      email: "changed@example.com",
      emailConfirmedAt: "2026-07-16T00:00:00.000Z",
    });
    const handler = createResendWebhookHandler({
      webhookSecret: SECRET,
      ...deps,
    });
    const response = await handler(signedRequest(payload()));

    expect(response.status).toBe(200);
    expect(deps.store.processProviderSuppressionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ recipientMatches: false }),
    );
  });

  it("rejects malformed supported payloads and non-POST requests", async () => {
    const malformedDeps = dependencies();
    const handler = createResendWebhookHandler({
      webhookSecret: SECRET,
      ...malformedDeps,
    });
    const malformed = await handler(signedRequest(payload({
      data: { tags: { category: "cumulus_blog_notification" } },
    })));
    expect(malformed.status).toBe(400);
    expect(malformedDeps.store.findDeliveryOwner).not.toHaveBeenCalled();

    const method = await handler(signedRequest("", { method: "GET" }));
    expect(method.status).toBe(405);
    expect(method.headers.get("allow")).toBe("POST");
  });

  it("never logs provider IDs, recipients, or raw payloads", async () => {
    const deps = dependencies("duplicate");
    const handler = createResendWebhookHandler({
      webhookSecret: SECRET,
      ...deps,
    });
    await handler(signedRequest(payload()));
    const logs = JSON.stringify([
      vi.mocked(deps.logger.info).mock.calls,
      vi.mocked(deps.logger.warn).mock.calls,
    ]);
    expect(logs).not.toContain(EVENT_ID);
    expect(logs).not.toContain(MESSAGE_ID);
    expect(logs).not.toContain("reader@example.com");
  });
});
