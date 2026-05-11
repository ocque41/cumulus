/**
 * POST /api/relay-login
 *
 * Exchanges a Relay attestation JWT for a Cumulus session. The caller is
 * usually an AI agent that has just called Relay's
 * `POST /v1/integrator/auth/attest` and received a 5-min RS256 JWT pinned
 * to Cumulus's tenantId.
 *
 * Flow:
 *   1. Verify the JWT against Relay's JWKS. Issuer + audience must match.
 *   2. Find or create a Supabase auth user, keyed on the JWT's `sub`
 *      (Relay's stable external_user_id for this tenant). Email is set
 *      from the JWT claim and marked confirmed — Relay is the email
 *      verifier.
 *   3. Use Supabase admin `generateLink({ type: 'magiclink' })` to mint a
 *      one-shot token, then `verifyOtp` on the SSR client so Supabase's
 *      own session cookies get set. Relay never sets cookies on Cumulus.
 *   4. Return 200 with Supabase's Set-Cookie headers preserved.
 */
import { NextResponse } from 'next/server'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { createClient } from '@supabase/supabase-js'

import {
  createSupabaseMiddlewareClient,
  resolveCookiePolicy,
  copyResponseCookies,
  type MiddlewareRequest,
} from '@cumulus/auth/middleware'

type RelayClaims = JWTPayload & {
  sub?: string
  email?: string
  act?: 'agent' | 'human'
  agent_id?: string
  rel_user_id?: string
}

function getRelayEndpoint(): string {
  const raw = process.env.RELAY_ENDPOINT
  if (!raw) throw new Error('RELAY_ENDPOINT is not set')
  return raw.replace(/\/+$/, '')
}

function getRelayIssuer(): string {
  return process.env.RELAY_ISSUER ?? getRelayEndpoint().replace(/\/v1$/, '')
}

function getTenantId(): string {
  const raw = process.env.RELAY_TENANT_ID
  if (!raw) throw new Error('RELAY_TENANT_ID is not set')
  return raw
}

// Module-level cache of Relay's JWKS — jose handles the 1h re-fetch cadence.
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null
function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!cachedJwks) {
    const base = getRelayEndpoint().replace(/\/v1$/, '')
    cachedJwks = createRemoteJWKSet(new URL(`${base}/.well-known/jwks.json`))
  }
  return cachedJwks
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type AdminUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

type AdminClient = ReturnType<typeof getServiceRoleClient>

/**
 * Idempotently resolve the Supabase user for an attested email. Tries
 * `createUser` first; on conflict, falls back to `profiles.relay_external_id`
 * (O(1) index lookup) then `getUserById`. Returns `created` so callers can
 * decide whether to run first-time bookkeeping.
 */
async function ensureUser(
  admin: AdminClient,
  externalId: string,
  email: string,
  relayUserId: string | null,
): Promise<{ user: AdminUser; created: boolean }> {
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      relay_external_id: externalId,
      relay_user_id: relayUserId,
    },
  })
  if (!createError && createData?.user) {
    const user = createData.user as AdminUser
    await admin
      .from('profiles')
      .upsert({ id: user.id, relay_external_id: externalId }, { onConflict: 'id' })
    return { user, created: true }
  }

  // createUser failed — assume email collision and resolve the existing row.
  // 1) prefer profiles.relay_external_id (fast, indexed)
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('relay_external_id', externalId)
    .maybeSingle()

  let userId: string | null = profile?.id ?? null

  // 2) fall back to looking the user up by email via the admin API
  if (!userId) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (listError) throw listError
    const byEmail = list?.users.find((u) => u.email?.toLowerCase() === email)
    userId = byEmail?.id ?? null
  }

  if (!userId) {
    throw new Error(`createUser failed and no existing user found: ${createError?.message}`)
  }

  const { data: byId, error: getError } = await admin.auth.admin.getUserById(userId)
  if (getError || !byId?.user) {
    throw new Error(`getUserById failed: ${getError?.message ?? 'no user'}`)
  }
  const user = byId.user as AdminUser

  // Stamp metadata + profiles row if this email-known user has never attested.
  const currentExternal = (user.user_metadata as Record<string, unknown> | undefined)
    ?.relay_external_id
  if (currentExternal !== externalId) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        relay_external_id: externalId,
        relay_user_id: relayUserId,
      },
    })
    await admin
      .from('profiles')
      .upsert({ id: user.id, relay_external_id: externalId }, { onConflict: 'id' })
  }
  return { user, created: false }
}

export async function POST(request: Request) {
  let body: { jwt?: string }
  try {
    body = (await request.json()) as { jwt?: string }
  } catch {
    return errorResponse('invalid payload')
  }
  const jwt = body.jwt?.trim()
  if (!jwt) return errorResponse('jwt is required')

  // 1) Verify the Relay attestation JWT.
  let claims: RelayClaims
  try {
    const { payload } = await jwtVerify(jwt, getJwks(), {
      issuer: getRelayIssuer(),
      audience: getTenantId(),
    })
    claims = payload as RelayClaims
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid token'
    return errorResponse(`relay attestation rejected: ${msg}`, 401)
  }

  const externalId = claims.sub
  const email = claims.email?.toLowerCase()
  if (!externalId || !email) {
    return errorResponse('attestation missing sub or email', 401)
  }

  const admin = getServiceRoleClient()

  // 2) Find or create the Supabase user.
  let user: AdminUser
  try {
    const result = await ensureUser(admin, externalId, email, claims.rel_user_id ?? null)
    user = result.user
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    console.error('[relay-login] ensureUser failed:', msg)
    return errorResponse(`failed to provision user: ${msg}`, 500)
  }

  // 3) Mint a one-shot magic link, then verify it against the SSR client so
  //    Supabase writes its normal auth cookies to the response.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkError || !linkData?.properties?.hashed_token) {
    return errorResponse(
      `failed to mint magic link: ${linkError?.message ?? 'missing token'}`,
      500,
    )
  }

  const middlewareRequest: MiddlewareRequest = {
    cookies: {
      getAll: () => [],
      set: () => undefined,
      delete: () => undefined,
    },
    headers: request.headers,
    method: request.method,
    nextUrl: new URL(request.url),
    url: request.url,
  }
  const response = NextResponse.next({ request: { headers: request.headers } })
  const cookiePolicy = resolveCookiePolicy(process.env, request.url)
  const ssr = createSupabaseMiddlewareClient({
    request: middlewareRequest,
    response,
    cookiePolicy,
  })

  const { error: verifyError } = await ssr.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  })
  if (verifyError) {
    return errorResponse(`verify failed: ${verifyError.message}`, 500)
  }

  // 4) Return 200 with Supabase's Set-Cookie headers intact.
  return copyResponseCookies({
    source: response,
    target: NextResponse.json({
      ok: true,
      userId: user.id,
      email,
      externalUserId: externalId,
      actor: claims.act ?? 'agent',
    }),
  })
}
