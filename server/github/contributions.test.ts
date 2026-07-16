import { describe, expect, it, vi } from "vitest";
import { GITHUB_CONTRIBUTION_QUERY } from "./client";
import {
  createGithubContributionsHandler,
  GITHUB_CONTRIBUTIONS_CACHE_CONTROL,
} from "./handler";

const TEST_TOKEN = "github-test-token-do-not-expose";
const FIXED_NOW = new Date("2026-07-16T12:34:56.000Z");
const LEVEL_NAMES = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
] as const;

interface FixtureDay {
  contributionCount: number;
  contributionLevel: (typeof LEVEL_NAMES)[number];
  date: string;
  weekday: number;
}

interface FixtureWeek {
  firstDay: string;
  contributionDays: FixtureDay[];
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function githubFixture(input: {
  start?: string;
  days?: number;
} = {}): Record<string, unknown> {
  const start = new Date(`${input.start ?? "2025-01-01"}T00:00:00.000Z`);
  const dayCount = input.days ?? 365;
  const weeks: FixtureWeek[] = [];
  let totalContributions = 0;

  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(start.getTime() + index * 86_400_000);
    const weekday = date.getUTCDay();
    if (weeks.length === 0 || (weekday === 0 && index > 0)) {
      weeks.push({ firstDay: isoDate(date), contributionDays: [] });
    }
    const contributionCount = index % 5;
    totalContributions += contributionCount;
    weeks.at(-1)?.contributionDays.push({
      contributionCount,
      contributionLevel: LEVEL_NAMES[contributionCount],
      date: isoDate(date),
      weekday,
    });
  }

  return {
    data: {
      user: {
        login: "ocque41",
        contributionsCollection: {
          contributionCalendar: {
            totalContributions,
            weeks,
          },
        },
      },
    },
  };
}

function jsonFetcher(value: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  })) as unknown as typeof fetch;
}

function handlerWith(
  fetcher: typeof fetch,
  overrides: {
    env?: Record<string, string | undefined>;
    timeoutMs?: number;
  } = {},
) {
  return createGithubContributionsHandler({
    env: overrides.env ?? { GITHUB_ACCESS_TOKEN: TEST_TOKEN },
    fetcher,
    now: () => FIXED_NOW,
    timeoutMs: overrides.timeoutMs,
  });
}

