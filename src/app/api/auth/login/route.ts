import { NextResponse } from 'next/server'

import {
  copyResponseCookies,
} from '@cumulus/auth/middleware'
import { createRouteHandlerSupabaseClient } from '@cumulus/auth/server'
import { resolvePostAuthDestination } from '@cumulus/auth/redirects'

type LoginPayload = {
  email?: string
  password?: string
  redirectPath?: string | null
  redirectTo?: string | null
}

function safeRedirectPath(path: string | null | undefined): string {
  if (!path) return '/dashboard'
  return path.startsWith('/') ? path : '/dashboard'
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: Request) {
  let payload: LoginPayload

  try {
    payload = (await request.json()) as LoginPayload
  } catch {
    return errorResponse('Invalid login payload.')
  }

  const email = payload.email?.trim()
  const password = payload.password

  if (!email || !password) {
    return errorResponse('Email and password are required.')
  }

  const { supabase, response } = await createRouteHandlerSupabaseClient(request)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return errorResponse(error.message)
  }

  const destination = resolvePostAuthDestination(
    payload.redirectTo,
    safeRedirectPath(payload.redirectPath)
  )

  return copyResponseCookies({
    source: response,
    target: NextResponse.json({ ok: true, redirectTo: destination }),
  })
}
