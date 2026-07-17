import { getPublishedPostBySlug } from "../../src/content/posts.js";
import { readNotificationConfig } from "../../server/notifications/config.js";
import { jsonResponse } from "../../server/notifications/http.js";
import { consoleSafeLogger } from "../../server/notifications/logger.js";
import {
  createPublishHandler,
  publishPostNotifications,
} from "../../server/notifications/publish.js";
import { ResendNotificationProvider } from "../../server/notifications/resend.js";

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

    const provider = new ResendNotificationProvider({
      apiKey: config.resendApiKey,
      fromEmail: config.fromEmail,
      siteOrigin: config.siteOrigin,
      segmentId: config.segmentId,
      topicId: config.topicId,
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
          provider,
          siteOrigin: config.siteOrigin,
          postalAddress: config.postalAddress,
        });
      },
      logger: consoleSafeLogger,
    });

    return handler(request);
  },
};
