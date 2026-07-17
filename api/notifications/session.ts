import {
  createSessionHandler,
} from "../../server/notifications/auth.js";
import { readNotificationSessionConfig } from "../../server/notifications/config.js";
import { jsonResponse } from "../../server/notifications/http.js";
import { consoleSafeLogger } from "../../server/notifications/logger.js";

export default {
  async fetch(request: Request): Promise<Response> {
    let config;
    try {
      config = readNotificationSessionConfig(process.env);
    } catch {
      return jsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503 },
      );
    }
    return createSessionHandler({
      signingSecret: config.signingSecret,
      siteOrigin: config.siteOrigin,
      logger: consoleSafeLogger,
    })(request);
  },
};
