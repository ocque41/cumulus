import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

import {
  buildAuthContext,
  clearSupabaseAuthCookies,
  createSupabaseMiddlewareClient,
  detectStaleSession,
  getValidatedUser,
  isAllowedRedirect,
  redirectWithSupabaseCookies,
  resolveCookiePolicy,
  sendAuthTelemetry,
  type TelemetryEvent,
} from '@cumulus/auth/middleware'

import { isAuthProtectedPath } from '@/lib/auth/protected-paths'

function parseAttempt(value: string | null): number {
  const parsed = Number.parseInt(value ?? '0', 10)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

async function telemetry(
  request: NextRequest,
  event: NextFetchEvent,
  telemetryEvent: TelemetryEvent
) {
  if (request.nextUrl.pathname.startsWith('/api/auth/telemetry')) {
    return
  }
  event.waitUntil(sendAuthTelemetry({ event: telemetryEvent, request }))
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const cookiePolicy = resolveCookiePolicy(process.env, request.url)
  const requestId = crypto.randomUUID()
  const authAttempt = parseAttempt(request.nextUrl.searchParams.get('auth_attempt'))

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createSupabaseMiddlewareClient({
    request,
    response,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookiePolicy,
  })

  const userResult = await getValidatedUser(supabase)
  const hasSbCookies = request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'))
  const staleSession = detectStaleSession({ hasSbCookies, userResult })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cumulush.com'

  if (request.nextUrl.pathname.startsWith('/checkout/start') && !userResult.user) {
    const signupUrl = new URL('/signup', siteUrl)
    const redirectTarget = `${request.nextUrl.pathname}${request.nextUrl.search}`
    signupUrl.searchParams.set('redirectTo', redirectTarget)

    telemetry(request, event, {
      requestId,
      appKey: 'cumulus',
      eventType: 'auth_guard',
      decision: 'checkout_redirect_signup',
      statusCode: 302,
      userValid: false,
      staleSession,
      sessionCookiePresent: hasSbCookies,
      attempt: authAttempt,
      redirectTo: signupUrl.toString(),
      redirectAllowed: true,
    })
    return redirectWithSupabaseCookies({ response, url: signupUrl })
  }

  if (isAuthProtectedPath(request.nextUrl.pathname) && !userResult.user) {
    const loginUrl = new URL('/login', siteUrl)
    const authContext = buildAuthContext({
      app: 'cumulus',
      reason: 'no_user',
      requestId,
      path: request.nextUrl.pathname,
      host: request.nextUrl.host,
      attempt: authAttempt + 1,
    })
    loginUrl.searchParams.set('redirectTo', request.url)
    loginUrl.searchParams.set('auth_src', authContext.app)
    loginUrl.searchParams.set('auth_reason', authContext.reason)
    loginUrl.searchParams.set('auth_rid', authContext.requestId)
    loginUrl.searchParams.set('auth_attempt', String(authContext.attempt))

    telemetry(request, event, {
      requestId,
      appKey: 'cumulus',
      eventType: 'auth_guard',
      decision: 'protected_path_redirect_login',
      statusCode: 302,
      userValid: false,
      staleSession,
      sessionCookiePresent: hasSbCookies,
      attempt: authContext.attempt,
      redirectTo: loginUrl.toString(),
      redirectAllowed: true,
    })
    return redirectWithSupabaseCookies({ response, url: loginUrl })
  }

  if (request.nextUrl.pathname.startsWith('/login')) {
    if (staleSession) {
      clearSupabaseAuthCookies({ request, response, cookiePolicy })

      telemetry(request, event, {
        requestId,
        appKey: 'cumulus',
        eventType: 'stale_session_detected',
        decision: 'clear_and_render_login',
        statusCode: 200,
        userValid: false,
        staleSession: true,
        sessionCookiePresent: hasSbCookies,
        attempt: authAttempt,
      })
      return response
    }

    if (userResult.user) {
      if (authAttempt >= 3) {
        telemetry(request, event, {
          requestId,
          appKey: 'cumulus',
          eventType: 'login_auto_redirect',
          decision: 'loop_guard_block',
          statusCode: 200,
          userValid: true,
          staleSession: false,
          sessionCookiePresent: hasSbCookies,
          attempt: authAttempt,
        })
        return response
      }

      const redirectTo = request.nextUrl.searchParams.get('redirectTo')
      if (redirectTo) {
        const redirectAllowed = isAllowedRedirect(redirectTo)
        if (redirectAllowed) {
          telemetry(request, event, {
            requestId,
            appKey: 'cumulus',
            eventType: 'login_auto_redirect',
            decision: 'redirect_to_target',
            statusCode: 302,
            userValid: true,
            staleSession: false,
            sessionCookiePresent: hasSbCookies,
            attempt: authAttempt,
            redirectTo,
            redirectAllowed: true,
          })
          return redirectWithSupabaseCookies({ response, url: new URL(redirectTo) })
        }

        telemetry(request, event, {
          requestId,
          appKey: 'cumulus',
          eventType: 'login_auto_redirect',
          decision: 'reject_invalid_redirect',
          statusCode: 302,
          userValid: true,
          staleSession: false,
          sessionCookiePresent: hasSbCookies,
          attempt: authAttempt,
          redirectTo,
          redirectAllowed: false,
        })
      }

      telemetry(request, event, {
        requestId,
        appKey: 'cumulus',
        eventType: 'login_auto_redirect',
        decision: 'redirect_dashboard',
        statusCode: 302,
        userValid: true,
        staleSession: false,
        sessionCookiePresent: hasSbCookies,
        attempt: authAttempt,
        redirectTo: '/dashboard',
        redirectAllowed: true,
      })
      return redirectWithSupabaseCookies({ response, url: new URL('/dashboard', request.url) })
    }
  }

  telemetry(request, event, {
    requestId,
    appKey: 'cumulus',
    eventType: 'auth_check',
    decision: userResult.user ? 'allow_user' : 'allow_public',
    statusCode: 200,
    userValid: Boolean(userResult.user),
    staleSession,
    sessionCookiePresent: hasSbCookies,
    attempt: authAttempt,
  })
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
