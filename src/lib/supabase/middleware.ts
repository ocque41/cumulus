import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient, resolveCookiePolicy } from '@cumulus/auth/middleware'

export async function updateSession(request: NextRequest) {
    const supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createSupabaseMiddlewareClient({
        request,
        response: supabaseResponse,
        cookiePolicy: resolveCookiePolicy(process.env, request.url),
    })

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        request.nextUrl.pathname !== '/'
    ) {
        // no user, potentially respond by redirecting the user to the login page
        // const url = request.nextUrl.clone()
        // url.pathname = '/login'
        // return NextResponse.redirect(url)
    }

    return supabaseResponse
}
