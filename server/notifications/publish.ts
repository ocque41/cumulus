import { isRecord, jsonResponse, readSmallJson, RequestBodyError } from "./http.js";
import { renderPostNotification } from "./render.js";
import {
  createUnsubscribeToken,
  deliveryIdempotencyKey,
  hashDeliveryPayloadIdentity,
  verifyBearerAuthorization,
} from "./security.js";
import type {
  NotificationMailer,
  NotificationStore,
  PublishablePost,
  PublishResult,
  SafeLogger,
} from "./types.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_PROVIDER_ATTEMPTS = 40;
const EXECUTION_BUDGET_MS = 50_000;
const DISCOVERY_BUDGET_MS = 10_000;
const PRECLAIM_REQUIRED_MS = 40_000;
const PROVIDER_AND_FINALIZE_REQUIRED_MS = 25_000;

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

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
  store: NotificationStore;
  mailer: NotificationMailer;
  siteOrigin: string;
  unsubscribeSecret: string;
  postalAddress: string;
  senderIdentity: string;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => Date;
  runtimeNow?: () => number;
}): Promise<PublishResult> {
  const runtimeNow = input.runtimeNow ?? Date.now;
  const startedAt = runtimeNow();
  const subscriptions = await input.store.listActiveConfirmedSubscriptions(
    AbortSignal.timeout(DISCOVERY_BUDGET_MS),
  );
  const result: PublishResult = {
    ok: true,
    dryRun: input.dryRun,
    subscriptions: subscriptions.length,
    eligible: 0,
    claimed: 0,
    sent: 0,
    retryable: 0,
    failed: 0,
    conflicts: 0,
    deferred: 0,
    skipped: 0,
    hasMore: false,
    incomplete: false,
    retryAfterSeconds: 0,
  };
  const seenUserIds = new Set<string>();
  let providerCalls = 0;
  const sleep = input.sleep ?? defaultSleep;
  const now = input.now ?? (() => new Date());
  const remainingRuntime = () => Math.max(
    0,
    EXECUTION_BUDGET_MS - (runtimeNow() - startedAt),
  );

  function defer(retryAfterSeconds: number): void {
    result.deferred += 1;
    result.hasMore = true;
    result.retryAfterSeconds = Math.max(
      result.retryAfterSeconds,
      Math.ceil(retryAfterSeconds),
    );
  }

  for (const subscription of subscriptions) {
    if (!input.dryRun && providerCalls >= MAX_PROVIDER_ATTEMPTS) {
      result.hasMore = true;
      break;
    }
    if (!input.dryRun && remainingRuntime() < PRECLAIM_REQUIRED_MS) {
      result.hasMore = true;
      result.retryAfterSeconds = Math.max(result.retryAfterSeconds, 1);
      break;
    }
    if (seenUserIds.has(subscription.userId)) {
      result.skipped += 1;
      continue;
    }
    seenUserIds.add(subscription.userId);

    const recipient = await input.store.getAuthoritativeRecipient(
      subscription.userId,
    );
    if (!recipient) {
      result.skipped += 1;
      continue;
    }
    result.eligible += 1;

    if (input.dryRun) continue;

    const idempotencyKey = deliveryIdempotencyKey(
      input.post.slug,
      subscription.userId,
    );
    const contentHash = hashDeliveryPayloadIdentity({
      post: input.post,
      recipientEmail: recipient.email,
      senderIdentity: input.senderIdentity,
      siteOrigin: input.siteOrigin,
      postalAddress: input.postalAddress,
      unsubscribeSecret: input.unsubscribeSecret,
    });
    const claim = await input.store.claimDelivery(
      input.post.slug,
      subscription.userId,
      contentHash,
      idempotencyKey,
    );
    if (claim.disposition === "content_mismatch") {
      result.conflicts += 1;
      result.skipped += 1;
      continue;
    }
    if (
      claim.disposition === "in_progress"
      || claim.disposition === "retry_later"
    ) {
      defer(30);
      result.skipped += 1;
      continue;
    }
    if (claim.disposition !== "claimed") {
      result.skipped += 1;
      continue;
    }
    if (
      !claim.deliveryId
      || !claim.leaseToken
      || !claim.unsubscribeTokenExpiresAt
    ) {
      throw new Error("invalid_claim_contract");
    }
    result.claimed += 1;

    if (claim.unsubscribeTokenExpiresAt.getTime() <= now().getTime()) {
      const status = await input.store.recordDeliveryFailure({
        deliveryId: claim.deliveryId,
        leaseToken: claim.leaseToken,
        failureCode: "invalid_token_expiry",
        retryable: false,
        retryAfterSeconds: 60,
      });
      if (!status) throw new Error("delivery_failure_conflict");
      result.failed += 1;
      continue;
    }

    const unsubscribeToken = createUnsubscribeToken({
      userId: subscription.userId,
      expiresAt: claim.unsubscribeTokenExpiresAt,
      secret: input.unsubscribeSecret,
    });
    const postUrl = new URL(
      `/logs/${encodeURIComponent(input.post.slug)}`,
      input.siteOrigin,
    ).toString();
    const browserUnsubscribeUrl = new URL("/unsubscribe", input.siteOrigin);
    browserUnsubscribeUrl.hash = new URLSearchParams({
      token: unsubscribeToken,
    }).toString();
    const oneClickUnsubscribeUrl = new URL(
      "/api/notifications/unsubscribe",
      input.siteOrigin,
    );
    oneClickUnsubscribeUrl.searchParams.set("token", unsubscribeToken);

    const reservedAt = await input.store.reserveDispatchSlot(
      claim.deliveryId,
      claim.leaseToken,
    );
    if (!reservedAt) {
      const status = await input.store.recordDeliveryFailure({
        deliveryId: claim.deliveryId,
        leaseToken: claim.leaseToken,
        failureCode: "dispatch_slot_unavailable",
        retryable: true,
        retryAfterSeconds: 30,
      });
      if (status === "retryable") {
        result.retryable += 1;
        defer(30);
      } else if (status === "failed") {
        result.failed += 1;
      } else {
        result.skipped += 1;
      }
      continue;
    }
    const waitMilliseconds = Math.max(
      0,
      reservedAt.getTime() - now().getTime(),
    );
    if (
      remainingRuntime()
      < waitMilliseconds + PROVIDER_AND_FINALIZE_REQUIRED_MS
    ) {
      const retryAfterSeconds = Math.max(
        30,
        Math.min(3600, Math.ceil(waitMilliseconds / 1000) + 1),
      );
      const status = await input.store.recordDeliveryFailure({
        deliveryId: claim.deliveryId,
        leaseToken: claim.leaseToken,
        failureCode: "runtime_budget_deferred",
        retryable: true,
        retryAfterSeconds,
      });
      if (status === "retryable") {
        result.retryable += 1;
        defer(retryAfterSeconds);
      } else if (status === "failed") {
        result.failed += 1;
      } else {
        result.skipped += 1;
      }
      continue;
    }
    if (waitMilliseconds > 0) await sleep(waitMilliseconds);

    const started = await input.store.startProviderAttempt(
      claim.deliveryId,
      claim.leaseToken,
    );
    if (!started) {
      const status = await input.store.recordDeliveryFailure({
        deliveryId: claim.deliveryId,
        leaseToken: claim.leaseToken,
        failureCode: "provider_start_deferred",
        retryable: true,
        retryAfterSeconds: 30,
      });
      if (status === "retryable") {
        result.retryable += 1;
        defer(30);
      } else if (status === "failed") {
        result.failed += 1;
      } else {
        result.skipped += 1;
      }
      continue;
    }

    providerCalls += 1;
    const mailResult = await input.mailer.send(
      renderPostNotification({
        post: input.post,
        postUrl,
        browserUnsubscribeUrl: browserUnsubscribeUrl.toString(),
        oneClickUnsubscribeUrl: oneClickUnsubscribeUrl.toString(),
        recipientEmail: recipient.email,
        idempotencyKey,
        postalAddress: input.postalAddress,
      }),
    );

    if (mailResult.ok) {
      const completed = await input.store.completeDelivery(
        claim.deliveryId,
        claim.leaseToken,
        mailResult.providerMessageId,
      );
      if (!completed) throw new Error("delivery_completion_conflict");
      result.sent += 1;
      continue;
    }

    const failureStatus = await input.store.recordDeliveryFailure({
      deliveryId: claim.deliveryId,
      leaseToken: claim.leaseToken,
      failureCode: mailResult.failureCode,
      retryable: mailResult.retryable,
      retryAfterSeconds: mailResult.retryAfterSeconds,
    });
    if (!failureStatus) throw new Error("delivery_failure_conflict");
    if (failureStatus === "retryable") {
      result.retryable += 1;
      defer(mailResult.retryAfterSeconds);
    }
    else result.failed += 1;
  }

  result.incomplete = result.hasMore;
  return result;
}

