import { NextResponse } from "next/server";

import {
  cumulusDbTokenFetch,
  requireCumulusDbBearerHeader,
  requireCumulusUser,
} from "@/lib/cumulus-db/server";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isAllowedSystemRoute(method: string, path: string[]) {
  const [area, action, subaction] = path;

  if (path.length === 1 && area === "scopes") return method === "GET";
  if (path.length === 1 && area === "state") return method === "GET";
  if (path.length === 1 && area === "audit") return method === "GET";
  if (path.length === 1 && area === "snapshots") return method === "GET" || method === "POST";

  if (area === "schema" && path.length === 2) {
    return (
      method === "POST" &&
      ["plan", "approvals", "apply", "revert"].includes(action ?? "")
    );
  }

  if ((area === "org" || area === "orgs") && action === "claim" && path.length === 2) {
    return method === "POST";
  }

  if (area === "passkeys" && action === "step-up" && path.length === 2) {
    return method === "POST";
  }

  if (area === "grants") {
    return path.length <= 3 && ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method);
  }

  if (area === "principals" && path.length === 3 && subaction === "grants") {
    return ["POST", "PATCH"].includes(method);
  }

  if (area !== "agents") return false;
  if (action === "bootstrap" && path.length === 2) return method === "POST";
  if (path.length === 1) return method === "GET" || method === "POST";
  if (path.length === 2) return ["GET", "PATCH", "DELETE"].includes(method);
  if (path.length === 3 && ["disable", "rotate", "revoke"].includes(subaction ?? "")) {
    return method === "POST";
  }
  if (path.length === 4 && subaction === "tokens" && ["rotate", "revoke"].includes(path[3] ?? "")) {
    return method === "POST";
  }

  return false;
}

function providerSystemPath(request: Request, path: string[]) {
  const url = new URL(request.url);
  const encodedPath = path.map((part) => encodeURIComponent(part)).join("/");
  return `/v1/system/${encodedPath}${url.search}`;
}

async function proxySystemRequest(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const method = request.method.toUpperCase();

  if (!isAllowedSystemRoute(method, path)) {
    return NextResponse.json({ error: "Unsupported Cumulus DB system route." }, { status: 404 });
  }

  const bearer = requireCumulusDbBearerHeader(request);
  if (!bearer.ok) return bearer.response;

  const user = await requireCumulusUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return cumulusDbTokenFetch(request, providerSystemPath(request, path), {
    method,
    body: BODY_METHODS.has(method) ? await request.text() : undefined,
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxySystemRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxySystemRequest(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return proxySystemRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxySystemRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxySystemRequest(request, context);
}
