import { describe, expect, it, vi } from "vitest";

import { readNotificationSubscription, upsertNotificationSubscription } from "./subscription";

describe("notification preference client", () => {
  it("reads and updates through same-origin Vercel endpoints", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, status: "active" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, status: "unsubscribed" })));
    await expect(readNotificationSubscription(fetcher)).resolves.toEqual({ status: "active" });
    await expect(upsertNotificationSubscription("unsubscribed", fetcher)).resolves.toEqual({ status: "unsubscribed" });
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: "GET", credentials: "same-origin" });
    expect(fetcher.mock.calls[1][1]).toMatchObject({ method: "PUT", credentials: "same-origin" });
  });

  it("fails closed on malformed provider responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "unknown" })));
    await expect(readNotificationSubscription(fetcher)).rejects.toThrow("notification_preference_unavailable");
  });
});
