import { describe, expect, it, vi } from "vitest";
import {
  GITHUB_CONTRIBUTION_QUERY,
  GITHUB_PUBLIC_ACTIVITY_ENDPOINT,
  GITHUB_PUBLIC_CONTRIBUTIONS_ENDPOINT,
} from "./client";
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

function publicHtmlFixture(input: {
  start?: string;
  days?: number;
  mutate?: (cells: string[]) => void;
} = {}): string {
  const start = new Date(`${input.start ?? "2025-01-01"}T00:00:00.000Z`);
  const dayCount = input.days ?? 365;
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000);
    const count = index % 5;
    const id = `contribution-day-${index}`;
    const countLabel = count === 0 ? "No" : String(count);
    return {
      cell: `<td data-date="${isoDate(date)}" id="${id}" data-level="${count}" class="ContributionCalendar-day"></td><tool-tip for="${id}">${countLabel} ${count === 1 ? "contribution" : "contributions"} on ${isoDate(date)}.</tool-tip>`,
      date,
    };
  });

  // GitHub's public table is row-major by weekday rather than chronological.
  days.sort((left, right) =>
    left.date.getUTCDay() - right.date.getUTCDay()
    || left.date.getTime() - right.date.getTime());
  const cells = days.map((day) => day.cell);
  input.mutate?.(cells);
  return `<table>${cells.join("")}</table>`;
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
    now?: () => Date;
    timeoutMs?: number;
  } = {},
) {
  return createGithubContributionsHandler({
    env: overrides.env ?? { GITHUB_ACCESS_TOKEN: TEST_TOKEN },
    fetcher,
    now: overrides.now ?? (() => FIXED_NOW),
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
  ])("uses the fixed public calendar when server authentication is missing or invalid", async (env) => {
    const requests: Array<{ init?: RequestInit; url: string }> = [];
    const fetcher = vi.fn(async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      requests.push({ init, url: String(input) });
      if (String(input) === GITHUB_PUBLIC_ACTIVITY_ENDPOINT) {
        return new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (String(input).startsWith("https://api.github.com/search/commits?")) {
        return new Response(JSON.stringify({
          incomplete_results: false,
          items: [],
          total_count: 0,
        }), { status: 200 });
      }
      return new Response(publicHtmlFixture(), { status: 200 });
    }) as unknown as typeof fetch;
    const response = await handlerWith(fetcher, { env })(new Request(
      "https://cumulush.com/api/github/contributions",
    ));

    expect(response.status).toBe(200);
    expect(requests).toHaveLength(3);
    expect(requests[0]?.url).toBe(GITHUB_PUBLIC_CONTRIBUTIONS_ENDPOINT);
    expect(requests[1]?.url).toBe(GITHUB_PUBLIC_ACTIVITY_ENDPOINT);
    expect(requests[2]?.url).toMatch(/^https:\/\/api\.github\.com\/search\/commits\?/);
    expect(requests.every((request) => request.init?.method === "GET")).toBe(true);
    expect(requests.every((request) => !new Headers(request.init?.headers).has("authorization")))
      .toBe(true);
    const body = await response.json() as {
      username: string;
      contributions: Array<{ date: string; count: number; level: number }>;
      totalContributions: number;
    };
    expect(body.username).toBe("ocque41");
    expect(body.contributions).toHaveLength(365);
    expect(body.contributions.slice(0, 2)).toEqual([
      { date: "2025-01-01", count: 0, level: 0 },
      { date: "2025-01-02", count: 1, level: 1 },
    ]);
    expect(body.totalContributions).toBe(
      body.contributions.reduce((sum, day) => sum + day.count, 0),
    );
  });

  it("merges verified recent public GitHub interactions into the calendar fallback", async () => {
    const events = [
      {
        id: "1001",
        type: "PushEvent",
        actor: { login: "ocque41" },
        repo: { name: "cumulus/cloud" },
        payload: { ref: "refs/heads/main", size: 3 },
        public: true,
        created_at: "2026-07-15T09:00:00Z",
      },
      {
        id: "1002",
        type: "PullRequestEvent",
        actor: { login: "ocque41" },
        repo: { name: "cumulus/cloud" },
        payload: {
          action: "opened",
          pull_request: {
            html_url: "https://github.com/cumulus/cloud/pull/12",
            number: 12,
            title: "Build the activity field",
          },
        },
        public: true,
        created_at: "2026-07-15T10:00:00Z",
      },
      {
        id: "1003",
        type: "IssuesEvent",
        actor: { login: "ocque41" },
        repo: { name: "cumulus/cloud" },
        payload: {
          action: "closed",
          issue: {
            html_url: "https://github.com/cumulus/cloud/issues/4",
            number: 4,
            title: "Keep the data honest",
          },
        },
        public: true,
        created_at: "2026-07-15T11:00:00Z",
      },
    ];
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === GITHUB_PUBLIC_ACTIVITY_ENDPOINT) {
        return new Response(JSON.stringify(events), { status: 200 });
      }
      if (url.startsWith("https://api.github.com/search/commits?")) {
        return new Response(JSON.stringify({
          incomplete_results: false,
          total_count: 1,
          items: [
            {
              sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              author: { login: "ocque41" },
              repository: { full_name: "cumulus/cloud" },
              html_url: "https://github.com/cumulus/cloud/commit/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              commit: {
                author: { date: "2026-07-15T09:30:00Z" },
                message: "Render real commit detail\n\nLonger body is not exposed.",
              },
            },
          ],
        }), { status: 200 });
      }
      return new Response(publicHtmlFixture(), { status: 200 });
    }) as unknown as typeof fetch;
    const response = await handlerWith(fetcher, { env: {} })(new Request(
      "https://cumulush.com/api/github/contributions",
    ));
    const body = await response.json() as {
      activityDays: Array<Record<string, unknown>>;
      activityDetailStatus: string;
    };

    expect(response.status).toBe(200);
    expect(body.activityDetailStatus).toBe("live");
    expect(body.activityDays).toEqual([
      {
        commits: 1,
        date: "2026-07-15",
        highlights: [
          {
            kind: "commit",
            repository: "cumulus/cloud",
            title: "Render real commit detail",
            url: "https://github.com/cumulus/cloud/commit/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          {
            kind: "pull-request",
            repository: "cumulus/cloud",
            title: "opened: Build the activity field",
            url: "https://github.com/cumulus/cloud/pull/12",
          },
          {
            kind: "issue",
            repository: "cumulus/cloud",
            title: "closed: Keep the data honest",
            url: "https://github.com/cumulus/cloud/issues/4",
          },
        ],
        issues: 1,
        pullRequests: 1,
      },
    ]);
  });

  it("maps GitHub's GraphQL calendar into the fixed public contract", async () => {
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const fixture = githubFixture();
    const data = fixture.data as Record<string, unknown>;
    const user = data.user as Record<string, unknown>;
    const collection = user.contributionsCollection as Record<string, unknown>;
    Object.assign(collection, {
      commitContributionsByRepository: [
        {
          repository: { nameWithOwner: "cumulus/cloud" },
          contributions: {
            nodes: [{ commitCount: 3, occurredAt: "2026-07-15T12:00:00Z" }],
          },
        },
      ],
      issueContributions: {
        nodes: [
          {
            occurredAt: "2026-07-15T13:00:00Z",
            issue: {
              title: "Keep the graph honest",
              url: "https://github.com/cumulus/cloud/issues/4",
              repository: { nameWithOwner: "cumulus/cloud" },
            },
          },
        ],
      },
      pullRequestContributions: {
        nodes: [
          {
            occurredAt: "2026-07-15T14:00:00Z",
            pullRequest: {
              title: "Add dither interaction detail",
              url: "https://github.com/cumulus/cloud/pull/12",
              repository: { nameWithOwner: "cumulus/cloud" },
            },
          },
        ],
      },
    });
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
      activityDays: Array<{
        commits: number;
        date: string;
        highlights: Array<{ kind: string; title: string; url?: string }>;
        issues: number;
        pullRequests: number;
      }>;
      activityDetailStatus: string;
      username: string;
      contributions: Array<{ date: string; count: number; level: number }>;
      totalContributions: number;
      fetchedAt: string;
    };
    expect(Object.keys(body)).toEqual([
      "activityDays",
      "activityDetailStatus",
      "username",
      "contributions",
      "totalContributions",
      "fetchedAt",
    ]);
    expect(body.username).toBe("ocque41");
    expect(body.activityDetailStatus).toBe("live");
    expect(body.activityDays).toEqual([
      {
        commits: 3,
        date: "2026-07-15",
        highlights: [
          { kind: "commit", repository: "cumulus/cloud", title: "3 commits" },
          {
            kind: "issue",
            repository: "cumulus/cloud",
            title: "Keep the graph honest",
            url: "https://github.com/cumulus/cloud/issues/4",
          },
          {
            kind: "pull-request",
            repository: "cumulus/cloud",
            title: "Add dither interaction detail",
            url: "https://github.com/cumulus/cloud/pull/12",
          },
        ],
        issues: 1,
        pullRequests: 1,
      },
    ]);
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

  it("falls back to the public fixed-user calendar when authenticated GitHub fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("Bad credentials", { status: 401 }))
      .mockResolvedValueOnce(new Response(publicHtmlFixture(), { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        incomplete_results: false,
        items: [],
        total_count: 0,
      }), { status: 200 }));
    const fetcher = fetchMock as unknown as typeof fetch;
    const response = await handlerWith(fetcher)(new Request(
      "https://cumulush.com/api/github/contributions",
    ));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://api.github.com/graphql");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      GITHUB_PUBLIC_CONTRIBUTIONS_ENDPOINT,
    );
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
      GITHUB_PUBLIC_ACTIVITY_ENDPOINT,
    );
    expect(String(fetchMock.mock.calls[3]?.[0])).toMatch(
      /^https:\/\/api\.github\.com\/search\/commits\?/,
    );
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).has("authorization"))
      .toBe(false);
    const body = await response.json() as { username: string; contributions: unknown[] };
    expect(body.username).toBe("ocque41");
    expect(body.contributions).toHaveLength(365);
  });

  it("returns a stable redacted error when both upstream sources fail", async () => {
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

  it.each([
    () => new Response("<html>not a calendar</html>", { status: 200 }),
    () => new Response(publicHtmlFixture({ days: 363 }), { status: 200 }),
    () => new Response(publicHtmlFixture({
      mutate(cells) {
        cells.splice(50, 1);
      },
    }), { status: 200 }),
    () => new Response(
      publicHtmlFixture().replace('data-level="0"', 'data-level="1"'),
      { status: 200 },
    ),
    () => new Response(
      publicHtmlFixture().replace(
        'for="contribution-day-0"',
        'for="different-contribution-day"',
      ),
      { status: 200 },
    ),
    () => new Response(
      publicHtmlFixture().replace(
        ">1 contribution on",
        ">1,,0 contributions on",
      ),
      { status: 200 },
    ),
    () => new Response("", {
      status: 200,
      headers: { "Content-Length": String(512 * 1024 + 1) },
    }),
  ])("rejects malformed or unbounded public calendar HTML", async (responseFactory) => {
    const fetcher = vi.fn(async () => responseFactory()) as unknown as typeof fetch;
    const response = await handlerWith(fetcher, { env: {} })(new Request(
      "https://cumulush.com/api/github/contributions",
    ));

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "github_contributions_unavailable",
    });
  });

  it("stops reading a public response that streams beyond the byte limit", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(512 * 1024 + 1));
        controller.close();
      },
    });
    const fetcher = vi.fn(async () => new Response(body, { status: 200 })) as
      unknown as typeof fetch;
    const response = await handlerWith(fetcher, { env: {} })(new Request(
      "https://cumulush.com/api/github/contributions",
    ));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "github_contributions_unavailable",
    });
  });

  it("keeps the timeout active while a public response body is stalled", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    });
    const fetcher = vi.fn(async () => new Response(body, { status: 200 })) as
      unknown as typeof fetch;
    const response = await handlerWith(fetcher, {
      env: {},
      timeoutMs: 5,
    })(new Request("https://cumulush.com/api/github/contributions"));

    expect(response.status).toBe(503);
    expect(cancelled).toBe(true);
  });

  it("publishes daily cache controls and honors weak conditional ETags", async () => {
    const fetcher = jsonFetcher(githubFixture());
    let observation = 0;
    const handler = handlerWith(fetcher, {
      now: () => new Date(FIXED_NOW.getTime() + observation++ * 60_000),
    });
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
