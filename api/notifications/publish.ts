import { getPublishedPostBySlug } from "../../src/content/posts";
import { readNotificationConfig } from "../../server/notifications/config";
import { jsonResponse } from "../../server/notifications/http";
import { consoleSafeLogger } from "../../server/notifications/logger";
import {
  createPublishHandler,
  publishPostNotifications,
} from "../../server/notifications/publish";
import { ResendMailer } from "../../server/notifications/resend";
import { SupabaseNotificationStore } from "../../server/notifications/supabase";

export default {
  async fetch(request: Request): Promise<Response> {
    let config;
    try {
      config = readNotificationConfig(process.env);
    } catch {
      return jsonResponse(
        { ok: false, error: "notification_service_unavailable" },
        { status: 503 },
      );
    }

    const store = new SupabaseNotificationStore({
      supabaseUrl: config.supabaseUrl,
      serviceRoleKey: config.supabaseServiceRoleKey,
    });
    const mailer = new ResendMailer({
      apiKey: config.resendApiKey,
      fromEmail: config.fromEmail,
    });
    const handler = createPublishHandler({
      publishSecret: config.publishSecret,
      getPublishedPostBySlug(slug) {
        const post = getPublishedPostBySlug(slug);
        if (!post) return undefined;
        return {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          date: post.date,
        };
      },
      publish(post, dryRun) {
        return publishPostNotifications({
          post,
          dryRun,
          store,
          mailer,
          siteOrigin: config.siteOrigin,
          unsubscribeSecret: config.unsubscribeSecret,
          postalAddress: config.postalAddress,
          senderIdentity: config.fromEmail,
        });
      },
      logger: consoleSafeLogger,
    });

    return handler(request);
  },
};
