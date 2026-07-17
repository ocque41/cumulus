export interface NotificationConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string;
  fromEmail: string;
  publishSecret: string;
  unsubscribeSecret: string;
  postalAddress: string;
  siteOrigin: string;
}

export interface UnsubscribeConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  unsubscribeSecret: string;
}

export interface ResendWebhookConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
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

export function readNotificationConfig(
  env: Record<string, string | undefined>,
): NotificationConfig {
  const requireCumulusDomain = env.VERCEL_ENV === "production";
  if (requireCumulusDomain) {
    // Production delivery is safe only when provider suppressions can return
    // through an authenticated webhook. The publish path does not need the
    // value itself, but it must fail closed when that control is unavailable.
    requireSecret(env, "RESEND_WEBHOOK_SECRET");
  }
  const publishSecret = requireSecret(env, "NOTIFICATION_PUBLISH_SECRET");
  const unsubscribeSecret = requireSecret(
    env,
    "NOTIFICATION_UNSUBSCRIBE_SECRET",
  );
  if (publishSecret === unsubscribeSecret) {
    throw new NotificationConfigurationError();
  }

  return {
    supabaseUrl: normalizeOrigin(
      requireValue(env, "NEXT_PUBLIC_SUPABASE_URL"),
      false,
    ),
    supabaseServiceRoleKey: requireSecret(
      env,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    resendApiKey: requireValue(env, "RESEND_API_KEY"),
    fromEmail: validateFromEmail(
      requireValue(env, "NOTIFICATION_FROM_EMAIL"),
      requireCumulusDomain,
    ),
    postalAddress: validatePostalAddress(
      requireValue(env, "NOTIFICATION_POSTAL_ADDRESS"),
    ),
    publishSecret,
    unsubscribeSecret,
    siteOrigin: normalizeOrigin(
      requireValue(env, "NEXT_PUBLIC_SITE_URL"),
      requireCumulusDomain,
    ),
  };
}

export function readUnsubscribeConfig(
  env: Record<string, string | undefined>,
): UnsubscribeConfig {
  return {
    supabaseUrl: normalizeOrigin(
      requireValue(env, "NEXT_PUBLIC_SUPABASE_URL"),
      false,
    ),
    supabaseServiceRoleKey: requireSecret(
      env,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    unsubscribeSecret: requireSecret(
      env,
      "NOTIFICATION_UNSUBSCRIBE_SECRET",
    ),
  };
}

export function readResendWebhookConfig(
  env: Record<string, string | undefined>,
): ResendWebhookConfig {
  return {
    supabaseUrl: normalizeOrigin(
      requireValue(env, "NEXT_PUBLIC_SUPABASE_URL"),
      false,
    ),
    supabaseServiceRoleKey: requireSecret(
      env,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    webhookSecret: requireSecret(env, "RESEND_WEBHOOK_SECRET"),
  };
}
