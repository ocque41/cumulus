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
  fetcher?: typeof fetch;
}

type PreferenceState = NotificationSubscriptionStatus | null;

const statusCopy: Record<NotificationSubscriptionStatus, string> = {
  active: "New-post notifications are on",
  unsubscribed: "New-post notifications are off",
};

export function NotificationPreferences({
  className = "",
  onStatusChange,
  fetcher = fetch,
}: NotificationPreferencesProps) {
  const { available, user, loading: authLoading, unavailableReason } = useAuth();
  const headingId = useId();
  const [status, setStatus] = useState<PreferenceState>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setMessage("");

    void readNotificationSubscription(fetcher)
      .then((subscription) => {
        if (active) {
          setStatus(subscription.status);
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
  }, [fetcher, user]);

  const saveStatus = useCallback(
    async (nextStatus: NotificationSubscriptionStatus) => {
      if (!user) {
        setMessage("Confirm your email link to change notifications.");
        return;
      }

      setSaving(true);
      setMessage("");

      try {
        const subscription = await upsertNotificationSubscription(nextStatus, fetcher);
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
    [fetcher, onStatusChange, user],
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

  if (!available) {
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
          Confirm your email with a notification link to view or change this
          optional preference. Every log remains public without this step.
        </p>
      </section>
    );
  }

  const nextStatus: NotificationSubscriptionStatus =
    status === "active" ? "unsubscribed" : "active";
  const buttonLabel =
    status === "active"
      ? "Turn off notifications"
      : "Turn on notifications";

  return (
    <section
      className={`auth-preferences ${className}`.trim()}
      aria-labelledby={headingId}
      aria-busy={loading || saving}
    >
      <div className="auth-preferences-heading">
        {status === "active" ? (
          <span aria-hidden="true" className="ui-glyph ui-glyph--status">●</span>
        ) : (
          <span aria-hidden="true" className="ui-glyph ui-glyph--status">○</span>
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
