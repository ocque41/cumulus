import { Webhook } from "svix";
import {
  isRecord,
  readSmallText,
  RequestBodyError,
  webhookJsonResponse,
} from "./http.js";
import type {
  ProviderSuppressionEventType,
  ProviderSuppressionStore,
  SafeLogger,
} from "./types.js";

const MAXIMUM_WEBHOOK_BYTES = 65_536;
const PROVIDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,255}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORTED_EVENT_TYPES = new Set<ProviderSuppressionEventType>([
  "email.bounced",
  "email.complained",
  "email.suppressed",
]);

interface ResendWebhookHandlerOptions {
  webhookSecret: string;
  store: ProviderSuppressionStore;
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

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function createResendWebhookHandler(
  options: ResendWebhookHandlerOptions,
): (request: Request) => Promise<Response> {
  const verifier = options.verify ?? ((payload, headers) => (
    new Webhook(options.webhookSecret).verify(payload, headers)
  ));

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return webhookJsonResponse(
        { ok: false, error: "method_not_allowed" },
        { status: 405, headers: { Allow: "POST" } },
      );
    }

    const providerEventId = request.headers.get("svix-id") ?? "";
    const timestamp = request.headers.get("svix-timestamp") ?? "";
    const signature = request.headers.get("svix-signature") ?? "";
    if (
      !PROVIDER_ID_PATTERN.test(providerEventId)
      || !timestamp
      || timestamp.length > 32
      || !signature
      || signature.length > 2048
    ) {
      return invalidWebhook();
    }

    let rawBody: string;
    try {
      rawBody = await readSmallText(request, MAXIMUM_WEBHOOK_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return invalidWebhook(error.status);
      }
      return invalidWebhook();
    }

    let verified: unknown;
    try {
      verified = verifier(rawBody, {
        "svix-id": providerEventId,
        "svix-timestamp": timestamp,
        "svix-signature": signature,
      });
    } catch {
      options.logger.warn("notification_webhook_rejected", {
        code: "invalid_signature",
      });
      return invalidWebhook();
    }

    if (!isRecord(verified) || typeof verified.type !== "string") {
      return invalidWebhook();
    }
    if (!SUPPORTED_EVENT_TYPES.has(verified.type as ProviderSuppressionEventType)) {
      return webhookJsonResponse({ ok: true, disposition: "ignored" });
    }

    const eventType = verified.type as ProviderSuppressionEventType;
    if (!isRecord(verified.data)) return invalidWebhook();
    const tags = verified.data.tags;
    if (
      !isRecord(tags)
      || tags.category !== "cumulus_blog_notification"
    ) {
      options.logger.info("notification_webhook_ignored", {
        eventType,
        disposition: "ignored",
      });
      return webhookJsonResponse({ ok: true, disposition: "ignored" });
    }

    const providerMessageId = verified.data.email_id;
    const recipients = verified.data.to;
    if (
      typeof providerMessageId !== "string"
      || !PROVIDER_ID_PATTERN.test(providerMessageId)
      || !Array.isArray(recipients)
      || recipients.length !== 1
      || typeof recipients[0] !== "string"
      || recipients[0].length > 320
      || !EMAIL_PATTERN.test(recipients[0])
    ) {
      return invalidWebhook();
    }

    try {
      const userId = await options.store.findDeliveryOwner(providerMessageId);
      if (!userId) {
        options.logger.warn("notification_webhook_deferred", {
          eventType,
          disposition: "unmatched",
        });
        return webhookJsonResponse(
          { ok: false, error: "webhook_processing_deferred" },
          { status: 503, headers: { "Retry-After": "30" } },
        );
      }

      const recipient = await options.store.getAuthoritativeRecipient(userId);
      const recipientMatches = Boolean(
        recipient
        && normalizeEmail(recipient.email) === normalizeEmail(recipients[0]),
      );
      const disposition = await options.store.processProviderSuppressionEvent({
        providerEventId,
        providerMessageId,
        eventType,
        userId,
        recipientMatches,
      });
      if (disposition === "unmatched") {
        return webhookJsonResponse(
          { ok: false, error: "webhook_processing_deferred" },
          { status: 503, headers: { "Retry-After": "30" } },
        );
      }

      options.logger.info("notification_webhook_processed", {
        eventType,
        disposition,
      });
      return webhookJsonResponse({ ok: true, disposition });
    } catch {
      options.logger.warn("notification_webhook_failed", {
        eventType,
        code: "provider_event_store_unavailable",
      });
      return webhookJsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503, headers: { "Retry-After": "30" } },
      );
    }
  };
}
