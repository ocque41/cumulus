import { describe, expect, it, vi } from "vitest";

import { createSessionHandler, createSignInHandler } from "./auth";

const origin = "https://cumulush.com";
const secret = "s".repeat(64);
const now = new Date("2026-07-17T00:00:00Z");
const logger = { info: vi.fn(), warn: vi.fn() };

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("notification access", () => {
  it("requires same-origin explicit disclosure and sends a fragment magic link", async () => {
    const sendMagicLink = vi.fn().mockResolvedValue(undefined);
    const handler = createSignInHandler({
      sender: { sendMagicLink }, signingSecret: secret, siteOrigin: origin, logger, now: () => now,
    });
    expect((await handler(jsonRequest("/api/notifications/sign-in", {
      email: "reader@example.com", disclosureAccepted: false,
    }))).status).toBe(400);
    const response = await handler(jsonRequest("/api/notifications/sign-in", {
      email: " Reader@Example.com ", disclosureAccepted: true,
    }));
    expect(response.status).toBe(202);
    const input = sendMagicLink.mock.calls[0][0];
    expect(input.email).toBe("reader@example.com");
    expect(input.link).toContain("/auth/callback#token=");
    expect(input.link).not.toContain("?token=");
  });

  it("exchanges a magic link for a secure HttpOnly session and clears it", async () => {
    const sendMagicLink = vi.fn().mockResolvedValue(undefined);
    const signIn = createSignInHandler({
      sender: { sendMagicLink }, signingSecret: secret, siteOrigin: origin, logger, now: () => now,
    });
    await signIn(jsonRequest("/api/notifications/sign-in", {
      email: "reader@example.com", disclosureAccepted: true,
    }));
    const token = new URL(sendMagicLink.mock.calls[0][0].link).hash.slice("#token=".length);
    const session = createSessionHandler({ signingSecret: secret, siteOrigin: origin, logger, now: () => now });
    const opened = await session(jsonRequest("/api/notifications/session", { token }));
    expect(opened.status).toBe(200);
    expect(opened.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Lax; Secure/);
    const cookie = opened.headers.get("set-cookie")?.split(";")[0] ?? "";
    const current = await session(new Request(`${origin}/api/notifications/session`, {
      headers: { Cookie: cookie },
    }));
    expect(await current.json()).toMatchObject({ user: { email: "reader@example.com" } });
    const closed = await session(new Request(`${origin}/api/notifications/session`, {
      method: "DELETE", headers: { Origin: origin, Cookie: cookie },
    }));
    expect(closed.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
