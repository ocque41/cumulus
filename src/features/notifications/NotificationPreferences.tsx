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

type PreferenceState =
  | { kind: "error" }
  | { kind: "loading" }
  | { kind: "ready"; status: NotificationSubscriptionStatus };

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
  const [preference, setPreference] = useState<PreferenceState>({
    kind: "loading",
  });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setPreference({ kind: "loading" });
      return;
    }

    let active = true;
    setPreference({ kind: "loading" });
    setMessage("");

    void readNotificationSubscription(fetcher)
      .then((subscription) => {
        if (active) {
          setPreference({ kind: "ready", status: subscription.status });
        }
      })
      .catch(() => {
        if (active) {
          setPreference({ kind: "error" });
          setMessage(
            "Cumulus could not load this notification preference. Please try again.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [fetcher, loadAttempt, user]);

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
        setPreference({ kind: "ready", status: subscription.status });
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

  const status = preference.kind === "ready" ? preference.status : null;
  const loading = preference.kind === "loading";
  const buttonLabel =
    preference.kind === "error"
      ? "Retry preference"
      : status === null
        ? "Loading preference"
      : status === "active"
        ? "Unsubscribe from new-post emails"
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
            : preference.kind === "error"
              ? "Current preference unavailable"
              : status
              ? statusCopy[status]
              : "Loading…"}
        </span>
      </p>

      <button
        className="button-secondary auth-preference-action"
        type="button"
        disabled={loading || saving}
        onClick={() => {
          if (preference.kind === "error") {
            setLoadAttempt((attempt) => attempt + 1);
            return;
          }
          if (status) {
            void saveStatus(status === "active" ? "unsubscribed" : "active");
          }
        }}
      >
        {saving ? "Saving…" : buttonLabel}
      </button>

      <p className="auth-status" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
