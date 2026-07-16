import { describe, expect, it, vi } from "vitest";
import { createUnsubscribeToken } from "./security";
import { createUnsubscribeHandler } from "./unsubscribe";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SECRET = "u".repeat(32);
const NOW = new Date("2029-01-01T00:00:00.000Z");

function token(expiresAt = new Date("2030-01-01T00:00:00.000Z")): string {
  return createUnsubscribeToken({ userId: USER_ID, expiresAt, secret: SECRET });
}

function setup(unsubscribe = vi.fn(async () => {})) {
  const logger = { info: vi.fn(), warn: vi.fn() };
  const handler = createUnsubscribeHandler({
    unsubscribeSecret: SECRET,
    store: { unsubscribe },
    now: () => NOW,
    logger,
  });
  return { handler, unsubscribe, logger };
}

describe("unsubscribe handler", () => {
  it("verifies a scanner GET without mutating preference state", async () => {
    const { handler, unsubscribe } = setup();
    const response = await handler(new Request(
      `https://cumulush.com/api/notifications/unsubscribe?token=${encodeURIComponent(token())}`,
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, actionRequired: true });
    expect(unsubscribe).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("accepts the browser JSON contract and remains idempotent", async () => {
    const { handler, unsubscribe } = setup();
    const makeRequest = () => new Request(
      "https://cumulush.com/api/notifications/unsubscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token() }),
      },
    );

    const first = await handler(makeRequest());
    const second = await handler(makeRequest());
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true, unsubscribed: true });
    expect(second.status).toBe(200);
    expect(unsubscribe).toHaveBeenCalledTimes(2);
    expect(unsubscribe).toHaveBeenNthCalledWith(1, USER_ID);
  });

  it("accepts RFC one-click POST and returns an empty success", async () => {
    const { handler, unsubscribe } = setup();
    const response = await handler(new Request(
      `https://cumulush.com/api/notifications/unsubscribe?token=${encodeURIComponent(token())}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      },
    ));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(unsubscribe).toHaveBeenCalledWith(USER_ID);
  });

  it("rejects tampered, expired, conflicting, and malformed requests generically", async () => {
    const { handler, unsubscribe } = setup();
    const expired = token(new Date("2028-01-01T00:00:00.000Z"));
    const cases = [
      new Request("https://cumulush.com/api/notifications/unsubscribe?token=bad"),
      new Request(
        `https://cumulush.com/api/notifications/unsubscribe?token=${encodeURIComponent(expired)}`,
      ),
      new Request("https://cumulush.com/api/notifications/unsubscribe?token=different", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token() }),
      }),
      new Request("https://cumulush.com/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token(), userId: USER_ID }),
      }),
    ];

    for (const request of cases) {
      const response = await handler(request);
      expect(response.status).toBe(400);
      expect(JSON.stringify(await response.json())).not.toContain(USER_ID);
    }
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("redacts identity and upstream detail when persistence fails", async () => {
    const unsubscribe = vi.fn(async () => {
      throw new Error(`provider leaked reader@example.com ${USER_ID}`);
    });
    const { handler, logger } = setup(unsubscribe);
    const response = await handler(new Request(
      "https://cumulush.com/api/notifications/unsubscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token() }),
      },
    ));
    const responseText = await response.text();

    expect(response.status).toBe(503);
    expect(responseText).not.toContain("reader@example.com");
    expect(responseText).not.toContain(USER_ID);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(USER_ID);
  });
});
