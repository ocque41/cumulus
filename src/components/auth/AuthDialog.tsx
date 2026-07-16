import { EnvelopeSimple, SignOut, X } from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { NotificationPreferences } from "../../features/notifications/NotificationPreferences";
import { useAuth } from "./AuthContext";

export interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const {
    user,
    loading,
    client,
    unavailableReason,
    requestMagicLink,
    signOut,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusTimer = window.setTimeout(() => {
      (emailRef.current ?? closeRef.current)?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      returnFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const result = await requestMagicLink(email, disclosureAccepted);
    setMessage(result.message);
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    setMessage("");
    const result = await signOut();
    setMessage(result.message);
    setSubmitting(false);
  };

  return (
    <div
      className="auth-dialog-backdrop"
      onMouseDown={handleBackdrop}
      data-testid="auth-dialog-backdrop"
    >
      <section
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        aria-describedby="auth-dialog-description"
      >
        <button
          ref={closeRef}
          className="button-icon auth-dialog-close"
          type="button"
          onClick={onClose}
          aria-label="Close notification settings"
        >
          <X aria-hidden="true" />
        </button>

        <p className="auth-eyebrow">Optional reader setting</p>
        <h2 id="auth-dialog-title" className="auth-dialog-title">
          New log notifications
        </h2>
        <p id="auth-dialog-description" className="auth-copy">
          All Cumulus logs are public. An email link is used only to manage
          optional notifications when a new log is published.
        </p>

        {!client ? (
          <p className="auth-status" role="status">
            {unavailableReason ??
              "Notification sign-in is not configured for this deployment. The public logs remain available."}
          </p>
        ) : loading ? (
          <p className="auth-status" role="status">
            Checking notification access…
          </p>
        ) : user ? (
          <div className="auth-signed-in">
            <p className="auth-account-copy">
              Managing notifications for{" "}
              <span className="auth-account-email">
                {user.email ?? "this address"}
              </span>
              .
            </p>
            <NotificationPreferences />
            <button
              className="button-quiet auth-signout"
              type="button"
              disabled={submitting}
              onClick={() => void handleSignOut()}
            >
              <SignOut aria-hidden="true" />
              {submitting ? "Signing out…" : "Sign out"}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="field-group">
              <label className="field-label" htmlFor="notification-email">
                Email address
              </label>
              <div className="field-input-wrap">
                <EnvelopeSimple aria-hidden="true" />
                <input
                  ref={emailRef}
                  className="field-input"
                  id="notification-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <label className="field-consent" htmlFor="notification-disclosure">
              <input
                id="notification-disclosure"
                name="notification-disclosure"
                type="checkbox"
                required
                checked={disclosureAccepted}
                onChange={(event) =>
                  setDisclosureAccepted(event.target.checked)
                }
              />
              <span>
                Show me the final step to turn on email when a new Cumulus log
                is published. Every message includes an unsubscribe link.
              </span>
            </label>

            <button
              className="button-primary auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Sending link…" : "Send sign-in link"}
            </button>
          </form>
        )}

        {message ? (
          <p className="auth-status" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
