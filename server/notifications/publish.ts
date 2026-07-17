import { isRecord, jsonResponse, readSmallJson, RequestBodyError } from "./http.js";
import { NotificationProviderError } from "./resend.js";
import { verifyBearerAuthorization } from "./security.js";
import type {
  NotificationProvider,
  PublishablePost,
  PublishResult,
  SafeLogger,
} from "./types.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidPost(post: PublishablePost): boolean {
  return (
    SLUG_PATTERN.test(post.slug)
    && post.slug.length <= 160
    && post.title.trim().length >= 1
    && post.title.length <= 180
    && post.excerpt.trim().length >= 1
    && post.excerpt.length <= 600
    && /^\d{4}-\d{2}-\d{2}$/.test(post.date)
    && !Number.isNaN(Date.parse(`${post.date}T00:00:00Z`))
  );
}

export async function publishPostNotifications(input: {
  post: PublishablePost;
  dryRun: boolean;
  provider: Pick<NotificationProvider, "publishPost">;
  siteOrigin: string;
  postalAddress: string;
}): Promise<PublishResult> {
  if (!isValidPost(input.post)) throw new Error("invalid_published_post");
  const publication = await input.provider.publishPost({
    post: input.post,
    siteOrigin: input.siteOrigin,
    postalAddress: input.postalAddress,
    dryRun: input.dryRun,
  });
  return {
    ok: true,
    dryRun: input.dryRun,
    status: publication.status,
  };
}

interface PublishHandlerOptions {
  publishSecret: string;
  getPublishedPostBySlug: (slug: string) => PublishablePost | undefined;
  publish: (post: PublishablePost, dryRun: boolean) => Promise<PublishResult>;
  logger: SafeLogger;
}

function parsePublishBody(value: unknown): { slug: string; dryRun: boolean } | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.some((key) => key !== "slug" && key !== "dryRun")) return null;
  if (
    typeof value.slug !== "string"
    || value.slug.length < 1
    || value.slug.length > 160
    || !SLUG_PATTERN.test(value.slug)
    || (value.dryRun !== undefined && typeof value.dryRun !== "boolean")
  ) {
    return null;
  }
  return { slug: value.slug, dryRun: value.dryRun === true };
}

export function createPublishHandler(
  options: PublishHandlerOptions,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== "POST") {
      return jsonResponse(
        { ok: false, error: "method_not_allowed" },
        { status: 405, headers: { Allow: "POST" } },
      );
    }
    if (!verifyBearerAuthorization(
      request.headers.get("authorization"),
      options.publishSecret,
    )) {
      return jsonResponse(
        { ok: false, error: "unauthorized" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
      );
    }

    let value: unknown;
    try {
      value = await readSmallJson(request);
    } catch (error) {
      const status = error instanceof RequestBodyError ? error.status : 400;
      return jsonResponse({ ok: false, error: "invalid_request" }, { status });
    }
    const body = parsePublishBody(value);
    if (!body) {
      return jsonResponse({ ok: false, error: "invalid_request" }, { status: 400 });
    }
    const post = options.getPublishedPostBySlug(body.slug);
    if (!post || !isValidPost(post)) {
      return jsonResponse({ ok: false, error: "post_not_found" }, { status: 404 });
    }

    try {
      const result = await options.publish(post, body.dryRun);
      options.logger.info("notification_publish_complete", {
        postSlug: post.slug,
        dryRun: result.dryRun,
        status: result.status,
      });
      return jsonResponse(result);
    } catch (error) {
      const conflict =
        error instanceof NotificationProviderError
        && error.code === "resend_broadcast_content_conflict";
      options.logger.warn("notification_publish_failed", {
        postSlug: post.slug,
        dryRun: body.dryRun,
        code: conflict ? "notification_content_conflict" : "notification_upstream_failure",
      });
      return jsonResponse(
        {
          ok: false,
          error: conflict
            ? "notification_content_conflict"
            : "notification_service_unavailable",
        },
        {
          status: conflict ? 409 : 503,
          headers: conflict ? undefined : { "Retry-After": "60" },
        },
      );
    }
  };
}
