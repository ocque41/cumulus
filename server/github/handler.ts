import { createHash } from "node:crypto";
import { readGithubContributionConfig } from "./config.js";
import {
  fetchGithubContributionCalendar,
  fetchPublicGithubActivity,
  fetchPublicGithubCommitActivity,
  fetchPublicGithubContributionCalendar,
} from "./client.js";
import type { GithubContributionsPayload } from "./types.js";

export const GITHUB_CONTRIBUTIONS_CACHE_CONTROL =
  "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400, stale-if-error=604800";

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const;

const UNAVAILABLE_BODY = JSON.stringify({
  error: "github_contributions_unavailable",
});

interface GithubContributionsHandlerOptions {
  env: Record<string, string | undefined>;
  fetcher?: typeof fetch;
  now?: () => Date;
  timeoutMs?: number;
}

function errorResponse(
  error: "method_not_allowed" | "invalid_request",
  status: number,
  headers: HeadersInit = {},
): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      ...BASE_HEADERS,
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function unavailableResponse(): Response {
  return new Response(UNAVAILABLE_BODY, {
    status: 503,
    headers: {
      ...BASE_HEADERS,
      "Cache-Control": "no-store",
      "Retry-After": "60",
    },
  });
}

function entityTag(body: string): string {
  return `"${createHash("sha256").update(body, "utf8").digest("hex")}"`;
}

function matchesEntityTag(header: string | null, etag: string): boolean {
  if (!header) return false;
  const expected = etag.replace(/^W\//, "");
  return header.split(",").some((candidate) => {
    const normalized = candidate.trim();
    return normalized === "*" || normalized.replace(/^W\//, "") === expected;
  });
}

export function createGithubContributionsHandler(
  options: GithubContributionsHandlerOptions,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "GET") {
      return errorResponse("method_not_allowed", 405, { Allow: "GET" });
    }

    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return errorResponse("invalid_request", 400);
    }
    if (url.search.length > 0) {
      return errorResponse("invalid_request", 400);
    }

    try {
      let payload: GithubContributionsPayload;
      try {
        const config = readGithubContributionConfig(options.env);
        payload = await fetchGithubContributionCalendar({
          accessToken: config.accessToken,
          fetcher: options.fetcher,
          now: options.now,
          timeoutMs: options.timeoutMs,
        });
      } catch {
        // The public profile calendar is the least-privilege fallback for this
        // one fixed account. Its HTML is treated as untrusted and accepted only
        // after the same strict date, count, density, and size validation.
        payload = await fetchPublicGithubContributionCalendar({
          fetcher: options.fetcher,
          now: options.now,
          timeoutMs: options.timeoutMs,
        });
        try {
          const activity = await fetchPublicGithubActivity({
            fetcher: options.fetcher,
            now: options.now,
            timeoutMs: options.timeoutMs,
          });
          payload = { ...payload, ...activity };
        } catch {
          // The verified aggregate calendar remains useful if GitHub's
          // short public-events window is unavailable or rate limited.
        }
        try {
          const commitDays = await fetchPublicGithubCommitActivity({
            fetcher: options.fetcher,
            now: options.now,
            timeoutMs: options.timeoutMs,
          });
          const days = new Map(payload.activityDays.map((day) => [day.date, day]));
          for (const commitDay of commitDays) {
            const existing = days.get(commitDay.date);
            days.set(commitDay.date, existing
              ? {
                  ...existing,
                  commits: commitDay.commits,
                  highlights: [
                    ...commitDay.highlights,
                    ...existing.highlights.filter((item) => item.kind !== "commit"),
                  ].slice(0, 6),
                }
              : commitDay);
          }
          payload = {
            ...payload,
            activityDays: [...days.values()].sort((left, right) => left.date.localeCompare(right.date)),
            activityDetailStatus: "live",
          };
        } catch {
          // Push events still expose the real repository/ref interaction even
          // when the stricter public commit search is temporarily unavailable.
        }
      }
      const body = JSON.stringify(payload);
      const etag = entityTag(JSON.stringify({
        activityDays: payload.activityDays,
        activityDetailStatus: payload.activityDetailStatus,
        username: payload.username,
        contributions: payload.contributions,
        totalContributions: payload.totalContributions,
      }));
      const headers = {
        ...BASE_HEADERS,
        "Cache-Control": GITHUB_CONTRIBUTIONS_CACHE_CONTROL,
        ETag: etag,
      };

      if (matchesEntityTag(request.headers.get("if-none-match"), etag)) {
        return new Response(null, { status: 304, headers });
      }
      return new Response(body, { status: 200, headers });
    } catch {
      // This endpoint has one deliberately stable failure contract. Upstream
      // errors, response bodies, and credentials never reach the browser or
      // logs.
      return unavailableResponse();
    }
  };
}
