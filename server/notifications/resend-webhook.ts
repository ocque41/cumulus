import { Webhook } from "svix";

import {
  isRecord,
  readSmallText,
  RequestBodyError,
  webhookJsonResponse,
} from "./http.js";
import { normalizeNotificationEmail } from "./security.js";
import type {
  NotificationProvider,
  ProviderSuppressionEventType,
  SafeLogger,
} from "./types.js";

const SUPPORTED_EVENT_TYPES = new Set<ProviderSuppressionEventType>([
  "email.bounced",
  "email.complained",
  "email.suppressed",
]);

interface ResendWebhookHandlerOptions {
  webhookSecret: string;
  provider: Pick<NotificationProvider, "suppressContact">;
  logger: SafeLogger;
  verify?: (
    payload: string,
    headers: Record<string, string>,
  ) => unknown;
}

function invalidWebhook(status = 400): Response {
  return webhookJsonResponse(
    { ok: false, error: "invalid_webhook" },
    { status },
  );
}

export function createResendWebhookHandler(
  options: ResendWebhookHandlerOptions,
): (request: Request) => Promise<Response> {
  const verifier = options.verify ?? ((payload, headers) => (
    new Webhook(options.webhookSecret).verify(payload, headers)
  ));

  return async (request) => {
    if (request.method !== "POST") {
      return webhookJsonResponse(
        { ok: false, error: "method_not_allowed" },
        { status: 405, headers: { Allow: "POST" } },
      );
    }
    const headers = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };
    if (Object.values(headers).some((value) => value.length < 1)) {
      return invalidWebhook();
    }

    let payload: string;
    try {
      payload = await readSmallText(request, 65_536);
    } catch (error) {
      return invalidWebhook(error instanceof RequestBodyError ? error.status : 400);
    }

    let value: unknown;
    try {
      value = verifier(payload, headers);
    } catch {
      return invalidWebhook();
    }
    if (!isRecord(value) || typeof value.type !== "string") {
      return invalidWebhook();
    }
    if (!SUPPORTED_EVENT_TYPES.has(value.type as ProviderSuppressionEventType)) {
      return webhookJsonResponse({ ok: true, disposition: "ignored" });
    }
    if (!isRecord(value.data) || !Array.isArray(value.data.to)) {
      return invalidWebhook();
    }
    const recipients = [...new Set(value.data.to.map((item) => (
      typeof item === "string" ? normalizeNotificationEmail(item) : null
    )))].filter((item): item is string => item !== null);
    if (recipients.length < 1 || recipients.length > 10) {
      return invalidWebhook();
    }

    try {
      let suppressed = false;
      for (const email of recipients) {
        suppressed = (
          await options.provider.suppressContact(email) === "suppressed"
        ) || suppressed;
      }
      const disposition = suppressed ? "suppressed" : "ignored";
      options.logger.info("notification_webhook_complete", {
        eventType: value.type as ProviderSuppressionEventType,
        disposition,
      });
      return webhookJsonResponse({ ok: true, disposition });
    } catch {
      options.logger.warn("notification_webhook_failed", {
        eventType: value.type as ProviderSuppressionEventType,
        code: "notification_upstream_failure",
      });
      return webhookJsonResponse(
        { ok: false, error: "webhook_processing_unavailable" },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }
  };
}
