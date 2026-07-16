import { readUnsubscribeConfig } from "../../server/notifications/config.js";
import { unsubscribeJsonResponse } from "../../server/notifications/http.js";
import { consoleSafeLogger } from "../../server/notifications/logger.js";
import { SupabaseNotificationStore } from "../../server/notifications/supabase.js";
import { createUnsubscribeHandler } from "../../server/notifications/unsubscribe.js";

export default {
  async fetch(request: Request): Promise<Response> {
    let config;
    try {
      config = readUnsubscribeConfig(process.env);
    } catch {
      return unsubscribeJsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503 },
      );
    }

    const store = new SupabaseNotificationStore({
      supabaseUrl: config.supabaseUrl,
      serviceRoleKey: config.supabaseServiceRoleKey,
    });
    const handler = createUnsubscribeHandler({
      unsubscribeSecret: config.unsubscribeSecret,
      store,
      logger: consoleSafeLogger,
    });
    return handler(request);
  },
};
