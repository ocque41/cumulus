import { describe, expect, it, vi } from "vitest";

import { ResendMagicLinkSender, ResendNotificationProvider } from "./resend";

function fakeResend(overrides: Record<string, unknown> = {}) {
  return {
    emails: { send: vi.fn().mockResolvedValue({ data: { id: "email_1" }, error: null }) },
    contacts: {
      get: vi.fn().mockResolvedValue({ data: null, error: { name: "not_found", statusCode: 404 } }),
      create: vi.fn().mockResolvedValue({ data: { id: "contact_1" }, error: null }),
      update: vi.fn().mockResolvedValue({ data: { id: "contact_1" }, error: null }),
      segments: {
        list: vi.fn().mockResolvedValue({ data: { data: [], has_more: false }, error: null }),
        add: vi.fn().mockResolvedValue({ data: { id: "segment_1" }, error: null }),
      },
      topics: {
        list: vi.fn().mockResolvedValue({ data: { data: [], has_more: false }, error: null }),
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
    segments: { get: vi.fn().mockResolvedValue({ data: { id: "segment_123" }, error: null }) },
    topics: { get: vi.fn().mockResolvedValue({ data: { id: "topic_123", default_subscription: "opt_out" }, error: null }) },
    broadcasts: {
      list: vi.fn().mockResolvedValue({ data: { data: [], has_more: false }, error: null }),
      create: vi.fn().mockResolvedValue({ data: { id: "broadcast_1" }, error: null }),
      send: vi.fn().mockResolvedValue({ data: { id: "broadcast_1" }, error: null }),
      get: vi.fn(),
    },
    ...overrides,
  };
}

describe("Resend notification provider", () => {
  it("sends branded magic links with a stable idempotency key", async () => {
    const resend = fakeResend();
    const sender = new ResendMagicLinkSender({
      apiKey: "re_test", fromEmail: "Cumulus <hi@cumulush.com>", siteOrigin: "https://cumulush.com",
      resend: resend as never,
    });
    await sender.sendMagicLink({
      email: "reader@example.com", link: "https://cumulush.com/auth/callback#token=x",
      idempotencyKey: "magic-key", expiresAt: new Date("2026-07-17T01:00:00Z"),
    });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["reader@example.com"] }),
      { idempotencyKey: "magic-key" },
    );
  });

  it("validates opt-out topic resources before creating and sending one broadcast", async () => {
    const resend = fakeResend();
    const provider = new ResendNotificationProvider({
      apiKey: "re_test", fromEmail: "Cumulus <hi@cumulush.com>", siteOrigin: "https://cumulush.com",
      segmentId: "segment_123", topicId: "topic_123", resend: resend as never,
    });
    await expect(provider.publishPost({
      post: { slug: "new-log", title: "New log", excerpt: "Public notes.", date: "2026-07-17" },
      siteOrigin: "https://cumulush.com", postalAddress: "Madrid, Spain", dryRun: false,
    })).resolves.toEqual({ status: "created" });
    expect(resend.broadcasts.create).toHaveBeenCalledTimes(1);
    expect(resend.broadcasts.send).toHaveBeenCalledWith("broadcast_1");
  });

  it("fails closed when the topic defaults to opt-in", async () => {
    const resend = fakeResend();
    resend.topics.get.mockResolvedValue({ data: { id: "topic_123", default_subscription: "opt_in" }, error: null });
    const provider = new ResendNotificationProvider({
      apiKey: "re_test", fromEmail: "hi@cumulush.com", siteOrigin: "https://cumulush.com",
      segmentId: "segment_123", topicId: "topic_123", resend: resend as never,
    });
    await expect(provider.publishPost({
      post: { slug: "new-log", title: "New log", excerpt: "Public notes.", date: "2026-07-17" },
      siteOrigin: "https://cumulush.com", postalAddress: "Madrid, Spain", dryRun: true,
    })).rejects.toMatchObject({ code: "resend_topic_must_default_opt_out" });
  });
});
