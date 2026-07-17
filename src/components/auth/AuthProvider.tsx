import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AuthContext,
  type AuthActionResult,
  type AuthContextValue,
  type NotificationUser,
} from "./AuthContext";

export interface AuthProviderProps {
  children: ReactNode;
  fetcher?: typeof fetch;
  signInEndpoint?: string;
  sessionEndpoint?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizedEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null;
}

function parseUser(value: unknown): NotificationUser | null {
  if (!value || typeof value !== "object") return null;
  const email = (value as { email?: unknown }).email;
  return typeof email === "string" && normalizedEmail(email) === email
    ? { email }
    : null;
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await response.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
  fetcher = fetch,
  signInEndpoint = "/api/notifications/sign-in",
  sessionEndpoint = "/api/notifications/session",
}: AuthProviderProps) {
  const [user, setUser] = useState<NotificationUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const sessionRevision = useRef(0);

  const refreshSession = useCallback(async (): Promise<void> => {
    const revision = sessionRevision.current + 1;
    sessionRevision.current = revision;
    setLoading(true);

    try {
      const response = await fetcher(sessionEndpoint, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const value = await readJson(response);
      if (sessionRevision.current !== revision) return;

      if (!response.ok || !value) {
        setAvailable(false);
        setUnavailableReason(
          "Notification access is temporarily unavailable. The public logs remain available.",
        );
        setUser(null);
        return;
      }

      setAvailable(true);
      setUnavailableReason(null);
      setUser(parseUser(value.user));
    } catch {
      if (sessionRevision.current !== revision) return;
      setAvailable(false);
      setUnavailableReason(
        "Notification access is temporarily unavailable. The public logs remain available.",
      );
      setUser(null);
    } finally {
      if (sessionRevision.current === revision) setLoading(false);
    }
  }, [fetcher, sessionEndpoint]);

  useEffect(() => {
    void refreshSession();
    return () => {
      sessionRevision.current += 1;
    };
  }, [refreshSession]);

  const requestMagicLink = useCallback(
    async (
      emailValue: string,
      notificationDisclosureAccepted: boolean,
    ): Promise<AuthActionResult> => {
      const email = normalizedEmail(emailValue);
      if (!email) return { ok: false, message: "Enter a valid email address." };
      if (!notificationDisclosureAccepted) {
        return {
          ok: false,
          message:
            "Accept the notification disclosure before requesting a confirmation link.",
        };
      }
      try {
        const response = await fetcher(signInEndpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, disclosureAccepted: true }),
        });
        if (!response.ok) throw new Error("request_failed");
        setAvailable(true);
        setUnavailableReason(null);
        return {
          ok: true,
          message:
            "Check your email for a link. It opens a final confirmation step before notifications turn on.",
        };
      } catch {
        return {
          ok: false,
          message: "Cumulus could not send the email link. Please try again later.",
        };
      }
    },
    [fetcher, signInEndpoint],
  );

  const exchangeMagicLink = useCallback(
    async (token: string): Promise<AuthActionResult> => {
      if (!token || token.length > 1024) {
        return { ok: false, message: "This email link is incomplete or invalid." };
      }
      const revision = sessionRevision.current + 1;
      sessionRevision.current = revision;
      try {
        const response = await fetcher(sessionEndpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const value = await readJson(response);
        const nextUser = parseUser(value?.user);
        if (!response.ok || !nextUser) throw new Error("exchange_failed");
        if (sessionRevision.current !== revision) {
          return {
            ok: false,
            message: "A newer notification session check replaced this request.",
          };
        }
        setUser(nextUser);
        setAvailable(true);
        setUnavailableReason(null);
        setLoading(false);
        return { ok: true, message: "Email confirmed." };
      } catch {
        if (sessionRevision.current === revision) setLoading(false);
        return {
          ok: false,
          message:
            "This email link is invalid or expired. Request a new link from the logs page.",
        };
      }
    },
    [fetcher, sessionEndpoint],
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    const revision = sessionRevision.current + 1;
    sessionRevision.current = revision;
    try {
      const response = await fetcher(sessionEndpoint, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("sign_out_failed");
      if (sessionRevision.current !== revision) {
        return {
          ok: false,
          message: "A newer notification session check replaced this request.",
        };
      }
      setUser(null);
      setLoading(false);
      return {
        ok: true,
        message: "This browser no longer remembers your notification email.",
      };
    } catch {
      if (sessionRevision.current === revision) setLoading(false);
      return {
        ok: false,
        message: "Cumulus could not forget this email. Please try again.",
      };
    }
  }, [fetcher, sessionEndpoint]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      available,
      unavailableReason,
      refreshSession,
      requestMagicLink,
      exchangeMagicLink,
      signOut,
    }),
    [
      available,
      exchangeMagicLink,
      loading,
      refreshSession,
      requestMagicLink,
      signOut,
      unavailableReason,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
