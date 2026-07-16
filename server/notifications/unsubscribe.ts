import {
  isRecord,
  readSmallJson,
  readSmallText,
  RequestBodyError,
  unsubscribeEmptyResponse,
  unsubscribeJsonResponse,
} from "./http.js";
import { verifyUnsubscribeToken } from "./security.js";
import type { NotificationStore, SafeLogger } from "./types.js";

interface UnsubscribeHandlerOptions {
  unsubscribeSecret: string;
  store: Pick<NotificationStore, "unsubscribe">;
  now?: () => Date;
  logger: SafeLogger;
}

type ParsedPost =
  | { ok: true; token: string; oneClick: boolean }
  | { ok: false; status: number };

type ParsedPostFailure = Extract<ParsedPost, { ok: false }>;

function isParsedPostFailure(value: ParsedPost): value is ParsedPostFailure {
  return value.ok === false;
}

async function parsePost(request: Request): Promise<ParsedPost> {
  const contentType = request.headers.get("content-type") ?? "";
  const queryToken = new URL(request.url).searchParams.get("token")?.trim() ?? "";

  if (/^application\/json(?:\s*;|$)/i.test(contentType)) {
    let value: unknown;
    try {
      value = await readSmallJson(request);
    } catch (error) {
      return {
        ok: false,
        status: error instanceof RequestBodyError ? error.status : 400,
      };
    }
    if (
      !isRecord(value)
      || Object.keys(value).length !== 1
      || typeof value.token !== "string"
      || !value.token.trim()
      || (queryToken && queryToken !== value.token.trim())
    ) {
      return { ok: false, status: 400 };
    }
    return { ok: true, token: value.token.trim(), oneClick: false };
  }

  if (/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(contentType)) {
    let text: string;
    try {
      text = await readSmallText(request);
    } catch (error) {
      return {
        ok: false,
        status: error instanceof RequestBodyError ? error.status : 400,
      };
    }
    const form = new URLSearchParams(text);
    const keys = [...form.keys()];
    if (
      !queryToken
      || keys.length !== 1
      || keys[0] !== "List-Unsubscribe"
      || form.getAll("List-Unsubscribe").length !== 1
      || form.get("List-Unsubscribe") !== "One-Click"
    ) {
      return { ok: false, status: 400 };
    }
    return { ok: true, token: queryToken, oneClick: true };
  }

  return { ok: false, status: 415 };
}

export function createUnsubscribeHandler(
  options: UnsubscribeHandlerOptions,
): (request: Request) => Promise<Response> {
  const now = options.now ?? (() => new Date());

  return async (request) => {
    if (request.method !== "GET" && request.method !== "POST") {
      return unsubscribeJsonResponse(
        { ok: false, error: "method_not_allowed" },
        { status: 405, headers: { Allow: "GET, POST" } },
      );
    }

    if (request.method === "GET") {
      const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
      const tokenResult = verifyUnsubscribeToken({
        token,
        secret: options.unsubscribeSecret,
        now: now(),
      });
      if (!tokenResult.valid) {
        return unsubscribeJsonResponse(
          { ok: false, error: "invalid_or_expired_token" },
          { status: 400 },
        );
      }
      return unsubscribeJsonResponse({ ok: true, actionRequired: true });
    }

    const parsed = await parsePost(request);
    if (isParsedPostFailure(parsed)) {
      return unsubscribeJsonResponse(
        { ok: false, error: "invalid_request" },
        { status: parsed.status },
      );
    }
    const tokenResult = verifyUnsubscribeToken({
      token: parsed.token,
      secret: options.unsubscribeSecret,
      now: now(),
    });
    if (!tokenResult.valid) {
      return unsubscribeJsonResponse(
        { ok: false, error: "invalid_or_expired_token" },
        { status: 400 },
      );
    }

    try {
      await options.store.unsubscribe(tokenResult.userId);
      options.logger.info("notification_unsubscribe_complete", {});
      return parsed.oneClick
        ? unsubscribeEmptyResponse()
        : unsubscribeJsonResponse({ ok: true, unsubscribed: true });
    } catch {
      options.logger.warn("notification_unsubscribe_failed", {
        code: "notification_upstream_failure",
      });
      return unsubscribeJsonResponse(
        { ok: false, error: "unsubscribe_unavailable" },
        { status: 503 },
      );
    }
  };
}
