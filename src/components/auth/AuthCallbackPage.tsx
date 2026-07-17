import { useEffect, useRef, useState } from "react";

import { upsertNotificationSubscription } from "../../features/notifications/subscription";
import { useAuth } from "./AuthContext";

export interface AuthCallbackPageProps {
  onComplete?: () => void;
  fetcher?: typeof fetch;
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

function captureMagicToken(): string {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = fragment.get("token")?.trim() ?? "";
  if (window.location.search || window.location.hash) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  return token;
}

export function AuthCallbackPage({
  onComplete,
  fetcher = fetch,
}: AuthCallbackPageProps) {
  const { available, exchangeMagicLink, unavailableReason } = useAuth();
  const [token] = useState(captureMagicToken);
  const [state, setState] = useState<CallbackState>(
    !available ? "unavailable" : token && token.length <= 1024 ? "pending" : "error",
  );
  const [message, setMessage] = useState(
    !available
      ? unavailableReason ?? "Notification access is unavailable."
      : token && token.length <= 1024
      ? "Confirming your email link…"
      : "This email link is incomplete. Request a new link from the logs page.",
  );
  const started = useRef(false);

  useEffect(() => {
    if (!available || !token || token.length > 1024 || started.current) return;
    started.current = true;
    void exchangeMagicLink(token).then((result) => {
      if (!result.ok) {
        setState("error");
        setMessage(result.message);
        return;
      }
      setState("ready");
      setMessage(
        "Your email is confirmed. Notifications are still off until you choose to turn them on.",
      );
    });
  }, [available, exchangeMagicLink, token]);

  const activateNotifications = async () => {
    if (state !== "ready") return;
    setState("saving");
    setMessage("Turning on new-log notifications…");
    try {
      await upsertNotificationSubscription("active", fetcher);
      setState("success");
      setMessage("New-log notifications are on.");
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
          <p role="status" aria-live="polite">{message}</p>
        </div>

        <p className="auth-copy">
          This session only manages optional new-log email through Resend.
          Every Cumulus log remains public without signing in.
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
              : "Turn on new-log notifications"}
          </button>
        ) : null}
        <a className="button-secondary auth-return" href="/">
          Return to the logs
        </a>
      </section>
    </main>
  );
}
