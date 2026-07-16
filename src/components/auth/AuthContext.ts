import { createContext, useContext } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export interface AuthActionResult {
  ok: boolean;
  message: string;
}

export interface AuthContextValue {
  client: SupabaseClient | null;
  session: Session | null;
  user: User | null;
  loading: boolean;
  unavailableReason: string | null;
  requestMagicLink: (
    email: string,
    notificationDisclosureAccepted: boolean,
  ) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
