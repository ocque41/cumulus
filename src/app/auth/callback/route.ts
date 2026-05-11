import { NextResponse } from 'next/server'

import {
  redirectWithSupabaseCookies,
  sendAuthTelemetry,
} from '@cumulus/auth/middleware'
import { createRouteHandlerSupabaseClient } from '@cumulus/auth/server'
import { isAllowedRedirect } from '@cumulus/auth/redirects'

function safeNextPath(next: string | null): string {
  if (!next) return '/dashboard'
  return next.startsWith('/') ? next : '/dashboard'
}

function authCodeErrorUrl(origin: string, reason: string) {
  const url = new URL('/auth/auth-code-error', origin)
  url.searchParams.set('reason', reason)
  return url.toString()
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))
  const redirectTo = searchParams.get('redirectTo')

  if (!code) {
    await sendAuthTelemetry({
      request,
      event: {
        requestId,
        appKey: 'cumulus',
        eventType: 'callback',
        decision: 'missing_code',
        statusCode: 302,
        redirectTo: authCodeErrorUrl(origin, 'missing_code'),
      },
    })
    return NextResponse.redirect(authCodeErrorUrl(origin, 'missing_code'))
  }

  const { supabase, response } = await createRouteHandlerSupabaseClient(request)

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    await sendAuthTelemetry({
      request,
      event: {
        requestId,
        appKey: 'cumulus',
        eventType: 'callback',
        decision: 'exchange_error',
        statusCode: 302,
        redirectTo: authCodeErrorUrl(origin, 'exchange_error'),
        metadata: { error: error.message },
      },
    })
    return NextResponse.redirect(authCodeErrorUrl(origin, 'exchange_error'))
  }

  if (redirectTo) {
    const redirectAllowed = isAllowedRedirect(redirectTo)
    if (redirectAllowed) {
      await sendAuthTelemetry({
        request,
        event: {
          requestId,
          appKey: 'cumulus',
          eventType: 'callback',
          decision: 'redirect_to_target',
          statusCode: 302,
          redirectTo,
          redirectAllowed: true,
        },
      })
      return redirectWithSupabaseCookies({ response, url: redirectTo })
    }

    await sendAuthTelemetry({
      request,
      event: {
        requestId,
        appKey: 'cumulus',
        eventType: 'callback',
        decision: 'reject_invalid_redirect',
        statusCode: 302,
        redirectTo,
        redirectAllowed: false,
      },
    })
  }

  await sendAuthTelemetry({
    request,
    event: {
      requestId,
      appKey: 'cumulus',
      eventType: 'callback',
      decision: 'redirect_next_path',
      statusCode: 302,
      redirectTo: `${origin}${next}`,
      redirectAllowed: true,
    },
  })
  return redirectWithSupabaseCookies({ response, url: `${origin}${next}` })
}
