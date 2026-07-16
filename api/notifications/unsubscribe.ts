import { readUnsubscribeConfig } from "../../server/notifications/config";
import { unsubscribeJsonResponse } from "../../server/notifications/http";
import { consoleSafeLogger } from "../../server/notifications/logger";
import { SupabaseNotificationStore } from "../../server/notifications/supabase";
import { createUnsubscribeHandler } from "../../server/notifications/unsubscribe";

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
