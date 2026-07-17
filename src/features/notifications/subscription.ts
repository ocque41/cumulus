export type NotificationSubscriptionStatus = "active" | "unsubscribed";

export interface NotificationSubscription {
  status: NotificationSubscriptionStatus;
}

function parseStatus(value: unknown): NotificationSubscriptionStatus | null {
  return value === "active" || value === "unsubscribed" ? value : null;
}

async function parseResponse(response: Response): Promise<NotificationSubscription> {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error("notification_preference_invalid");
  }
  const status = value && typeof value === "object"
    ? parseStatus((value as { status?: unknown }).status)
    : null;
  if (!response.ok || !status) {
    throw new Error("notification_preference_unavailable");
  }
  return { status };
}

export async function readNotificationSubscription(
  fetcher: typeof fetch = fetch,
  endpoint = "/api/notifications/preferences",
): Promise<NotificationSubscription> {
  const response = await fetcher(endpoint, {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  return parseResponse(response);
}

export async function upsertNotificationSubscription(
  status: NotificationSubscriptionStatus,
  fetcher: typeof fetch = fetch,
  endpoint = "/api/notifications/preferences",
): Promise<NotificationSubscription> {
  const response = await fetcher(endpoint, {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
}
