import { describe, expect, it, vi } from "vitest";

import { createResendWebhookHandler } from "./resend-webhook";

const logger = { info: vi.fn(), warn: vi.fn() };
const headers = {
  "svix-id": "msg_1", "svix-timestamp": "123", "svix-signature": "v1,signed",
};

function request(value: unknown) {
  return new Request("https://cumulush.com/api/notifications/resend-webhook", {
    method: "POST", headers, body: JSON.stringify(value),
  });
}

describe("Resend suppression webhook", () => {
  it("rejects unsigned requests and ignores unrelated events", async () => {
    const handler = createResendWebhookHandler({
      webhookSecret: "secret", provider: { suppressContact: vi.fn() }, logger,
      verify: () => ({ type: "email.delivered", data: {} }),
    });
    expect((await handler(new Request("https://cumulush.com", { method: "POST" }))).status).toBe(400);
    expect(await (await handler(request({}))).json()).toEqual({ ok: true, disposition: "ignored" });
  });

  it("normalizes unique recipients and suppresses only through the provider", async () => {
    const suppressContact = vi.fn().mockResolvedValue("suppressed");
    const handler = createResendWebhookHandler({
      webhookSecret: "secret", provider: { suppressContact }, logger,
      verify: () => ({
        type: "email.bounced",
        data: { to: [" Reader@Example.com ", "reader@example.com"] },
      }),
    });
    const response = await handler(request({}));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, disposition: "suppressed" });
    expect(suppressContact).toHaveBeenCalledTimes(1);
    expect(suppressContact).toHaveBeenCalledWith("reader@example.com");
  });

  it("returns retryable failure when Resend state cannot be updated", async () => {
    const handler = createResendWebhookHandler({
      webhookSecret: "secret",
      provider: { suppressContact: vi.fn().mockRejectedValue(new Error("offline")) },
      logger,
      verify: () => ({ type: "email.complained", data: { to: ["reader@example.com"] } }),
    });
    const response = await handler(request({}));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
  });
});
