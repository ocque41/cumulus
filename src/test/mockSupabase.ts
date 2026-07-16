import type {
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { vi } from "vitest";

import type { NotificationSubscriptionStatus } from "../features/notifications/subscription";

export const mockUser = {
  id: "a750a3a7-a8d8-4a52-ae9c-74b69157a39b",
  email: "reader@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-07-16T10:00:00.000Z",
} as User;

export const mockSession = {
  access_token: "public-test-access-token",
  refresh_token: "public-test-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: mockUser,
} as Session;

export interface MockSupabaseOptions {
  session?: Session | null;
  readStatus?: NotificationSubscriptionStatus | null;
  readError?: boolean;
  writeError?: boolean;
  exchangeSession?: Session | null;
  exchangeError?: boolean;
}

export function createMockSupabase(options: MockSupabaseOptions = {}) {
  const session = options.session === undefined ? null : options.session;
  const select = vi.fn();
  const eq = vi.fn();
  const maybeSingle = vi.fn(async () => ({
    data:
      options.readStatus === undefined || options.readStatus === null
        ? null
        : { user_id: mockUser.id, status: options.readStatus },
    error: options.readError ? { message: "read failed" } : null,
  }));
  const upsert = vi.fn();
  const single = vi.fn(async () => {
    const payload = upsert.mock.calls.at(-1)?.[0] as
      | { user_id: string; status: NotificationSubscriptionStatus }
      | undefined;
    return {
      data: payload ?? null,
      error: options.writeError ? { message: "write failed" } : null,
    };
  });
  const query = { select, eq, maybeSingle, upsert, single };
  select.mockReturnValue(query);
  eq.mockReturnValue(query);
  upsert.mockReturnValue(query);

  const signInWithOtp = vi.fn(async () => ({ data: {}, error: null }));
  const signOut = vi.fn(async () => ({ error: null }));
  const getSession = vi.fn(async () => ({
    data: { session },
    error: null,
  }));
  const exchangeCodeForSession = vi.fn(async () => ({
    data: {
      session:
        options.exchangeSession === undefined
          ? mockSession
          : options.exchangeSession,
      user:
        options.exchangeSession === undefined
          ? mockUser
          : (options.exchangeSession?.user ?? null),
    },
    error: options.exchangeError ? { message: "exchange failed" } : null,
  }));
  const unsubscribe = vi.fn();
  const onAuthStateChange = vi.fn(() => ({
    data: { subscription: { id: "test", callback: vi.fn(), unsubscribe } },
  }));
  const from = vi.fn(() => query);

  const client = {
    auth: {
      signInWithOtp,
      signOut,
      getSession,
      exchangeCodeForSession,
      onAuthStateChange,
    },
    from,
  } as unknown as SupabaseClient;

  return {
    client,
    mocks: {
      exchangeCodeForSession,
      from,
      getSession,
      maybeSingle,
      onAuthStateChange,
      select,
      signInWithOtp,
      signOut,
      single,
      unsubscribe,
      upsert,
    },
  };
}
