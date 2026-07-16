export interface PublishablePost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

export interface NotificationSubscription {
  userId: string;
}

export interface AuthoritativeRecipient {
  email: string;
  emailConfirmedAt: string;
}

export type ClaimDisposition =
  | "claimed"
  | "inactive"
  | "in_progress"
  | "retry_later"
  | "sent"
  | "terminal"
  | "content_mismatch";

export interface DeliveryClaim {
  disposition: ClaimDisposition;
  deliveryId: string | null;
  leaseToken: string | null;
  attemptCount: number;
  unsubscribeTokenExpiresAt: Date | null;
}

export interface NotificationStore {
  listActiveConfirmedSubscriptions(
    signal?: AbortSignal,
  ): Promise<NotificationSubscription[]>;
  getAuthoritativeRecipient(
    userId: string,
  ): Promise<AuthoritativeRecipient | null>;
  claimDelivery(
    postSlug: string,
    userId: string,
    contentHash: string,
    providerIdempotencyKey: string,
  ): Promise<DeliveryClaim>;
  reserveDispatchSlot(
    deliveryId: string,
    leaseToken: string,
  ): Promise<Date | null>;
  startProviderAttempt(deliveryId: string, leaseToken: string): Promise<boolean>;
  completeDelivery(
    deliveryId: string,
    leaseToken: string,
    providerMessageId: string,
  ): Promise<boolean>;
  recordDeliveryFailure(input: {
    deliveryId: string;
    leaseToken: string;
    failureCode: string;
    retryable: boolean;
    retryAfterSeconds: number;
  }): Promise<"retryable" | "failed" | null>;
  cancelDelivery(deliveryId: string, leaseToken: string): Promise<boolean>;
  unsubscribe(userId: string): Promise<void>;
}

export interface ProviderSuppressionStore {
  findDeliveryOwner(providerMessageId: string): Promise<string | null>;
  getAuthoritativeRecipient(
    userId: string,
  ): Promise<AuthoritativeRecipient | null>;
  processProviderSuppressionEvent(input: {
    providerEventId: string;
    providerMessageId: string;
    eventType: ProviderSuppressionEventType;
    userId: string;
    recipientMatches: boolean;
  }): Promise<ProviderSuppressionDisposition>;
}

export type ProviderSuppressionEventType =
  | "email.bounced"
  | "email.complained"
  | "email.suppressed";

export type ProviderSuppressionDisposition =
  | "suppressed"
  | "ignored"
  | "duplicate"
  | "unmatched";

export interface NotificationEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  browserUnsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  idempotencyKey: string;
}

export type MailResult =
  | { ok: true; providerMessageId: string }
  | {
      ok: false;
      failureCode: string;
      retryable: boolean;
      retryAfterSeconds: number;
    };

export interface NotificationMailer {
  send(message: NotificationEmail): Promise<MailResult>;
}

export interface PublishResult {
  ok: true;
  dryRun: boolean;
  subscriptions: number;
  eligible: number;
  claimed: number;
  sent: number;
  retryable: number;
  failed: number;
  conflicts: number;
  deferred: number;
  skipped: number;
  hasMore: boolean;
  incomplete: boolean;
  retryAfterSeconds: number;
}

export interface SafeLogFields {
  postSlug?: string;
  dryRun?: boolean;
  subscriptions?: number;
  eligible?: number;
  claimed?: number;
  sent?: number;
  retryable?: number;
  failed?: number;
  conflicts?: number;
  deferred?: number;
  skipped?: number;
  hasMore?: boolean;
  incomplete?: boolean;
  retryAfterSeconds?: number;
  code?: string;
  eventType?: ProviderSuppressionEventType;
  disposition?: ProviderSuppressionDisposition;
}

export interface SafeLogger {
  info(event: string, fields: SafeLogFields): void;
  warn(event: string, fields: SafeLogFields): void;
}
