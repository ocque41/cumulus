import { describe, expect, it, vi } from "vitest";

import { publishNewPostNotifications } from "./publish-new-post-notifications.mjs";

const secret = "a-secure-notification-publication-secret-value";

function response(status: number, body: unknown, retryAfter?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: retryAfter ? { "Retry-After": retryAfter } : undefined,
  });
}

describe("automatic notification publication", () => {
  it("dry-runs before creating one real publication", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response(200, { ok: true, dryRun: true, status: "dry_run" }))
      .mockResolvedValueOnce(response(200, { ok: true, dryRun: false, status: "created" }));

    await expect(publishNewPostNotifications({
      fetcher,
      origin: "https://cumulush.com",
      secret,
      slugs: ["new-log"],
    })).resolves.toEqual([{ slug: "new-log", status: "created" }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetcher.mock.calls[0]![1]!.body as string)).toEqual({
      slug: "new-log",
      dryRun: true,
    });
  });

  it("retries deployment propagation without duplicating the real request", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response(404, { ok: false, error: "post_not_found" }, "1"))
      .mockResolvedValueOnce(response(200, { ok: true, dryRun: true, status: "dry_run" }))
      .mockResolvedValueOnce(response(200, { ok: true, dryRun: false, status: "already_sent" }));

    await expect(publishNewPostNotifications({
      attempts: 3,
      fetcher,
      origin: "https://cumulush.com",
      secret,
      sleep,
      slugs: ["new-log"],
    })).resolves.toEqual([{ slug: "new-log", status: "already_sent" }]);
    expect(sleep).toHaveBeenCalledWith(1000);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("fails closed on bad authorization and malformed inputs", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      response(401, { ok: false, error: "unauthorized" }),
    );
    await expect(publishNewPostNotifications({
      fetcher,
      origin: "https://cumulush.com",
      secret,
      slugs: ["new-log"],
    })).rejects.toThrow(/HTTP 401/);
    await expect(publishNewPostNotifications({
      origin: "https://preview.example.com",
      secret,
      slugs: ["new-log"],
    })).rejects.toThrow(/Unexpected notification origin/);
  });
});
