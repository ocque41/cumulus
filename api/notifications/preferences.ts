import { readNotificationPreferenceConfig } from "../../server/notifications/config.js";
import { jsonResponse } from "../../server/notifications/http.js";
import { consoleSafeLogger } from "../../server/notifications/logger.js";
import { createPreferencesHandler } from "../../server/notifications/preferences.js";
import { ResendNotificationProvider } from "../../server/notifications/resend.js";

export default {
  async fetch(request: Request): Promise<Response> {
    let config;
    try {
      config = readNotificationPreferenceConfig(process.env);
    } catch {
      return jsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503 },
      );
    }
    const provider = new ResendNotificationProvider({
      apiKey: config.resendApiKey,
      fromEmail: config.fromEmail,
      siteOrigin: config.siteOrigin,
      segmentId: config.segmentId,
      topicId: config.topicId,
    });
    return createPreferencesHandler({
      provider,
      signingSecret: config.signingSecret,
      siteOrigin: config.siteOrigin,
      logger: consoleSafeLogger,
    })(request);
  },
};
