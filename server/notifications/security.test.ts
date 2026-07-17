import { describe, expect, it } from "vitest";

import {
  broadcastIdempotencyKey,
  createNotificationToken,
  hasSameOrigin,
  magicLinkIdempotencyKey,
  normalizeNotificationEmail,
  verifyBearerAuthorization,
  verifyNotificationToken,
} from "./security";

const secret = "s".repeat(64);
const now = new Date("2026-07-17T00:00:00Z");

describe("notification security", () => {
  it("normalizes valid addresses and rejects unsafe input", () => {
    expect(normalizeNotificationEmail(" Reader@Example.COM ")).toBe("reader@example.com");
    expect(normalizeNotificationEmail("reader@example.com\nBcc:x@example.com")).toBeNull();
    expect(normalizeNotificationEmail("missing-at.example.com")).toBeNull();
  });

  it("signs purpose-bound tokens and rejects tampering and expiry", () => {
    const token = createNotificationToken({
      purpose: "magic",
      email: "Reader@example.com",
      expiresAt: new Date(now.getTime() + 60_000),
      secret,
    });
    expect(verifyNotificationToken({ token, purpose: "magic", secret, now })).toMatchObject({
      valid: true,
      email: "reader@example.com",
    });
    expect(verifyNotificationToken({ token, purpose: "session", secret, now })).toEqual({
      valid: false,
      reason: "invalid",
    });
    expect(verifyNotificationToken({ token: `${token}x`, purpose: "magic", secret, now })).toEqual({
      valid: false,
      reason: "invalid",
    });
    expect(verifyNotificationToken({
      token,
      purpose: "magic",
      secret,
      now: new Date(now.getTime() + 60_000),
    })).toEqual({ valid: false, reason: "expired" });
  });

  it("uses stable scoped idempotency keys", () => {
    expect(magicLinkIdempotencyKey("reader@example.com", 1000)).toBe(
      magicLinkIdempotencyKey("reader@example.com", 1000),
    );
    expect(magicLinkIdempotencyKey("reader@example.com", 1000)).not.toBe(
      magicLinkIdempotencyKey("reader@example.com", 2000),
    );
    expect(broadcastIdempotencyKey("one-post")).not.toBe(
      broadcastIdempotencyKey("another-post"),
    );
  });

  it("requires exact bearer credentials and browser origin", () => {
    expect(verifyBearerAuthorization("Bearer publish-secret", "publish-secret")).toBe(true);
    expect(verifyBearerAuthorization("Bearer wrong", "publish-secret")).toBe(false);
    expect(hasSameOrigin(new Request("https://cumulush.com", {
      headers: { Origin: "https://cumulush.com" },
    }), "https://cumulush.com")).toBe(true);
    expect(hasSameOrigin(new Request("https://cumulush.com", {
      headers: { Origin: "https://evil.example" },
    }), "https://cumulush.com")).toBe(false);
  });
});
