import { createClient as createAuthClient } from '@cumulus/auth/client'

/**
 * Wraps @cumulus/auth createClient with explicit env vars so Next.js
 * can statically replace process.env.NEXT_PUBLIC_* in the client bundle.
 * (The upstream package aliases process.env to a variable first, which
 * defeats Next.js DefinePlugin replacement.)
 */
export function createClient() {
  return createAuthClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })
}
