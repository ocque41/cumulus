import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { resolveCookiePolicy } from './middleware'

type ServerEnv = NodeJS.ProcessEnv

export type CreateServerSupabaseClientOptions = {
  env?: ServerEnv
  supabaseKey?: string
  supabaseUrl?: string
}

export async function createServerSupabaseClient(
  options: CreateServerSupabaseClientOptions = {}
) {
  const env = options.env ?? process.env
  const supabaseUrl = options.supabaseUrl ?? env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = options.supabaseKey ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()
  const cookiePolicy = resolveCookiePolicy(env)

  return createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: cookiePolicy,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...cookiePolicy,
            })
          })
        } catch {
          // Server Components cannot always write cookies directly.
        }
      },
    },
  })
}

export async function createRouteHandlerSupabaseClient(
  request: Request,
  options: CreateServerSupabaseClientOptions = {}
) {
  const env = options.env ?? process.env
  const supabaseUrl = options.supabaseUrl ?? env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = options.supabaseKey ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  const cookiePolicy = resolveCookiePolicy(env, request.url)

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: cookiePolicy,
    cookies: {
      getAll() {
        const header = request.headers.get('cookie')
        if (!header) return []

        return header
          .split(';')
          .map((cookie) => cookie.trim())
          .filter(Boolean)
          .map((cookie) => {
            const separator = cookie.indexOf('=')
            const name = separator >= 0 ? cookie.slice(0, separator) : cookie
            const value = separator >= 0 ? cookie.slice(separator + 1) : ''
            return { name, value: decodeURIComponent(value) }
          })
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            ...cookiePolicy,
          })
        })
      },
    },
  })

  return { cookiePolicy, response, supabase }
}

export const createClient = createServerSupabaseClient
