import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v2";
const TOKEN_DOMAIN = "cumulus:notification-access";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAXIMUM_TOKEN_LENGTH = 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NotificationTokenPurpose = "magic" | "session";

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

export function normalizeNotificationEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  const bytes = new TextEncoder().encode(email).byteLength;
  if (
    bytes < 3
    || bytes > 254
    || /[\r\n\0]/.test(email)
    || !EMAIL_PATTERN.test(email)
  ) {
    return null;
  }
  return email;
}

function tokenMessage(
  purpose: NotificationTokenPurpose,
  expiresAt: number,
  encodedEmail: string,
): string {
  return [TOKEN_DOMAIN, TOKEN_VERSION, purpose, expiresAt, encodedEmail].join(":");
}

function tokenSignature(
  purpose: NotificationTokenPurpose,
  expiresAt: number,
  encodedEmail: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(tokenMessage(purpose, expiresAt, encodedEmail), "utf8")
    .digest("base64url");
}

export function createNotificationToken(input: {
  purpose: NotificationTokenPurpose;
  email: string;
  expiresAt: Date;
  secret: string;
}): string {
  const email = normalizeNotificationEmail(input.email);
  if (!email) throw new Error("invalid_email");
  if (!input.secret) throw new Error("missing_notification_secret");
  const expiresAt = Math.floor(input.expiresAt.getTime() / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) {
    throw new Error("invalid_expiry");
  }
  const encodedEmail = Buffer.from(email, "utf8").toString("base64url");
  const signature = tokenSignature(
    input.purpose,
    expiresAt,
    encodedEmail,
    input.secret,
  );
  return [TOKEN_VERSION, input.purpose, expiresAt, encodedEmail, signature].join(".");
}

export type NotificationTokenResult =
  | { valid: true; email: string; expiresAt: Date }
  | { valid: false; reason: "invalid" | "expired" };

export function verifyNotificationToken(input: {
  token: string;
  purpose: NotificationTokenPurpose;
  secret: string;
  now: Date;
}): NotificationTokenResult {
  if (!input.secret || input.token.length > MAXIMUM_TOKEN_LENGTH) {
    return { valid: false, reason: "invalid" };
  }
  const parts = input.token.split(".");
  if (parts.length !== 5) return { valid: false, reason: "invalid" };
  const [version, purpose, expiresAtText, encodedEmail, suppliedSignature] = parts;
  if (
    version !== TOKEN_VERSION
    || purpose !== input.purpose
    || !/^\d{1,12}$/.test(expiresAtText)
    || !TOKEN_PATTERN.test(encodedEmail)
    || !/^[A-Za-z0-9_-]{43}$/.test(suppliedSignature)
  ) {
    return { valid: false, reason: "invalid" };
  }
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt)) {
    return { valid: false, reason: "invalid" };
  }
  const expectedSignature = tokenSignature(
    input.purpose,
    expiresAt,
    encodedEmail,
    input.secret,
  );
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) {
    return { valid: false, reason: "invalid" };
  }
  if (expiresAt <= Math.floor(input.now.getTime() / 1000)) {
    return { valid: false, reason: "expired" };
  }
  let email: string;
  try {
    email = Buffer.from(encodedEmail, "base64url").toString("utf8");
  } catch {
    return { valid: false, reason: "invalid" };
  }
  const normalizedEmail = normalizeNotificationEmail(email);
  if (!normalizedEmail || normalizedEmail !== email) {
    return { valid: false, reason: "invalid" };
  }
  return {
    valid: true,
    email,
    expiresAt: new Date(expiresAt * 1000),
  };
}

export function magicLinkIdempotencyKey(
  email: string,
  windowStartSeconds: number,
): string {
  const hash = createHash("sha256")
    .update(`${email}\0${windowStartSeconds}`, "utf8")
    .digest("hex");
  return `cumulus-magic-${hash}`;
}

export function broadcastIdempotencyKey(postSlug: string): string {
  const hash = createHash("sha256").update(postSlug, "utf8").digest("hex");
  return `cumulus-broadcast-${hash}`;
}

export function hasSameOrigin(request: Request, siteOrigin: string): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && constantTimeEqual(origin, siteOrigin);
}
