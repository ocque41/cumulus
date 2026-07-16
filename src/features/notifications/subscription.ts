import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationSubscriptionStatus =
  | "pending"
  | "active"
  | "unsubscribed";

export interface NotificationSubscription {
  userId: string;
  status: NotificationSubscriptionStatus;
}

interface SubscriptionRow {
  user_id: string;
  status: NotificationSubscriptionStatus;
}

function isSubscriptionStatus(
  value: unknown,
): value is NotificationSubscriptionStatus {
  return (
    value === "pending" || value === "active" || value === "unsubscribed"
  );
}

function parseSubscriptionRow(value: unknown): NotificationSubscription | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Partial<SubscriptionRow>;
  if (typeof row.user_id !== "string" || !isSubscriptionStatus(row.status)) {
    return null;
  }

  return { userId: row.user_id, status: row.status };
}

export async function readNotificationSubscription(
  client: SupabaseClient,
  userId: string,
): Promise<NotificationSubscription | null> {
  const { data, error } = await client
    .from("blog_notification_subscriptions")
    .select("user_id,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("notification_preference_read_failed");
  }

  if (data === null) {
    return null;
  }

  const subscription = parseSubscriptionRow(data);
  if (!subscription || subscription.userId !== userId) {
    throw new Error("notification_preference_invalid");
  }

  return subscription;
}

export async function upsertNotificationSubscription(
  client: SupabaseClient,
  userId: string,
  status: NotificationSubscriptionStatus,
): Promise<NotificationSubscription> {
  const { data, error } = await client
    .from("blog_notification_subscriptions")
    .upsert(
      { user_id: userId, status },
      { onConflict: "user_id", ignoreDuplicates: false },
    )
    .select("user_id,status")
    .single();

  if (error) {
    throw new Error("notification_preference_write_failed");
  }

  const subscription = parseSubscriptionRow(data);
  if (!subscription || subscription.userId !== userId) {
    throw new Error("notification_preference_invalid");
  }

  return subscription;
}
