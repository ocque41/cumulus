import { createSignInHandler } from "../../server/notifications/auth.js";
import { readNotificationAuthConfig } from "../../server/notifications/config.js";
import { jsonResponse } from "../../server/notifications/http.js";
import { consoleSafeLogger } from "../../server/notifications/logger.js";
import { ResendMagicLinkSender } from "../../server/notifications/resend.js";

export default {
  async fetch(request: Request): Promise<Response> {
    let config;
    try {
      config = readNotificationAuthConfig(process.env);
    } catch {
      return jsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503 },
      );
    }
    const sender = new ResendMagicLinkSender({
      apiKey: config.resendApiKey,
      fromEmail: config.fromEmail,
      siteOrigin: config.siteOrigin,
    });
    return createSignInHandler({
      sender,
      signingSecret: config.signingSecret,
      siteOrigin: config.siteOrigin,
      logger: consoleSafeLogger,
    })(request);
  },
};
