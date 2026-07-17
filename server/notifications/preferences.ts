import { readNotificationSession } from "./auth.js";
import {
  isRecord,
  jsonResponse,
  readSmallJson,
  RequestBodyError,
} from "./http.js";
import { hasSameOrigin } from "./security.js";
import type {
  NotificationPreferenceStatus,
  NotificationProvider,
  SafeLogger,
} from "./types.js";

type PreferenceProvider = Pick<
  NotificationProvider,
  "getPreference" | "setPreference"
>;

export function createPreferencesHandler(options: {
  provider: PreferenceProvider;
  signingSecret: string;
  siteOrigin: string;
  logger: SafeLogger;
  now?: () => Date;
}): (request: Request) => Promise<Response> {
  const now = options.now ?? (() => new Date());

  return async (request) => {
    if (request.method !== "GET" && request.method !== "PUT") {
      return jsonResponse(
        { ok: false, error: "method_not_allowed" },
        { status: 405, headers: { Allow: "GET, PUT" } },
      );
    }
    if (request.method === "PUT" && !hasSameOrigin(request, options.siteOrigin)) {
      return jsonResponse({ ok: false, error: "invalid_request" }, { status: 403 });
    }
    const session = readNotificationSession({
      request,
      signingSecret: options.signingSecret,
      now: now(),
    });
    if (!session) {
      return jsonResponse({ ok: false, error: "authentication_required" }, { status: 401 });
    }

    let requestedStatus: NotificationPreferenceStatus | null = null;
    if (request.method === "PUT") {
      let value: unknown;
      try {
        value = await readSmallJson(request);
      } catch (error) {
        const status = error instanceof RequestBodyError ? error.status : 400;
        return jsonResponse({ ok: false, error: "invalid_request" }, { status });
      }
      if (
        !isRecord(value)
        || Object.keys(value).some((key) => key !== "status")
        || (value.status !== "active" && value.status !== "unsubscribed")
      ) {
        return jsonResponse({ ok: false, error: "invalid_request" }, { status: 400 });
      }
      requestedStatus = value.status;
    }

    try {
      const status = requestedStatus
        ? await options.provider.setPreference(session.email, requestedStatus)
        : await options.provider.getPreference(session.email);
      options.logger.info("notification_preference_complete", {});
      return jsonResponse({ ok: true, status });
    } catch {
      options.logger.warn("notification_preference_failed", {
        code: "notification_upstream_failure",
      });
      return jsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }
  };
}