describe("GitHub contribution calendar endpoint", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])(
    "rejects the %s method before contacting GitHub",
    async (method) => {
      const fetcher = jsonFetcher(githubFixture());
      const response = await handlerWith(fetcher)(
        new Request("https://cumulush.com/api/github/contributions", { method }),
      );

      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET");
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toEqual({
        error: "method_not_allowed",
      });
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("rejects query parameters instead of becoming an arbitrary-user proxy", async () => {
    const fetcher = jsonFetcher(githubFixture());
    const response = await handlerWith(fetcher)(new Request(
      "https://cumulush.com/api/github/contributions?username=someone-else",
    ));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { GITHUB_ACCESS_TOKEN: "" },
    { GITHUB_ACCESS_TOKEN: "token with whitespace" },
  ])("fails closed when server authentication is missing or invalid", async (env) => {
    const fetcher = jsonFetcher(githubFixture());
    const response = await handlerWith(fetcher, { env })(new Request(
      "https://cumulush.com/api/github/contributions",
    ));

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "github_contributions_unavailable",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("maps GitHub's GraphQL calendar into the fixed public contract", async () => {
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const fixture = githubFixture();
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      requestedUrl = String(input);
      requestedInit = init;
      return new Response(JSON.stringify(fixture), { status: 200 });
    }) as unknown as typeof fetch;
    const response = await handlerWith(fetcher)(new Request(
      "https://cumulush.com/api/github/contributions",
    ));

    expect(response.status).toBe(200);
    expect(requestedUrl).toBe("https://api.github.com/graphql");
    expect(requestedInit?.method).toBe("POST");
    expect(new Headers(requestedInit?.headers).get("authorization")).toBe(
      `Bearer ${TEST_TOKEN}`,
    );
    const upstreamBody = JSON.parse(String(requestedInit?.body)) as {
      query: string;
      variables?: unknown;
    };
    expect(upstreamBody.query).toBe(GITHUB_CONTRIBUTION_QUERY);
    expect(upstreamBody.query).toContain('user(login: "ocque41")');
    expect(upstreamBody.variables).toBeUndefined();

    const body = await response.json() as {
      username: string;
      contributions: Array<{ date: string; count: number; level: number }>;
      totalContributions: number;
      fetchedAt: string;
    };
    expect(Object.keys(body)).toEqual([
      "username",
      "contributions",
      "totalContributions",
      "fetchedAt",
    ]);
    expect(body.username).toBe("ocque41");
    expect(body.contributions).toHaveLength(365);
    expect(body.contributions.slice(0, 5)).toEqual([
      { date: "2025-01-01", count: 0, level: 0 },
      { date: "2025-01-02", count: 1, level: 1 },
      { date: "2025-01-03", count: 2, level: 2 },
      { date: "2025-01-04", count: 3, level: 3 },
      { date: "2025-01-05", count: 4, level: 4 },
    ]);
    expect(body.totalContributions).toBe(
      body.contributions.reduce((sum, day) => sum + day.count, 0),
    );
    expect(body.fetchedAt).toBe(FIXED_NOW.toISOString());
  });

  it("accepts a normalized 52-week calendar without exceeding the bound", async () => {
    const fetcher = jsonFetcher(githubFixture({
      start: "2025-01-05",
      days: 364,
    }));
    const response = await handlerWith(fetcher)(new Request(
      "https://cumulush.com/api/github/contributions",
    ));

    expect(response.status).toBe(200);
    const body = await response.json() as { contributions: unknown[] };
    expect(body.contributions).toHaveLength(364);
  });

  it("returns a stable redacted error for non-success upstream responses", async () => {
    const rawUpstreamError = `Bad credentials: ${TEST_TOKEN}`;
    const fetcher = vi.fn(async () => new Response(rawUpstreamError, {
      status: 401,
    })) as unknown as typeof fetch;
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await handlerWith(fetcher)(new Request(
      "https://cumulush.com/api/github/contributions",
    ));
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(text)).toEqual({
      error: "github_contributions_unavailable",
    });
    expect(text).not.toContain(TEST_TOKEN);
    expect(text).not.toContain("Bad credentials");
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("aborts a stalled upstream request and keeps the timeout error private", async () => {
    const fetcher = ((_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new Error(`aborted ${TEST_TOKEN}`));
        if (init?.signal?.aborted) {
          abort();
          return;
        }
        init?.signal?.addEventListener("abort", abort, { once: true });
      })) as typeof fetch;
    const response = await handlerWith(fetcher, { timeoutMs: 5 })(new Request(
      "https://cumulush.com/api/github/contributions",
    ));
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).toBe(JSON.stringify({
      error: "github_contributions_unavailable",
    }));
    expect(text).not.toContain(TEST_TOKEN);
  });

  it.each([
    () => new Response("not json", { status: 200 }),
    () => new Response(JSON.stringify({
      errors: [{ message: `upstream leaked ${TEST_TOKEN}` }],
      data: githubFixture().data,
    }), { status: 200 }),
    () => new Response(JSON.stringify({
      errors: "not-a-graphql-error-array",
      data: githubFixture().data,
    }), { status: 200 }),
    () => {
      const value = githubFixture() as {
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: { weeks: FixtureWeek[] };
            };
          };
        };
      };
      value.data.user.contributionsCollection.contributionCalendar.weeks.pop();
      value.data.user.contributionsCollection.contributionCalendar.weeks.pop();
      return new Response(JSON.stringify(value), { status: 200 });
    },
    () => new Response("{}", {
      status: 200,
      headers: { "Content-Length": String(256 * 1024 + 1) },
    }),
  ])("rejects malformed or unbounded GraphQL data", async (responseFactory) => {
    const fetcher = vi.fn(async () => responseFactory()) as unknown as typeof fetch;
    const response = await handlerWith(fetcher)(new Request(
      "https://cumulush.com/api/github/contributions",
    ));
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).toBe(JSON.stringify({
      error: "github_contributions_unavailable",
    }));
    expect(text).not.toContain(TEST_TOKEN);
  });

  it("publishes daily cache controls and honors weak conditional ETags", async () => {
    const fetcher = jsonFetcher(githubFixture());
    const handler = handlerWith(fetcher);
    const first = await handler(new Request(
      "https://cumulush.com/api/github/contributions",
    ));
    const etag = first.headers.get("etag");

    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe(
      GITHUB_CONTRIBUTIONS_CACHE_CONTROL,
    );
    expect(first.headers.get("cache-control")).toContain(
      "stale-if-error=604800",
    );
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);

    const conditional = await handler(new Request(
      "https://cumulush.com/api/github/contributions",
      { headers: { "If-None-Match": `W/${etag}` } },
    ));
    expect(conditional.status).toBe(304);
    expect(conditional.headers.get("etag")).toBe(etag);
    expect(conditional.headers.get("cache-control")).toBe(
      GITHUB_CONTRIBUTIONS_CACHE_CONTROL,
    );
    await expect(conditional.text()).resolves.toBe("");
  });
});
