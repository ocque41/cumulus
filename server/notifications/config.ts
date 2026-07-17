export interface NotificationAuthConfig {
  resendApiKey: string;
  fromEmail: string;
  signingSecret: string;
  siteOrigin: string;
}

export interface NotificationSessionConfig {
  signingSecret: string;
  siteOrigin: string;
}

export interface NotificationPreferenceConfig extends NotificationSessionConfig {
  resendApiKey: string;
  fromEmail: string;
  segmentId: string;
  topicId: string;
}

export interface NotificationConfig extends NotificationPreferenceConfig {
  fromEmail: string;
  publishSecret: string;
  postalAddress: string;
}

export interface ResendWebhookConfig {
  resendApiKey: string;
  fromEmail: string;
  segmentId: string;
  siteOrigin: string;
  topicId: string;
  webhookSecret: string;
}

export class NotificationConfigurationError extends Error {
  readonly code = "notification_configuration_error";

  constructor() {
    super("Notification configuration is incomplete or invalid.");
    this.name = "NotificationConfigurationError";
  }
}

function requireValue(
  env: Record<string, string | undefined>,
  name: string,
): string {
  const value = env[name]?.trim();
  if (!value) throw new NotificationConfigurationError();
  return value;
}

function requireSecret(
  env: Record<string, string | undefined>,
  name: string,
): string {
  const value = requireValue(env, name);
  if (new TextEncoder().encode(value).byteLength < 32) {
    throw new NotificationConfigurationError();
  }
  return value;
}

function normalizeOrigin(value: string, requireCumulusDomain: boolean): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new NotificationConfigurationError();
  }

  const localHostname =
    url.hostname === "localhost"
    || url.hostname === "127.0.0.1"
    || url.hostname === "terminal.local";
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && localHostname))
    || url.username
    || url.password
    || url.search
    || url.hash
    || (url.pathname !== "/" && url.pathname !== "")
    || (requireCumulusDomain
      && !localHostname
      && url.hostname !== "cumulush.com"
      && !url.hostname.endsWith(".cumulush.com"))
  ) {
    throw new NotificationConfigurationError();
  }

  return url.origin;
}

function validateFromEmail(value: string, requireCumulusDomain: boolean): string {
  const mailbox = "[^<>\\s@]+@[^<>\\s@]+";
  const pattern = new RegExp(`^(?:[^<>\\r\\n]+ <${mailbox}>|${mailbox})$`);
  const address = value.match(/<([^<>]+)>$/)?.[1] ?? value;
  const domain = address.split("@")[1]?.toLowerCase() ?? "";
  if (
    value.length > 320
    || /[\r\n]/.test(value)
    || !pattern.test(value)
    || (requireCumulusDomain
      && domain !== "cumulush.com"
      && !domain.endsWith(".cumulush.com"))
  ) {
    throw new NotificationConfigurationError();
  }
  return value;
}

function validatePostalAddress(value: string): string {
  const byteLength = new TextEncoder().encode(value).byteLength;
  const hasControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
  const obviousPlaceholder =
    /\b(?:example|placeholder|replace(?:[- ]with)?|todo|tbd|your[- ](?:postal[- ]?)?address|123 main (?:st(?:reet)?))\b/i;
  if (
    byteLength < 8
    || byteLength > 320
    || hasControlCharacter
    || obviousPlaceholder.test(value)
  ) {
    throw new NotificationConfigurationError();
  }
  return value;
}

function validateProviderId(value: string): string {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(value)) {
    throw new NotificationConfigurationError();
  }
  return value;
}

function validateResendApiKey(value: string): string {
  if (!/^re_[A-Za-z0-9_-]{16,}$/.test(value)) {
    throw new NotificationConfigurationError();
  }
  return value;
}

function requireCumulusDomain(env: Record<string, string | undefined>): boolean {
  return env.VERCEL_ENV === "production";
}

function readSessionConfig(
  env: Record<string, string | undefined>,
): NotificationSessionConfig {
  return {
    signingSecret: requireSecret(env, "NOTIFICATION_UNSUBSCRIBE_SECRET"),
    siteOrigin: normalizeOrigin(
      requireValue(env, "NEXT_PUBLIC_SITE_URL"),
      requireCumulusDomain(env),
    ),
  };
}

function readProviderConfig(env: Record<string, string | undefined>) {
  return {
    resendApiKey: validateResendApiKey(requireValue(env, "RESEND_API_KEY")),
    segmentId: validateProviderId(
      requireValue(env, "RESEND_NOTIFICATION_SEGMENT_ID"),
    ),
    topicId: validateProviderId(
      requireValue(env, "RESEND_NOTIFICATION_TOPIC_ID"),
    ),
  };
}

export function readNotificationAuthConfig(
  env: Record<string, string | undefined>,
): NotificationAuthConfig {
  const production = requireCumulusDomain(env);
  return {
    resendApiKey: validateResendApiKey(requireValue(env, "RESEND_API_KEY")),
    fromEmail: validateFromEmail(
      requireValue(env, "NOTIFICATION_FROM_EMAIL"),
      production,
    ),
    ...readSessionConfig(env),
  };
}

export function readNotificationSessionConfig(
  env: Record<string, string | undefined>,
): NotificationSessionConfig {
  return readSessionConfig(env);
}

export function readNotificationPreferenceConfig(
  env: Record<string, string | undefined>,
): NotificationPreferenceConfig {
  const production = requireCumulusDomain(env);
  return {
    ...readSessionConfig(env),
    ...readProviderConfig(env),
    fromEmail: validateFromEmail(
      requireValue(env, "NOTIFICATION_FROM_EMAIL"),
      production,
    ),
  };
}

export function readNotificationConfig(
  env: Record<string, string | undefined>,
): NotificationConfig {
  const production = requireCumulusDomain(env);
  if (production) requireSecret(env, "RESEND_WEBHOOK_SECRET");
  const publishSecret = requireSecret(env, "NOTIFICATION_PUBLISH_SECRET");
  const session = readSessionConfig(env);
  if (publishSecret === session.signingSecret) {
    throw new NotificationConfigurationError();
  }
  return {
    ...session,
    ...readProviderConfig(env),
    fromEmail: validateFromEmail(
      requireValue(env, "NOTIFICATION_FROM_EMAIL"),
      production,
    ),
    postalAddress: validatePostalAddress(
      requireValue(env, "NOTIFICATION_POSTAL_ADDRESS"),
    ),
    publishSecret,
  };
}

export function readResendWebhookConfig(
  env: Record<string, string | undefined>,
): ResendWebhookConfig {
  const production = requireCumulusDomain(env);
  return {
    ...readProviderConfig(env),
    fromEmail: validateFromEmail(
      requireValue(env, "NOTIFICATION_FROM_EMAIL"),
      production,
    ),
    siteOrigin: normalizeOrigin(
      requireValue(env, "NEXT_PUBLIC_SITE_URL"),
      production,
    ),
    webhookSecret: requireSecret(env, "RESEND_WEBHOOK_SECRET"),
  };
}
