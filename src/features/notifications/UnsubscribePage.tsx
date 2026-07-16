import { useState } from "react";

export interface UnsubscribePageProps {
  token?: string;
  endpoint?: string;
  fetcher?: typeof fetch;
}

type UnsubscribeState =
  | "confirm"
  | "submitting"
  | "success"
  | "error"
  | "invalid";

function captureTokenFromLocation(): string {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const fragmentToken = fragment.get("token")?.trim() ?? "";
  const queryToken = query.get("token")?.trim() ?? "";

  if (fragment.has("token") || query.has("token")) {
    window.history.replaceState({}, "", window.location.pathname);
  }

  return fragmentToken || queryToken;
}

export function UnsubscribePage({
  token: tokenProp,
  endpoint = "/api/notifications/unsubscribe",
  fetcher = fetch,
}: UnsubscribePageProps) {
  const [token] = useState(() => {
    const locationToken = captureTokenFromLocation();
    return (tokenProp ?? locationToken).trim();
  });
  const validTokenShape = token.length > 0 && token.length <= 512;
  const [state, setState] = useState<UnsubscribeState>(
    validTokenShape ? "confirm" : "invalid",
  );

  const unsubscribe = async () => {
    if (!validTokenShape || state === "submitting") {
      return;
    }

    setState("submitting");
    try {
      const response = await fetcher(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(response.ok ? "success" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <main className="auth-page">
      <section
        className="auth-unsubscribe"
        aria-labelledby="unsubscribe-title"
        aria-busy={state === "submitting"}
      >
        <p className="auth-eyebrow">Email preference</p>
        <div className="auth-page-heading">
          {state === "success" ? (
            <span aria-hidden="true" className="ui-glyph ui-glyph--status">✓</span>
          ) : state === "error" || state === "invalid" ? (
            <span aria-hidden="true" className="ui-glyph ui-glyph--status">!</span>
          ) : (
            <span aria-hidden="true" className="ui-glyph ui-glyph--status">○</span>
          )}
          <h1 id="unsubscribe-title" className="auth-page-title">
            {state === "success"
              ? "Notifications are off"
              : "Stop new-post notifications?"}
          </h1>
        </div>

        {state === "invalid" ? (
          <p className="auth-status" role="alert">
            This unsubscribe link is incomplete or invalid. Use the complete
            link from a Cumulus notification.
          </p>
        ) : state === "success" ? (
          <p className="auth-status" role="status" aria-live="polite">
            This notification preference is now off. If it was already off, no
            further change was needed.
          </p>
        ) : state === "error" ? (
          <div className="auth-unsubscribe-error">
            <p className="auth-status" role="alert">
              Cumulus could not update this preference. The link may be invalid
              or expired; try the latest notification link again.
            </p>
            <button
              className="button-secondary"
              type="button"
              onClick={() => void unsubscribe()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="auth-unsubscribe-confirm">
            <p className="auth-copy">
              Confirm to stop email when a new Cumulus log is published. No
              sign-in or password is required.
            </p>
            <button
              className="button-primary"
              type="button"
              disabled={state === "submitting"}
              onClick={() => void unsubscribe()}
            >
              {state === "submitting"
                ? "Turning notifications off…"
                : "Turn notifications off"}
            </button>
          </div>
        )}

        <a className="button-quiet auth-return" href="/">
          Return to the public logs
        </a>
      </section>
    </main>
  );
}
