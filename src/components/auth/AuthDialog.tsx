import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { NotificationPreferences } from "../../features/notifications/NotificationPreferences";
import { AppLink } from "../../lib/router";
import { useAuth } from "./AuthContext";

const DIALOG_CONTROL_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function isVisiblyAvailable(element: HTMLElement): boolean {
  return element.isConnected
    && !element.hidden
    && element.getAttribute("aria-hidden") !== "true"
    && !element.closest('[hidden], [aria-hidden="true"]');
}

function dialogControls(dialog: HTMLElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(DIALOG_CONTROL_SELECTOR),
  ).filter(isVisiblyAvailable);
}

function isValidDialogFocus(
  dialog: HTMLElement,
  element: Element | null,
  title: HTMLElement | null,
): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !dialog.contains(element)) {
    return false;
  }
  if (!isVisiblyAvailable(element)) return false;
  if (element === title) return true;
  return element.matches(DIALOG_CONTROL_SELECTOR);
}

function focusMainContent() {
  const main = document.getElementById("main-content")
    ?? document.querySelector<HTMLElement>("main");
  if (!main) return;

  const previousTabIndex = main.getAttribute("tabindex");
  const addedTemporaryTabIndex = previousTabIndex === null;
  if (addedTemporaryTabIndex) main.setAttribute("tabindex", "-1");
  main.focus({ preventScroll: true });

  if (addedTemporaryTabIndex) {
    if (document.activeElement !== main) {
      main.removeAttribute("tabindex");
      return;
    }

    // Chromium can drop programmatic focus when a temporary tabindex is
    // removed in the same task. Keep the non-tabbable target in place until
    // focus genuinely moves elsewhere, then restore the original markup.
    main.addEventListener(
      "blur",
      () => {
        if (main.getAttribute("tabindex") === "-1") {
          main.removeAttribute("tabindex");
        }
      },
      { once: true },
    );
  }
}

export interface AuthDialogProps {
  mode?: "automatic" | "manual";
  open: boolean;
  onClose: () => void;
}

