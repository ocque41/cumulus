import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type AuthTelemetryPayload = {
  requestId?: string
  appKey?: string
  eventType?: string
  decision?: string
  host?: string
  path?: string
  method?: string
  redirectTo?: string | null
  redirectAllowed?: boolean | null
  userValid?: boolean | null
  staleSession?: boolean | null
  sessionCookiePresent?: boolean | null
  attempt?: number | null
  statusCode?: number | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export const runtime = 'nodejs'

function hashWithSalt(value: string | null | undefined, salt: string): string | null {
  if (!value) return null
  return createHash('sha256').update(`${salt}:${value}`).digest('hex')
}

function isFreshTimestamp(tsValue: string, maxSkewMs = 5 * 60 * 1000): boolean {
  const timestamp = Number.parseInt(tsValue, 10)
  if (Number.isNaN(timestamp)) return false
  return Math.abs(Date.now() - timestamp) <= maxSkewMs
}

function safeRedirectHost(redirectTo: string | null | undefined): string | null {
  if (!redirectTo) return null
  try {
    return new URL(redirectTo).host
  } catch {
    return null
  }
}

function verifySignature({
  secret,
  ts,
  body,
  signature,
}: {
  secret: string
  ts: string
  body: string
  signature: string
}): boolean {
  const expected = createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')
  if (expected.length !== signature.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: Request) {
  const secret = process.env.AUTH_TELEMETRY_INGEST_SECRET
  const ts = request.headers.get('x-auth-telemetry-ts') ?? ''
  const signature = request.headers.get('x-auth-telemetry-signature') ?? ''
  const rawBody = await request.text()

  if (!secret) {
    return NextResponse.json({ ok: false, skipped: 'missing_secret' }, { status: 202 })
  }
  if (!isFreshTimestamp(ts)) {
    return NextResponse.json({ ok: false, error: 'stale_or_invalid_timestamp' }, { status: 401 })
  }
  if (!verifySignature({ secret, ts, body: rawBody, signature })) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
  }

  let payload: AuthTelemetryPayload
  try {
    payload = JSON.parse(rawBody) as AuthTelemetryPayload
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!payload.requestId || !payload.appKey || !payload.eventType || !payload.decision) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, skipped: 'missing_supabase_service_role' }, { status: 202 })
  }

  const hashSalt = process.env.AUTH_TELEMETRY_HASH_SALT ?? secret
  const ipHash = hashWithSalt(payload.ip, hashSalt)
  const uaHash = hashWithSalt(payload.userAgent, hashSalt)

  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { error } = await supabase.from('cumulus_auth_request_logs').insert({
    request_id: payload.requestId,
    app_key: payload.appKey,
    event_type: payload.eventType,
    decision: payload.decision,
    host: payload.host ?? null,
    path: payload.path ?? null,
    method: payload.method ?? null,
    redirect_to: payload.redirectTo ?? null,
    redirect_to_host: safeRedirectHost(payload.redirectTo),
    redirect_allowed: payload.redirectAllowed ?? null,
    session_cookie_present: payload.sessionCookiePresent ?? null,
    user_valid: payload.userValid ?? null,
    stale_session: payload.staleSession ?? null,
    attempt: payload.attempt ?? null,
    status_code: payload.statusCode ?? null,
    ip_hash: ipHash,
    ua_hash: uaHash,
    metadata: payload.metadata ?? {},
  })

  if (error) {
    return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 202 })
  }

  return NextResponse.json({ ok: true })
}
