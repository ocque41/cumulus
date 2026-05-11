import { NextResponse } from "next/server";
import { createServerSupabaseClient as createClient } from "@cumulus/auth/server";

export async function requireCumulusUser() {
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
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { error: "A Cumulus DB bearer token is required for this route." },
      { status: 401 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", authorization);
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
