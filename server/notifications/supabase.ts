import { isRecord } from "./http.js";
import { isUuid } from "./security.js";
import type {
  AuthoritativeRecipient,
  ClaimDisposition,
  DeliveryClaim,
  NotificationStore,
  NotificationSubscription,
} from "./types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTENT_HASH_PATTERN = /^[a-f0-9]{64}$/;
const FAILURE_CODE_PATTERN = /^[a-z0-9_]{1,64}$/;
const PAGE_SIZE = 500;
const REQUEST_TIMEOUT_MS = 5_000;
const CLAIM_DISPOSITIONS = new Set<ClaimDisposition>([
  "claimed",
  "inactive",
  "in_progress",
  "retry_later",
  "sent",
  "terminal",
  "content_mismatch",
]);

type DeliveryFailureStatus = "retryable" | "failed" | null;

function isDeliveryFailureStatus(value: unknown): value is DeliveryFailureStatus {
  return value === null || value === "retryable" || value === "failed";
}

export class NotificationStoreError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "NotificationStoreError";
    this.code = code;
  }
}

interface SupabaseNotificationStoreOptions {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetcher?: typeof fetch;
  now?: () => Date;
}

async function safeJson(response: Response, code: string): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new NotificationStoreError(code);
  }
}

export class SupabaseNotificationStore implements NotificationStore {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly fetcher: typeof fetch;
  private readonly now: () => Date;

  constructor(options: SupabaseNotificationStoreOptions) {
    this.baseUrl = options.supabaseUrl.replace(/\/$/, "");
    this.serviceRoleKey = options.serviceRoleKey;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? (() => new Date());
  }

  private headers(extra: HeadersInit = {}): Headers {
    const headers = new Headers(extra);
    headers.set("Accept", "application/json");
    headers.set("apikey", this.serviceRoleKey);
    if (!this.serviceRoleKey.startsWith("sb_secret_")) {
      headers.set("Authorization", `Bearer ${this.serviceRoleKey}`);
    }
    return headers;
  }

  private async request(
    input: string | URL,
    init: RequestInit,
    failureCode: string,
  ): Promise<Response> {
    try {
      const perRequestTimeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
      const signal = init.signal
        ? AbortSignal.any([init.signal, perRequestTimeout])
        : perRequestTimeout;
      return await this.fetcher(input, {
        ...init,
        signal,
      });
    } catch {
      throw new NotificationStoreError(failureCode);
    }
  }

