import { readResendWebhookConfig } from "../../server/notifications/config.js";
import { webhookJsonResponse } from "../../server/notifications/http.js";
import { consoleSafeLogger } from "../../server/notifications/logger.js";
import { createResendWebhookHandler } from "../../server/notifications/resend-webhook.js";
import { SupabaseNotificationStore } from "../../server/notifications/supabase.js";

export default {
  async fetch(request: Request): Promise<Response> {
    let config;
    try {
      config = readResendWebhookConfig(process.env);
    } catch {
      return webhookJsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503 },
      );
    }

    const store = new SupabaseNotificationStore({
      supabaseUrl: config.supabaseUrl,
      serviceRoleKey: config.supabaseServiceRoleKey,
    });
    return createResendWebhookHandler({
      webhookSecret: config.webhookSecret,
      store,
      logger: consoleSafeLogger,
    })(request);
  },
};
