import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseBrowserSetup {
  client: SupabaseClient | null;
  callbackUrl: string | null;
  unavailableReason: string | null;
}

function browserVisibleUrl(value: string | undefined): URL | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    const localHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function createSupabaseBrowserSetup(
  env: Pick<
    ImportMetaEnv,
    | "NEXT_PUBLIC_SITE_URL"
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  >,
): SupabaseBrowserSetup {
  const siteUrl = browserVisibleUrl(env.NEXT_PUBLIC_SITE_URL);
  const supabaseUrl = browserVisibleUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!siteUrl || !supabaseUrl || !anonKey) {
    return {
      client: null,
      callbackUrl: null,
      unavailableReason:
        "Notification sign-in is not configured for this deployment. The public logs remain available.",
    };
  }

  try {
    return {
      client: createClient(supabaseUrl.toString(), anonKey, {
        auth: {
          // AuthCallbackPage owns the one-time PKCE exchange so the code is
          // never raced by supabase-js URL auto-detection.
          detectSessionInUrl: false,
          flowType: "pkce",
          persistSession: true,
        },
      }),
      callbackUrl: new URL("/auth/callback", siteUrl.origin).toString(),
      unavailableReason: null,
    };
  } catch {
    return {
      client: null,
      callbackUrl: null,
      unavailableReason:
        "Notification sign-in is not configured for this deployment. The public logs remain available.",
    };
  }
}

export const supabaseBrowserSetup = createSupabaseBrowserSetup({
  NEXT_PUBLIC_SITE_URL: import.meta.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
export const supabase = supabaseBrowserSetup.client;
