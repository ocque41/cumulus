import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { copyResponseCookies, resolveCookiePolicy } from '@cumulus/auth/middleware'
import { createRouteHandlerSupabaseClient } from '@cumulus/auth/server'

export async function POST(request: Request) {
    const cookiePolicy = resolveCookiePolicy(process.env, request.url)
    const cookieStore = await cookies()
    const { supabase, response: authResponse } = await createRouteHandlerSupabaseClient(request)

    // 1. Check if session exists and perform global signout
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        // 2. Global Revocation (Backend)
        // This invalidates the refresh token server-side
        await supabase.auth.signOut({ scope: 'global' })
    }

    // 3. Force Cookie Deletion
    // Find and delete all Supabase-related cookies
    const response = copyResponseCookies(authResponse, NextResponse.json({ success: true }))

    // Get all cookies and find Supabase auth cookies (they start with 'sb-')
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'))

    for (const cookie of supabaseCookies) {
        // Delete without domain (for localhost/current domain)
        response.cookies.delete(cookie.name)

        // Also delete with explicit domain for production
        response.cookies.set(cookie.name, '', {
            maxAge: 0,
            ...cookiePolicy,
        })
    }

    return response
}
