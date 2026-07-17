import {
  isRecord,
  jsonResponse,
  readSmallJson,
  RequestBodyError,
} from "./http.js";
import {
  createNotificationToken,
  hasSameOrigin,
  magicLinkIdempotencyKey,
  normalizeNotificationEmail,
  verifyNotificationToken,
} from "./security.js";
import type { NotificationSession, SafeLogger } from "./types.js";

const SESSION_COOKIE = "cumulus_notification_session";
const MAGIC_LINK_WINDOW_SECONDS = 10 * 60;
const MAGIC_LINK_EXPIRY_SECONDS = 30 * 60;
const SESSION_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

interface MagicLinkSender {
  sendMagicLink(input: {
    email: string;
    link: string;
    idempotencyKey: string;
    expiresAt: Date;
  }): Promise<void>;
}

function invalidRequest(status = 400): Response {
  return jsonResponse({ ok: false, error: "invalid_request" }, { status });
}

function methodNotAllowed(methods: string): Response {
  return jsonResponse(
    { ok: false, error: "method_not_allowed" },
    { status: 405, headers: { Allow: methods } },
  );
}

function parseCookies(value: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of (value ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    const name = part.slice(0, separator).trim();
    const raw = part.slice(separator + 1).trim();
    try {
      cookies.set(name, decodeURIComponent(raw));
    } catch {
      // Ignore malformed cookie fragments instead of rejecting the request.
    }
  }
  return cookies;
}

function sessionCookie(token: string, siteOrigin: string): string {
  const secure = new URL(siteOrigin).protocol === "https:" ? "; Secure" : "";
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${SESSION_EXPIRY_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ") + secure;
}

function clearSessionCookie(siteOrigin: string): string {
  const secure = new URL(siteOrigin).protocol === "https:" ? "; Secure" : "";
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ") + secure;
}

export function readNotificationSession(input: {
  request: Request;
  signingSecret: string;
  now: Date;
}): NotificationSession | null {
  const token = parseCookies(input.request.headers.get("cookie")).get(
    SESSION_COOKIE,
  );
  if (!token) return null;
  const result = verifyNotificationToken({
    token,
    purpose: "session",
    secret: input.signingSecret,
    now: input.now,
  });
  return result.valid ? { email: result.email } : null;
}

export function createSignInHandler(options: {
  sender: MagicLinkSender;
  signingSecret: string;
  siteOrigin: string;
  logger: SafeLogger;
  now?: () => Date;
}): (request: Request) => Promise<Response> {
  const now = options.now ?? (() => new Date());

  return async (request) => {
    if (request.method !== "POST") return methodNotAllowed("POST");
    if (!hasSameOrigin(request, options.siteOrigin)) return invalidRequest(403);

    let value: unknown;
    try {
      value = await readSmallJson(request);
    } catch (error) {
      return invalidRequest(error instanceof RequestBodyError ? error.status : 400);
    }
    if (!isRecord(value)) return invalidRequest();
    const keys = Object.keys(value);
    if (
      keys.some((key) => key !== "email" && key !== "disclosureAccepted")
      || typeof value.email !== "string"
      || value.disclosureAccepted !== true
    ) {
      return invalidRequest();
    }
    const email = normalizeNotificationEmail(value.email);
    if (!email) return invalidRequest();

    const current = now();
    const nowSeconds = Math.floor(current.getTime() / 1000);
    const windowStart =
      Math.floor(nowSeconds / MAGIC_LINK_WINDOW_SECONDS)
      * MAGIC_LINK_WINDOW_SECONDS;
    const expiresAt = new Date(
      (windowStart + MAGIC_LINK_EXPIRY_SECONDS) * 1000,
    );
    const token = createNotificationToken({
      purpose: "magic",
      email,
      expiresAt,
      secret: options.signingSecret,
    });
    const callback = new URL("/auth/callback", options.siteOrigin);
    callback.hash = new URLSearchParams({ token }).toString();

    try {
      await options.sender.sendMagicLink({
        email,
        link: callback.toString(),
        expiresAt,
        idempotencyKey: magicLinkIdempotencyKey(email, windowStart),
      });
      options.logger.info("notification_magic_link_requested", {});
      return jsonResponse(
        {
          ok: true,
          message:
            "If the address can receive Cumulus mail, a notification-management link is on its way.",
        },
        { status: 202 },
      );
    } catch {
      options.logger.warn("notification_magic_link_failed", {
        code: "notification_upstream_failure",
      });
      return jsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }
  };
}

export function createSessionHandler(options: {
  signingSecret: string;
  siteOrigin: string;
  logger: SafeLogger;
  now?: () => Date;
}): (request: Request) => Promise<Response> {
  const now = options.now ?? (() => new Date());

  return async (request) => {
    if (request.method === "GET") {
      const session = readNotificationSession({
        request,
        signingSecret: options.signingSecret,
        now: now(),
      });
      return jsonResponse({ ok: true, user: session });
    }

    if (request.method === "DELETE") {
      if (!hasSameOrigin(request, options.siteOrigin)) return invalidRequest(403);
      options.logger.info("notification_session_closed", {});
      return jsonResponse(
        { ok: true, user: null },
        { headers: { "Set-Cookie": clearSessionCookie(options.siteOrigin) } },
      );
    }

    if (request.method !== "POST") return methodNotAllowed("GET, POST, DELETE");
    if (!hasSameOrigin(request, options.siteOrigin)) return invalidRequest(403);

    let value: unknown;
    try {
      value = await readSmallJson(request);
    } catch (error) {
      return invalidRequest(error instanceof RequestBodyError ? error.status : 400);
    }
    if (
      !isRecord(value)
      || Object.keys(value).some((key) => key !== "token")
      || typeof value.token !== "string"
    ) {
      return invalidRequest();
    }
    const verified = verifyNotificationToken({
      token: value.token,
      purpose: "magic",
      secret: options.signingSecret,
      now: now(),
    });
    if (!verified.valid) {
      return jsonResponse(
        { ok: false, error: "invalid_or_expired_link" },
        { status: 401 },
      );
    }
    const expiresAt = new Date(now().getTime() + SESSION_EXPIRY_SECONDS * 1000);
    const sessionToken = createNotificationToken({
      purpose: "session",
      email: verified.email,
      expiresAt,
      secret: options.signingSecret,
    });
    options.logger.info("notification_session_opened", {});
    return jsonResponse(
      { ok: true, user: { email: verified.email } },
      { headers: { "Set-Cookie": sessionCookie(sessionToken, options.siteOrigin) } },
    );
  };
}