  private async rpc(name: string, body: Record<string, unknown>): Promise<unknown> {
    const response = await this.request(`${this.baseUrl}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    }, `${name}_unavailable`);
    if (!response.ok) throw new NotificationStoreError(`${name}_failed`);
    return safeJson(response, `${name}_invalid`);
  }

  async listActiveConfirmedSubscriptions(signal?: AbortSignal): Promise<
    NotificationSubscription[]
  > {
    const subscriptions: NotificationSubscription[] = [];
    let lastUserId: string | null = null;
    while (true) {
      const url = new URL(
        `${this.baseUrl}/rest/v1/blog_notification_subscriptions`,
      );
      url.searchParams.set("select", "user_id");
      url.searchParams.set("status", "eq.active");
      url.searchParams.set("confirmed_at", "not.is.null");
      url.searchParams.set("unsubscribed_at", "is.null");
      url.searchParams.set("order", "user_id.asc");
      url.searchParams.set("limit", String(PAGE_SIZE));
      if (lastUserId) url.searchParams.set("user_id", `gt.${lastUserId}`);
      const rangeHeaders = Object.fromEntries(this.headers().entries());
      rangeHeaders.Range = `0-${PAGE_SIZE - 1}`;
      const response = await this.request(url, {
        method: "GET",
        headers: rangeHeaders,
        signal,
      }, "subscription_list_unavailable");
      if (!response.ok) {
        throw new NotificationStoreError("subscription_list_failed");
      }
      const value = await safeJson(response, "subscription_list_invalid");
      if (!Array.isArray(value)) {
        throw new NotificationStoreError("subscription_list_invalid");
      }
      for (const row of value) {
        if (
          !isRecord(row)
          || typeof row.user_id !== "string"
          || !isUuid(row.user_id)
        ) {
          throw new NotificationStoreError("subscription_list_invalid");
        }
        subscriptions.push({ userId: row.user_id });
        lastUserId = row.user_id;
      }
      if (value.length < PAGE_SIZE) return subscriptions;
    }
  }

  async getAuthoritativeRecipient(
    userId: string,
  ): Promise<AuthoritativeRecipient | null> {
    if (!isUuid(userId)) return null;
    const response = await this.request(
      `${this.baseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      { method: "GET", headers: this.headers() },
      "auth_user_lookup_unavailable",
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new NotificationStoreError("auth_user_lookup_failed");
    }
    const value = await safeJson(response, "auth_user_lookup_invalid");
    const candidate = isRecord(value) && isRecord(value.user) ? value.user : value;
    if (!isRecord(candidate)) {
      throw new NotificationStoreError("auth_user_lookup_invalid");
    }
    const bannedUntil =
      typeof candidate.banned_until === "string"
        ? Date.parse(candidate.banned_until)
        : Number.NaN;
    if (
      candidate.id !== userId
      || typeof candidate.email !== "string"
      || !EMAIL_PATTERN.test(candidate.email)
      || typeof candidate.email_confirmed_at !== "string"
      || !candidate.email_confirmed_at
      || candidate.is_anonymous === true
      || (Number.isFinite(bannedUntil) && bannedUntil > this.now().getTime())
    ) {
      return null;
    }
    return {
      email: candidate.email,
      emailConfirmedAt: candidate.email_confirmed_at,
    };
  }

  async claimDelivery(
    postSlug: string,
    userId: string,
    contentHash: string,
    providerIdempotencyKey: string,
  ): Promise<DeliveryClaim> {
    if (
      !isUuid(userId)
      || !CONTENT_HASH_PATTERN.test(contentHash)
      || !/^blog-notification-[a-f0-9]{64}$/.test(providerIdempotencyKey)
    ) {
      throw new NotificationStoreError("delivery_claim_invalid_input");
    }
    const value = await this.rpc("claim_blog_notification_delivery", {
      requested_post_slug: postSlug,
      requested_user_id: userId,
      requested_content_hash: contentHash,
      requested_provider_idempotency_key: providerIdempotencyKey,
    });
    const row = Array.isArray(value) ? value[0] : null;
    if (!isRecord(row) || typeof row.disposition !== "string") {
      throw new NotificationStoreError("delivery_claim_invalid");
    }
    if (!CLAIM_DISPOSITIONS.has(row.disposition as ClaimDisposition)) {
      throw new NotificationStoreError("delivery_claim_invalid");
    }
    const deliveryId = typeof row.delivery_id === "string" ? row.delivery_id : null;
    const leaseToken =
      typeof row.delivery_lease_token === "string"
        ? row.delivery_lease_token
        : null;
    const attemptCount = row.delivery_attempt_count;
    const tokenExpiresAt =
      typeof row.token_expires_at === "string"
        ? new Date(row.token_expires_at)
        : null;
    if (
      (deliveryId !== null && !isUuid(deliveryId))
      || (leaseToken !== null && !isUuid(leaseToken))
      || !Number.isInteger(attemptCount)
      || (tokenExpiresAt !== null && Number.isNaN(tokenExpiresAt.getTime()))
      || (row.disposition === "claimed"
        && (!deliveryId || !leaseToken || !tokenExpiresAt))
    ) {
      throw new NotificationStoreError("delivery_claim_invalid");
    }
    return {
      disposition: row.disposition as ClaimDisposition,
      deliveryId,
      leaseToken,
      attemptCount: attemptCount as number,
      unsubscribeTokenExpiresAt: tokenExpiresAt,
    };
  }

  async startProviderAttempt(
    deliveryId: string,
    leaseToken: string,
  ): Promise<boolean> {
    const value = await this.rpc("start_blog_notification_provider_attempt", {
      requested_delivery_id: deliveryId,
      requested_lease_token: leaseToken,
    });
    if (typeof value !== "boolean") {
      throw new NotificationStoreError("provider_attempt_start_invalid");
    }
    return value;
  }

  async reserveDispatchSlot(
    deliveryId: string,
    leaseToken: string,
  ): Promise<Date | null> {
    const value = await this.rpc("reserve_blog_notification_dispatch_slot", {
      requested_delivery_id: deliveryId,
      requested_lease_token: leaseToken,
    });
    if (value === null) return null;
    if (typeof value !== "string") {
      throw new NotificationStoreError("dispatch_slot_invalid");
    }
    const reservedAt = new Date(value);
    if (Number.isNaN(reservedAt.getTime())) {
      throw new NotificationStoreError("dispatch_slot_invalid");
    }
    return reservedAt;
  }

  async completeDelivery(
    deliveryId: string,
    leaseToken: string,
    providerMessageId: string,
  ): Promise<boolean> {
    const value = await this.rpc("complete_blog_notification_delivery", {
      requested_delivery_id: deliveryId,
      requested_lease_token: leaseToken,
      requested_provider_message_id: providerMessageId,
    });
    if (typeof value !== "boolean") {
      throw new NotificationStoreError("delivery_completion_invalid");
    }
    return value;
  }

  async recordDeliveryFailure(input: {
    deliveryId: string;
    leaseToken: string;
    failureCode: string;
    retryable: boolean;
    retryAfterSeconds: number;
  }): Promise<"retryable" | "failed" | null> {
    if (!FAILURE_CODE_PATTERN.test(input.failureCode)) {
      throw new NotificationStoreError("delivery_failure_invalid_input");
    }
    const value = await this.rpc("record_blog_notification_delivery_failure", {
      requested_delivery_id: input.deliveryId,
      requested_lease_token: input.leaseToken,
      requested_failure_code: input.failureCode,
      requested_retryable: input.retryable,
      requested_retry_after_seconds: input.retryAfterSeconds,
    });
    if (!isDeliveryFailureStatus(value)) {
      throw new NotificationStoreError("delivery_failure_invalid");
    }
    return value;
  }

  async cancelDelivery(deliveryId: string, leaseToken: string): Promise<boolean> {
    const value = await this.rpc("cancel_blog_notification_delivery", {
      requested_delivery_id: deliveryId,
      requested_lease_token: leaseToken,
    });
    if (typeof value !== "boolean") {
      throw new NotificationStoreError("delivery_cancel_invalid");
    }
    return value;
  }

  async unsubscribe(userId: string): Promise<void> {
    const cancelled = await this.rpc(
      "unsubscribe_blog_notifications",
      { requested_user_id: userId },
    );
    if (!Number.isInteger(cancelled) || (cancelled as number) < 0) {
      throw new NotificationStoreError("unsubscribe_cancel_invalid");
    }
  }
}
