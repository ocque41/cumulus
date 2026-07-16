import { describe, expect, it } from "vitest";
import {
  readNotificationConfig,
  readResendWebhookConfig,
  readUnsubscribeConfig,
} from "./config";
import {
  createUnsubscribeToken,
  deliveryIdempotencyKey,
  hashDeliveryPayloadIdentity,
  verifyBearerAuthorization,
  verifyUnsubscribeToken,
} from "./security";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PUBLISH_SECRET = "p".repeat(32);
const UNSUBSCRIBE_SECRET = "u".repeat(32);

describe("notification security", () => {
  it("validates bearer credentials without accepting malformed variants", () => {
    expect(verifyBearerAuthorization(`Bearer ${PUBLISH_SECRET}`, PUBLISH_SECRET)).toBe(true);
    expect(verifyBearerAuthorization(`bearer\t${PUBLISH_SECRET}`, PUBLISH_SECRET)).toBe(true);
    expect(verifyBearerAuthorization(null, PUBLISH_SECRET)).toBe(false);
    expect(verifyBearerAuthorization("Bearer", PUBLISH_SECRET)).toBe(false);
    expect(verifyBearerAuthorization("Basic anything", PUBLISH_SECRET)).toBe(false);
    expect(verifyBearerAuthorization("Bearer wrong", PUBLISH_SECRET)).toBe(false);
    expect(verifyBearerAuthorization(`Bearer ${PUBLISH_SECRET} extra`, PUBLISH_SECRET)).toBe(false);
  });

  it("round-trips a scoped token and rejects tampering and exact expiry", () => {
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");
    const token = createUnsubscribeToken({
      userId: USER_ID,
      expiresAt,
      secret: UNSUBSCRIBE_SECRET,
    });

    expect(
      verifyUnsubscribeToken({
        token,
        secret: UNSUBSCRIBE_SECRET,
        now: new Date("2029-12-31T23:59:59.000Z"),
      }),
    ).toMatchObject({ valid: true, userId: USER_ID, expiresAt });
    expect(
      verifyUnsubscribeToken({
        token,
        secret: UNSUBSCRIBE_SECRET,
        now: expiresAt,
      }),
    ).toEqual({ valid: false, reason: "expired" });
    expect(
      verifyUnsubscribeToken({
        token: token.replace(USER_ID, "22222222-2222-4222-8222-222222222222"),
        secret: UNSUBSCRIBE_SECRET,
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toEqual({ valid: false, reason: "invalid" });
    expect(
      verifyUnsubscribeToken({
        token: `${token}x`,
        secret: UNSUBSCRIBE_SECRET,
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toEqual({ valid: false, reason: "invalid" });
    expect(
      verifyUnsubscribeToken({
        token: "x".repeat(513),
        secret: UNSUBSCRIBE_SECRET,
        now: new Date("2029-01-01T00:00:00.000Z"),
      }),
    ).toEqual({ valid: false, reason: "invalid" });
    expect(token).not.toContain("reader@example.com");
  });

  it("creates stable recipient-free content and provider keys", () => {
    const first = deliveryIdempotencyKey("hello-world", USER_ID);
    expect(first).toBe(deliveryIdempotencyKey("hello-world", USER_ID));
    expect(first).not.toBe(deliveryIdempotencyKey("another-post", USER_ID));
    expect(first.length).toBeLessThan(256);
    expect(first).not.toContain(USER_ID);
    expect(first).not.toContain("reader@example.com");

    const post = {
      slug: "hello-world",
      title: "Hello",
      excerpt: "A post.",
      date: "2026-07-16",
    };
    const payload = {
      post,
      recipientEmail: "reader@example.com",
      senderIdentity: "Cumulus <hi@cumulush.com>",
      siteOrigin: "https://cumulush.com",
      postalAddress: "Cumulus Test, 42 Cloud Avenue, Madrid, Spain",
      unsubscribeSecret: UNSUBSCRIBE_SECRET,
    };
    const payloadHash = hashDeliveryPayloadIdentity(payload);
    expect(payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(payloadHash).not.toContain("reader@example.com");
    expect(payloadHash).not.toBe(
      hashDeliveryPayloadIdentity({
        ...payload,
        post: { ...post, excerpt: "Changed." },
      }),
    );
    for (const change of [
      { recipientEmail: "changed@example.com" },
      { senderIdentity: "Changed <hi@cumulush.com>" },
      { siteOrigin: "https://preview.cumulush.com" },
      { postalAddress: "Changed postal address" },
      { unsubscribeSecret: "z".repeat(32) },
    ]) {
      expect(hashDeliveryPayloadIdentity({ ...payload, ...change })).not.toBe(
        payloadHash,
      );
    }
  });
});

describe("notification configuration", () => {
  const validEnv = {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "s".repeat(64),
    RESEND_API_KEY: "runtime-resend-key",
    NOTIFICATION_FROM_EMAIL: "Cumulus <hi@cumulush.com>",
    NOTIFICATION_POSTAL_ADDRESS: "Cumulus, 42 Cloud Avenue, Madrid, Spain",
    NOTIFICATION_PUBLISH_SECRET: PUBLISH_SECRET,
    NOTIFICATION_UNSUBSCRIBE_SECRET: UNSUBSCRIBE_SECRET,
    NEXT_PUBLIC_SITE_URL: "https://cumulush.com",
    VERCEL_ENV: "production",
  };

  it("accepts the trusted production contract without changing values", () => {
    const config = readNotificationConfig(validEnv);
    expect(config.siteOrigin).toBe("https://cumulush.com");
    expect(config.resendApiKey).toBe("runtime-resend-key");
    expect(config.postalAddress).toBe(
      "Cumulus, 42 Cloud Avenue, Madrid, Spain",
    );
  });

  it("allows configured HTTPS preview and self-host origins outside production", () => {
    const preview = readNotificationConfig({
      ...validEnv,
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_SITE_URL: "https://cumulus-git-feature.vercel.app",
      NOTIFICATION_FROM_EMAIL: "Cumulus Preview <notifications@sender.test>",
    });
    expect(preview.siteOrigin).toBe(
      "https://cumulus-git-feature.vercel.app",
    );
    expect(preview.fromEmail).toBe(
      "Cumulus Preview <notifications@sender.test>",
    );

    const selfHosted = readNotificationConfig({
      ...validEnv,
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SITE_URL: "https://logs.self-host.test",
      NOTIFICATION_FROM_EMAIL: "notify@self-host.test",
    });
    expect(selfHosted.siteOrigin).toBe("https://logs.self-host.test");
  });

  it("rejects short/reused secrets and untrusted link or sender domains", () => {
    expect(() => readNotificationConfig({
      ...validEnv,
      NOTIFICATION_PUBLISH_SECRET: "short",
    })).toThrow();
    expect(() => readNotificationConfig({
      ...validEnv,
      NOTIFICATION_UNSUBSCRIBE_SECRET: PUBLISH_SECRET,
    })).toThrow();
    expect(() => readNotificationConfig({
      ...validEnv,
      NEXT_PUBLIC_SITE_URL: "https://attacker.example",
    })).toThrow();
    expect(() => readNotificationConfig({
      ...validEnv,
      NOTIFICATION_FROM_EMAIL: "Cumulus <hi@attacker.example>",
    })).toThrow();
    for (const postalAddress of [
      "replace-with-address",
      "123 Main Street, Anywhere",
      "Cumulus\nInjected header: value",
      "x".repeat(321),
    ]) {
      expect(() => readNotificationConfig({
        ...validEnv,
        NOTIFICATION_POSTAL_ADDRESS: postalAddress,
      })).toThrow();
    }
  });

  it("keeps unsubscribe available without mail-sending configuration", () => {
    expect(readUnsubscribeConfig({
      NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: validEnv.SUPABASE_SERVICE_ROLE_KEY,
      NOTIFICATION_UNSUBSCRIBE_SECRET:
        validEnv.NOTIFICATION_UNSUBSCRIBE_SECRET,
    })).toEqual({
      supabaseUrl: "https://project.supabase.co",
      supabaseServiceRoleKey: validEnv.SUPABASE_SERVICE_ROLE_KEY,
      unsubscribeSecret: validEnv.NOTIFICATION_UNSUBSCRIBE_SECRET,
    });
  });

  it("keeps webhook verification independent from mail-sending configuration", () => {
    expect(readResendWebhookConfig({
      NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: validEnv.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_WEBHOOK_SECRET: "w".repeat(32),
    })).toEqual({
      supabaseUrl: "https://project.supabase.co",
      supabaseServiceRoleKey: validEnv.SUPABASE_SERVICE_ROLE_KEY,
      webhookSecret: "w".repeat(32),
    });
    expect(() => readResendWebhookConfig({
      NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: validEnv.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_WEBHOOK_SECRET: "short",
    })).toThrow();
  });
});
