import { useEffect, useRef, useState } from "react";

import { upsertNotificationSubscription } from "../../features/notifications/subscription";
import { useAuth } from "./AuthContext";

export interface AuthCallbackPageProps {
  onComplete?: () => void;
}

type CallbackState =
  | "pending"
  | "ready"
  | "saving"
  | "success"
  | "error"
  | "unavailable";

const callbackTitles: Record<CallbackState, string> = {
  pending: "Confirming your link",
  ready: "Email confirmed",
  saving: "Saving your preference",
  success: "Notifications confirmed",
  error: "Link not confirmed",
  unavailable: "Link not confirmed",
};

interface CallbackCredentials {
  code: string | null;
  hasError: boolean;
}

function captureCallbackCredentials(): CallbackCredentials {
  const params = new URLSearchParams(window.location.search);
  const credentials = {
    code: params.get("code"),
    hasError: params.has("error") || params.has("error_description"),
  };

  if (window.location.search || window.location.hash) {
    window.history.replaceState({}, "", window.location.pathname);
  }

  return credentials;
}

export function AuthCallbackPage({ onComplete }: AuthCallbackPageProps) {
  const { client, unavailableReason } = useAuth();
  const [credentials] = useState(captureCallbackCredentials);
  const [state, setState] = useState<CallbackState>(
    client ? "pending" : "unavailable",
  );
  const [message, setMessage] = useState(
    client
      ? "Confirming your email sign-in link…"
      : unavailableReason ??
          "Notification sign-in is not configured for this deployment.",
  );
  const [userId, setUserId] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!client || started.current) {
      return;
    }
    started.current = true;

    const finishCallback = async () => {
      if (credentials.hasError) {
        setState("error");
        setMessage(
          "This sign-in link is invalid or has expired. Request a new link from the logs page.",
        );
        return;
      }

      const { code } = credentials;
      if (!code) {
        setState("error");
        setMessage(
          "This sign-in link is incomplete. Request a new link from the logs page.",
        );
        return;
      }

      try {
        const { data, error } = await client.auth.exchangeCodeForSession(code);

        if (error || !data.session?.user) {
          setState("error");
          setMessage(
            "This sign-in link is invalid or has expired. Request a new link from the logs page.",
          );
          return;
        }

        setUserId(data.session.user.id);
        setState("ready");
        setMessage(
          "Your email is confirmed. Notifications are still off until you choose to turn them on.",
        );
      } catch {
        setState("error");
        setMessage(
          "Cumulus could not finish notification sign-in. Request a new link or try again later.",
        );
      }
    };

    void finishCallback();
  }, [client, credentials]);

  const activateNotifications = async () => {
    if (!client || !userId || state !== "ready") {
      return;
    }

    setState("saving");
    setMessage("Turning on new-post notifications…");
    try {
      await upsertNotificationSubscription(client, userId, "active");
      setState("success");
      setMessage("New-post notifications are on.");
      onComplete?.();
    } catch {
      setState("ready");
      setMessage(
        "Cumulus could not save this notification preference. Please try again.",
      );
    }
  };

  return (
    <main className="auth-page">
      <section
        className="auth-callback"
        aria-labelledby="auth-callback-title"
        aria-busy={state === "pending" || state === "saving"}
      >
        <p className="auth-eyebrow">Notification access</p>
        <h1 id="auth-callback-title" className="auth-page-title">
          {callbackTitles[state]}
        </h1>

        <div className={`auth-callback-state auth-callback-state-${state}`}>
          {state === "success" ? (
            <span aria-hidden="true" className="ui-glyph ui-glyph--status">✓</span>
          ) : state === "ready" || state === "saving" ? (
            <span aria-hidden="true" className="ui-glyph ui-glyph--status">@</span>
          ) : state === "error" || state === "unavailable" ? (
            <span aria-hidden="true" className="ui-glyph ui-glyph--status">!</span>
          ) : null}
          <p role="status" aria-live="polite">
            {message}
          </p>
        </div>

        <p className="auth-copy">
          Signing in only manages optional new-post email. Every Cumulus log is
          public with or without an account session.
        </p>
        {state === "ready" || state === "saving" ? (
          <button
            className="button-primary auth-callback-action"
            type="button"
            disabled={state === "saving"}
            onClick={() => void activateNotifications()}
          >
            {state === "saving"
              ? "Turning notifications on…"
              : "Turn on new-post notifications"}
          </button>
        ) : null}
        <a className="button-secondary auth-return" href="/">
          Return to the logs
        </a>
      </section>
    </main>
  );
}