interface PublishHandlerOptions {
  publishSecret: string;
  getPublishedPostBySlug: (slug: string) => PublishablePost | undefined;
  publish: (
    post: PublishablePost,
    dryRun: boolean,
  ) => Promise<PublishResult>;
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
    if (
      !verifyBearerAuthorization(
        request.headers.get("authorization"),
        options.publishSecret,
      )
    ) {
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
      return jsonResponse(
        { ok: false, error: "invalid_request" },
        { status: 400 },
      );
    }
    const post = options.getPublishedPostBySlug(body.slug);
    if (!post || !isValidPost(post) || post.slug !== body.slug) {
      return jsonResponse(
        { ok: false, error: "published_post_not_found" },
        { status: 404 },
      );
    }

    try {
      const result = await options.publish(post, body.dryRun);
      options.logger.info("notification_publish_complete", {
        postSlug: post.slug,
        dryRun: result.dryRun,
        subscriptions: result.subscriptions,
        eligible: result.eligible,
        claimed: result.claimed,
        sent: result.sent,
        retryable: result.retryable,
        failed: result.failed,
        conflicts: result.conflicts,
        deferred: result.deferred,
        skipped: result.skipped,
        hasMore: result.hasMore,
        incomplete: result.incomplete,
      });
      return jsonResponse(result, {
        status: result.incomplete ? 202 : 200,
        headers: result.incomplete
          ? { "Retry-After": String(Math.max(1, result.retryAfterSeconds)) }
          : undefined,
      });
    } catch {
      options.logger.warn("notification_publish_failed", {
        postSlug: post.slug,
        code: "notification_upstream_failure",
      });
      return jsonResponse(
        { ok: false, error: "notification_publish_failed" },
        { status: 502 },
      );
    }
  };
}
