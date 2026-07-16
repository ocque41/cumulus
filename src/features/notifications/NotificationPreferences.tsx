import { Bell, BellSlash } from "@phosphor-icons/react";
import { useCallback, useEffect, useId, useState } from "react";

import { useAuth } from "../../components/auth/AuthContext";
import {
  readNotificationSubscription,
  upsertNotificationSubscription,
  type NotificationSubscriptionStatus,
} from "./subscription";

export interface NotificationPreferencesProps {
  className?: string;
  onStatusChange?: (status: NotificationSubscriptionStatus) => void;
}

type PreferenceState = NotificationSubscriptionStatus | null;

const statusCopy: Record<NotificationSubscriptionStatus, string> = {
  pending: "Pending confirmation",
  active: "New-post notifications are on",
  unsubscribed: "New-post notifications are off",
};

export function NotificationPreferences({
  className = "",
  onStatusChange,
}: NotificationPreferencesProps) {
  const { client, user, loading: authLoading, unavailableReason } = useAuth();
  const userId = user?.id ?? null;
  const headingId = useId();
  const [status, setStatus] = useState<PreferenceState>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!client || !userId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setMessage("");

    void readNotificationSubscription(client, userId)
      .then((subscription) => {
        if (active) {
          setStatus(subscription?.status ?? null);
        }
      })
      .catch(() => {
        if (active) {
          setMessage(
            "Cumulus could not load this notification preference. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [client, userId]);

  const saveStatus = useCallback(
    async (nextStatus: NotificationSubscriptionStatus) => {
      if (!client || !userId) {
        setMessage("Sign in with your email link to change notifications.");
        return;
      }

      setSaving(true);
      setMessage("");

      try {
        const subscription = await upsertNotificationSubscription(
          client,
          userId,
          nextStatus,
        );
        setStatus(subscription.status);
        setMessage(statusCopy[subscription.status] + ".");
        onStatusChange?.(subscription.status);
      } catch {
        setMessage(
          "Cumulus could not save this notification preference. Please try again.",
        );
      } finally {
        setSaving(false);
      }
    },
    [client, onStatusChange, userId],
  );

  if (authLoading) {
    return (
      <section className={`auth-preferences ${className}`.trim()} aria-busy="true">
        <p className="auth-status" role="status">
          Checking notification access…
        </p>
      </section>
    );
  }

  if (!client) {
    return (
      <section className={`auth-preferences ${className}`.trim()}>
        <h3 className="auth-preferences-title">New-post notifications</h3>
        <p className="auth-status" role="status">
          {unavailableReason ??
            "Notification preferences are not configured for this deployment."}
        </p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className={`auth-preferences ${className}`.trim()}>
        <h3 className="auth-preferences-title">New-post notifications</h3>
        <p className="auth-copy">
          Sign in with an email link to view or change this optional preference.
          Every log remains public without signing in.
        </p>
      </section>
    );
  }

  const nextStatus: NotificationSubscriptionStatus =
    status === "active" ? "unsubscribed" : "active";
  const buttonLabel =
    status === "active"
      ? "Turn off notifications"
      : status === "pending"
        ? "Confirm notifications"
        : "Turn on notifications";

  return (
    <section
      className={`auth-preferences ${className}`.trim()}
      aria-labelledby={headingId}
      aria-busy={loading || saving}
    >
      <div className="auth-preferences-heading">
        {status === "active" ? (
          <Bell aria-hidden="true" weight="fill" />
        ) : (
          <BellSlash aria-hidden="true" />
        )}
        <h3 id={headingId}>New-post notifications</h3>
      </div>

      <p className="auth-copy">
        Cumulus uses this address only to announce a newly published log. Every
        message includes an unsubscribe link.
      </p>

      <p className="auth-preference-state">
        <span className="auth-preference-label">Current preference</span>
        <span className="auth-preference-value">
          {loading
            ? "Loading…"
            : status
              ? statusCopy[status]
              : "No notification preference is saved"}
        </span>
      </p>

      <button
        className="button-secondary auth-preference-action"
        type="button"
        disabled={loading || saving}
        onClick={() => void saveStatus(nextStatus)}
      >
        {saving ? "Saving…" : buttonLabel}
      </button>

      <p className="auth-status" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
