import { NextResponse } from 'next/server'
import { describe, expect, it } from 'vitest'

import { copyResponseCookies, redirectWithSupabaseCookies, resolveCookiePolicy } from '@cumulus/auth/middleware'

describe('redirectWithSupabaseCookies', () => {
  it('preserves Supabase cookies on redirect responses', () => {
    const response = NextResponse.next()
    response.cookies.set('sb-access-token', 'token-value', {
      domain: '.cumulush.com',
      path: '/',
      sameSite: 'lax',
      secure: true,
    })

    const redirectResponse = redirectWithSupabaseCookies({
      response,
      url: 'https://app.cumulush.com',
    })

    expect(redirectResponse.headers.get('location')).toBe('https://app.cumulush.com/')
    expect(redirectResponse.cookies.get('sb-access-token')?.value).toBe('token-value')
  })

  it('returns a redirect even when there are no cookies to carry over', () => {
    const redirectResponse = redirectWithSupabaseCookies({
      response: NextResponse.next(),
      url: 'https://docs.cumulush.com',
    })

    expect(redirectResponse.headers.get('location')).toBe('https://docs.cumulush.com/')
    expect(redirectResponse.cookies.getAll()).toEqual([])
  })

  it('copies cookies onto non-redirect responses', async () => {
    const source = NextResponse.next()
    source.cookies.set('sb-refresh-token', 'refresh-value', {
      domain: '.cumulush.com',
      path: '/',
      sameSite: 'lax',
      secure: true,
    })

    const copiedResponse = copyResponseCookies({
      source,
      target: NextResponse.json({ ok: true }),
    })

    expect(copiedResponse.cookies.get('sb-refresh-token')?.value).toBe('refresh-value')
    await expect(copiedResponse.json()).resolves.toEqual({ ok: true })
  })

  it('accepts partial env objects when resolving cookie policy', () => {
    const policy = resolveCookiePolicy({
      AUTH_COOKIE_DOMAIN: 'auto',
      AUTH_COOKIE_SECURE_MODE: 'never',
    }, 'http://127.0.0.1:3000/dashboard')

    expect(policy).toEqual({
      path: '/',
      sameSite: 'lax',
      secure: false,
    })
  })
})
