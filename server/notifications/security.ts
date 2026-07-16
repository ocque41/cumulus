import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { PublishablePost } from "./types.js";

const TOKEN_VERSION = "v1";
const TOKEN_DOMAIN = "cumulus:blog-unsubscribe";
const MAXIMUM_TOKEN_LENGTH = 512;
const HMAC_BASE64URL_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function constantTimeEqual(actual: string, expected: string): boolean {
  return timingSafeEqual(digest(actual), digest(expected));
}

export function verifyBearerAuthorization(
  authorization: string | null,
  expectedSecret: string,
): boolean {
  if (!expectedSecret) return false;
  const match = /^Bearer[\t ]+([^\s]+)$/i.exec(authorization ?? "");
  const matches = constantTimeEqual(match?.[1] ?? "", expectedSecret);
  return Boolean(match) && matches;
}

function tokenMessage(userId: string, expiresAt: number): string {
  return `${TOKEN_DOMAIN}:${TOKEN_VERSION}:${userId}:${expiresAt}`;
}

function tokenSignature(
  userId: string,
  expiresAt: number,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(tokenMessage(userId, expiresAt), "utf8")
    .digest("base64url");
}

export function createUnsubscribeToken(input: {
  userId: string;
  expiresAt: Date;
  secret: string;
}): string {
  if (!UUID_PATTERN.test(input.userId)) throw new Error("invalid_user_id");
  if (!input.secret) throw new Error("missing_unsubscribe_secret");
  const expiresAt = Math.floor(input.expiresAt.getTime() / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) {
    throw new Error("invalid_expiry");
  }
  const signature = tokenSignature(input.userId, expiresAt, input.secret);
  return `${TOKEN_VERSION}.${input.userId}.${expiresAt}.${signature}`;
}

export type UnsubscribeTokenResult =
  | { valid: true; userId: string; expiresAt: Date }
  | { valid: false; reason: "invalid" | "expired" };

export function verifyUnsubscribeToken(input: {
  token: string;
  secret: string;
  now: Date;
}): UnsubscribeTokenResult {
  if (input.token.length > MAXIMUM_TOKEN_LENGTH) {
    return { valid: false, reason: "invalid" };
  }
  const parts = input.token.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION || !input.secret) {
    return { valid: false, reason: "invalid" };
  }
  const [, userId, expiresAtText, suppliedSignature] = parts;
  if (
    !UUID_PATTERN.test(userId)
    || !/^\d{1,12}$/.test(expiresAtText)
    || !HMAC_BASE64URL_PATTERN.test(suppliedSignature)
  ) {
    return { valid: false, reason: "invalid" };
  }
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt)) {
    return { valid: false, reason: "invalid" };
  }
  const expectedSignature = tokenSignature(userId, expiresAt, input.secret);
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) {
    return { valid: false, reason: "invalid" };
  }
  if (expiresAt <= Math.floor(input.now.getTime() / 1000)) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true, userId, expiresAt: new Date(expiresAt * 1000) };
}

export function deliveryIdempotencyKey(
  postSlug: string,
  userId: string,
): string {
  const hash = createHash("sha256")
    .update(`${postSlug}\0${userId}`, "utf8")
    .digest("hex");
  return `blog-notification-${hash}`;
}

export function hashDeliveryPayloadIdentity(input: {
  post: PublishablePost;
  recipientEmail: string;
  senderIdentity: string;
  siteOrigin: string;
  postalAddress: string;
  unsubscribeSecret: string;
}): string {
  const unsubscribeKeyFingerprint = createHash("sha256")
    .update(input.unsubscribeSecret, "utf8")
    .digest("hex");
  return createHash("sha256")
    .update(JSON.stringify([
      "notification-email-template-v1",
      input.post.slug,
      input.post.title,
      input.post.excerpt,
      input.post.date,
      input.recipientEmail,
      input.senderIdentity,
      input.siteOrigin,
      input.postalAddress,
      unsubscribeKeyFingerprint,
    ]))
    .digest("hex");
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
