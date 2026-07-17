import { createContext, useContext } from "react";

export interface AuthActionResult {
  ok: boolean;
  message: string;
}

export interface NotificationUser {
  email: string;
}

export interface AuthContextValue {
  user: NotificationUser | null;
  loading: boolean;
  available: boolean;
  unavailableReason: string | null;
  requestMagicLink: (
    email: string,
    notificationDisclosureAccepted: boolean,
  ) => Promise<AuthActionResult>;
  exchangeMagicLink: (token: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
