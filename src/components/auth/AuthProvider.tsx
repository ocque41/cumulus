import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { supabase, supabaseBrowserSetup } from "../../lib/supabase";
import {
  AuthContext,
  type AuthActionResult,
  type AuthContextValue,
} from "./AuthContext";

export interface AuthProviderProps {
  children: ReactNode;
  client?: SupabaseClient | null;
  callbackUrl?: string | null;
  unavailableReason?: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizedEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return null;
  }

  return email;
}

export function AuthProvider({
  children,
  client = supabase,
  callbackUrl = supabaseBrowserSetup.callbackUrl,
  unavailableReason = supabaseBrowserSetup.unavailableReason,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(client));

  useEffect(() => {
    if (!client) {
      return;
    }

    let active = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    void client.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const requestMagicLink = useCallback(
    async (
      emailValue: string,
      notificationDisclosureAccepted: boolean,
    ): Promise<AuthActionResult> => {
      if (!client || !callbackUrl) {
        return {
          ok: false,
          message:
            unavailableReason ??
            "Notification sign-in is not configured for this deployment.",
        };
      }

      const email = normalizedEmail(emailValue);
      if (!email) {
        return { ok: false, message: "Enter a valid email address." };
      }

      if (!notificationDisclosureAccepted) {
        return {
          ok: false,
          message:
            "Acknowledge the notification disclosure before requesting a sign-in link.",
        };
      }

      try {
        const { error } = await client.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: callbackUrl,
          },
        });

        if (error) {
          return {
            ok: false,
            message:
              "Cumulus could not send a sign-in link. Please try again later.",
          };
        }

        return {
          ok: true,
          message:
            "Check your email for a sign-in link. The link opens a final notification confirmation step.",
        };
      } catch {
        return {
          ok: false,
          message:
            "Cumulus could not send a sign-in link. Please try again later.",
        };
      }
    },
    [callbackUrl, client, unavailableReason],
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    if (!client) {
      return {
        ok: false,
        message:
          unavailableReason ??
          "Notification sign-in is not configured for this deployment.",
      };
    }

    try {
      const { error } = await client.auth.signOut();
      if (error) {
        return {
          ok: false,
          message: "Cumulus could not sign out. Please try again.",
        };
      }

      return { ok: true, message: "Signed out." };
    } catch {
      return {
        ok: false,
        message: "Cumulus could not sign out. Please try again.",
      };
    }
  }, [client, unavailableReason]);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      session: client ? session : null,
      user: client ? (session?.user ?? null) : null,
      loading: client ? loading : false,
      unavailableReason: client ? null : unavailableReason,
      requestMagicLink,
      signOut,
    }),
    [client, loading, requestMagicLink, session, signOut, unavailableReason],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
