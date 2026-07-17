import { describe, expect, it, vi } from "vitest";

import { createPublishHandler, publishPostNotifications } from "./publish";
import { NotificationProviderError } from "./resend";

const post = { slug: "new-log", title: "New log", excerpt: "A useful public log.", date: "2026-07-17" };
const logger = { info: vi.fn(), warn: vi.fn() };

describe("notification publication", () => {
  it("delegates dry runs to the Resend broadcast provider", async () => {
    const publishPost = vi.fn().mockResolvedValue({ status: "dry_run" });
    await expect(publishPostNotifications({
      post, dryRun: true, provider: { publishPost }, siteOrigin: "https://cumulush.com", postalAddress: "Madrid, Spain",
    })).resolves.toEqual({ ok: true, dryRun: true, status: "dry_run" });
  });

  it("authenticates requests and maps content conflicts", async () => {
    const handler = createPublishHandler({
      publishSecret: "secret", getPublishedPostBySlug: () => post,
      publish: vi.fn().mockRejectedValue(new NotificationProviderError("resend_broadcast_content_conflict")), logger,
    });
    const unauthorized = await handler(new Request("https://cumulush.com/api/notifications/publish", { method: "POST" }));
    expect(unauthorized.status).toBe(401);
    const conflict = await handler(new Request("https://cumulush.com/api/notifications/publish", {
      method: "POST",
      headers: { Authorization: "Bearer secret", "Content-Type": "application/json" },
      body: JSON.stringify({ slug: post.slug }),
    }));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error: "notification_content_conflict" });
  });
});