export function AuthDialog({ mode = "manual", open, onClose }: AuthDialogProps) {
  const {
    user,
    loading,
    available,
    unavailableReason,
    refreshSession,
    requestMagicLink,
    signOut,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const requestRevision = useRef(0);
  const focusMainOnClose = useRef(false);
  const lastDialogFocus = useRef<HTMLElement | null>(null);
  const previousAvailable = useRef(available);
  const previousUser = useRef(user);

  const closeDialog = useCallback(() => {
    requestRevision.current += 1;
    setEmail("");
    setDisclosureAccepted(false);
    setSubmitting(false);
    setMessage("");
    onClose();
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    focusMainOnClose.current = false;
    const activeBeforeOpen = document.activeElement;
    const returnFocus = activeBeforeOpen instanceof HTMLElement
      && activeBeforeOpen !== document.body
      && activeBeforeOpen !== document.documentElement
      ? activeBeforeOpen
      : null;
    const siteFrame = document.querySelector<HTMLElement>(".site-frame");
    const siteFrameHadInert = siteFrame?.hasAttribute("inert") ?? false;
    const previousAriaHidden = siteFrame?.getAttribute("aria-hidden") ?? null;
    const previousBodyOverflow = document.body.style.overflow;

    siteFrame?.setAttribute("inert", "");
    siteFrame?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";

    const focusControl = (preferred?: HTMLElement | null) => {
      const controls = dialogRef.current
        ? dialogControls(dialogRef.current)
        : [];
      const target = preferred && controls.includes(preferred)
        ? preferred
        : controls[0];
      target?.focus({ preventScroll: true });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key === "Tab") {
        const focusable = dialogRef.current
          ? dialogControls(dialogRef.current)
          : [];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (isValidDialogFocus(dialog, event.target as Element, titleRef.current)) {
        lastDialogFocus.current = event.target as HTMLElement;
        return;
      }

      focusControl(lastDialogFocus.current ?? emailRef.current ?? closeRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    const target = mode === "automatic"
      ? titleRef.current
      : emailRef.current ?? closeRef.current ?? titleRef.current;
    target?.focus({ preventScroll: true });
    if (target) lastDialogFocus.current = target;

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);

      if (siteFrame) {
        if (!siteFrameHadInert) siteFrame.removeAttribute("inert");
        if (previousAriaHidden === null) {
          siteFrame.removeAttribute("aria-hidden");
        } else {
          siteFrame.setAttribute("aria-hidden", previousAriaHidden);
        }
      }
      document.body.style.overflow = previousBodyOverflow;

      if (focusMainOnClose.current) {
        focusMainContent();
        return;
      }

      if (returnFocus?.isConnected) {
        returnFocus.focus({ preventScroll: true });
        if (document.activeElement === returnFocus) return;
      }

      focusMainContent();
    };
  }, [closeDialog, mode, open]);

  useLayoutEffect(() => {
    const becameAvailable = !previousAvailable.current && available;
    const becameAnonymous = previousUser.current !== null && user === null;
    previousAvailable.current = available;
    previousUser.current = user;

    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    if ((becameAvailable || becameAnonymous) && emailRef.current) {
      emailRef.current.focus({ preventScroll: true });
      lastDialogFocus.current = emailRef.current;
      return;
    }

    if (
      !isValidDialogFocus(
        dialog,
        document.activeElement,
        titleRef.current,
      )
    ) {
      const controls = dialogControls(dialog);
      const preferred = emailRef.current ?? lastDialogFocus.current;
      const target = preferred && controls.includes(preferred)
        ? preferred
        : controls[0];
      target?.focus({ preventScroll: true });
      if (target) lastDialogFocus.current = target;
    }
  }, [available, loading, open, submitting, user]);

  if (!open) {
    return null;
  }

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      closeDialog();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const revision = requestRevision.current + 1;
    requestRevision.current = revision;
    setSubmitting(true);
    setMessage("");
    const result = await requestMagicLink(email, disclosureAccepted);
    if (requestRevision.current !== revision) return;
    setMessage(result.message);
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    const revision = requestRevision.current + 1;
    requestRevision.current = revision;
    setSubmitting(true);
    setMessage("");
    const result = await signOut();
    if (requestRevision.current !== revision) return;
    setMessage(result.message);
    setSubmitting(false);
  };

  const handleRefreshSession = async () => {
    const revision = requestRevision.current + 1;
    requestRevision.current = revision;
    setSubmitting(true);
    setMessage("");
    try {
      await refreshSession();
    } finally {
      if (requestRevision.current === revision) setSubmitting(false);
    }
  };

  const handlePrivacyNavigation = () => {
    focusMainOnClose.current = true;
    closeDialog();
  };

  return (
    <div
      className="auth-dialog-backdrop"
      onMouseDown={handleBackdrop}
      data-testid="auth-dialog-backdrop"
    >
      <section
        className="auth-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        aria-describedby="auth-dialog-description"
      >
        <button
          ref={closeRef}
          className="button-icon auth-dialog-close"
          type="button"
          onClick={closeDialog}
          aria-label="Close notification settings"
        >
          <span aria-hidden="true" className="ui-glyph">×</span>
        </button>

        <p className="auth-eyebrow">Optional reader setting</p>
        <h2
          id="auth-dialog-title"
          className="auth-dialog-title"
          ref={titleRef}
          tabIndex={-1}
        >
          New log notifications
        </h2>
        <p id="auth-dialog-description" className="auth-copy">
          All Cumulus logs are public. An email link is used only to manage
          optional notifications when a new log is published. Read the{" "}
          <AppLink href="/privacy" onClick={handlePrivacyNavigation}>
            notification privacy and data rights
          </AppLink>.
        </p>

        {!available ? (
          <div className="auth-unavailable">
            <p className="auth-status" role="status">
              {unavailableReason ??
                "Notification confirmation is not configured for this deployment. The public logs remain available."}
            </p>
            {mode === "manual" ? (
              <button
                className="button-secondary auth-retry"
                type="button"
                disabled={loading || submitting}
                onClick={() => void handleRefreshSession()}
              >
                {loading || submitting ? "Retrying…" : "Retry"}
              </button>
            ) : null}
          </div>
        ) : loading ? (
          <p className="auth-status" role="status">
            Checking notification access…
          </p>
        ) : user ? (
          <div className="auth-signed-in">
            <p className="auth-account-copy">
              Managing notifications for{" "}
              <span className="auth-account-email">
                {user.email}
              </span>
              .
            </p>
            <NotificationPreferences />
            <p className="auth-copy">
              Forgetting this email ends notification access on this browser. It
              does not turn notifications off.
            </p>
            <button
              className="button-quiet auth-signout"
              type="button"
              disabled={submitting}
              onClick={() => void handleSignOut()}
            >
              <span aria-hidden="true" className="ui-glyph">↗</span>
              {submitting ? "Forgetting email…" : "Forget this email on this browser"}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="field-group">
              <label className="field-label" htmlFor="notification-email">
                Email address
              </label>
              <div className="field-input-wrap">
                <span aria-hidden="true" className="ui-glyph">@</span>
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
              {submitting ? "Sending confirmation…" : "Send confirmation link"}
            </button>
          </form>
        )}

        {message ? (
          <p className="auth-status" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}

        {mode === "automatic" ? (
          <button
            className="button-secondary auth-dialog-not-now"
            type="button"
            onClick={closeDialog}
          >
            Not now
          </button>
        ) : null}
      </section>
    </div>
  );
}
