import { NextResponse } from "next/server";
import { createServerSupabaseClient as createClient } from "@cumulus/auth/server";

type CumulusOidcUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

function cumulusAuthMode() {
  const mode = process.env.CUMULUS_AUTH_MODE ?? "supabase";
  if (mode === "supabase" || mode === "cumulus_oidc") return mode;
  return "supabase";
}

export async function requireCumulusUser(request?: Request) {
  if (cumulusAuthMode() === "cumulus_oidc") {
    const authorization = request?.headers.get("authorization");
    if (!authorization?.toLowerCase().startsWith("bearer ")) return null;
    const response = await fetch(`${cumulusDbBaseUrl()}/oidc/userinfo`, {
      method: "GET",
      headers: { Authorization: authorization },
      cache: "no-store",
    }).catch(() => null);
    if (!response?.ok) return null;
    const claims = (await response.json().catch(() => null)) as { sub?: string; email?: string } | null;
    if (!claims?.sub) return null;
    return {
      id: claims.sub,
      email: claims.email,
      app_metadata: {},
      user_metadata: {},
    } satisfies CumulusOidcUser;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function cumulusDbBaseUrl() {
  return (
    process.env.CUMULUS_DB_INTERNAL_URL ||
    process.env.CUMULUS_DB_PUBLIC_URL ||
    "http://localhost:4317"
  ).replace(/\/$/, "");
}

export function isCumulusDbAdminApiEnabled() {
  return process.env.CUMULUS_DB_ADMIN_API_ENABLED === "true";
}

async function proxyCumulusDbFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${cumulusDbBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
  });

  const text = await response.text();
  return new NextResponse(text || null, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function requireCumulusDbBearerHeader(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "A Cumulus DB bearer token is required for this route." },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const, authorization };
}

export async function cumulusDbAdminFetch(path: string, init: RequestInit = {}) {
  const masterKey = process.env.CUMULUS_DB_MASTER_KEY;
  if (!masterKey) {
    return NextResponse.json(
      { error: "CUMULUS_DB_MASTER_KEY is not configured" },
      { status: 503 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("X-Cumulus-Admin-Key", masterKey);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return proxyCumulusDbFetch(path, {
    ...init,
    headers,
  });
}

export async function cumulusDbTokenFetch(request: Request, path: string, init: RequestInit = {}) {
  const bearer = requireCumulusDbBearerHeader(request);
  if (!bearer.ok) return bearer.response;

  const headers = new Headers(init.headers);
  headers.set("Authorization", bearer.authorization);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return proxyCumulusDbFetch(path, {
    ...init,
    headers,
  });
}

export async function cumulusDbPublicFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return proxyCumulusDbFetch(path, {
    ...init,
    headers,
  });
}
