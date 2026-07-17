export interface PublishablePost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

export type NotificationPreferenceStatus = "active" | "unsubscribed";

export interface NotificationSession {
  email: string;
}

export type BroadcastPublicationStatus =
  | "dry_run"
  | "created"
  | "already_sent";

export interface BroadcastPublicationResult {
  status: BroadcastPublicationStatus;
}

export interface NotificationProvider {
  sendMagicLink(input: {
    email: string;
    link: string;
    idempotencyKey: string;
    expiresAt: Date;
  }): Promise<void>;
  getPreference(email: string): Promise<NotificationPreferenceStatus>;
  setPreference(
    email: string,
    status: NotificationPreferenceStatus,
  ): Promise<NotificationPreferenceStatus>;
  publishPost(input: {
    post: PublishablePost;
    siteOrigin: string;
    postalAddress: string;
    dryRun: boolean;
  }): Promise<BroadcastPublicationResult>;
  suppressContact(email: string): Promise<"suppressed" | "ignored">;
}

export interface PublishResult {
  ok: true;
  dryRun: boolean;
  status: BroadcastPublicationStatus;
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

export interface SafeLogFields {
  postSlug?: string;
  dryRun?: boolean;
  code?: string;
  status?: BroadcastPublicationStatus;
  eventType?: ProviderSuppressionEventType;
  disposition?: ProviderSuppressionDisposition;
}

export interface SafeLogger {
  info(event: string, fields: SafeLogFields): void;
  warn(event: string, fields: SafeLogFields): void;
}
