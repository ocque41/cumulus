import {
  GITHUB_CONTRIBUTION_USERNAME,
  type ContributionDay,
  type ContributionLevel,
  type GithubContributionsPayload,
} from "./types.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
export const GITHUB_PUBLIC_CONTRIBUTIONS_ENDPOINT =
  "https://github.com/users/ocque41/contributions";
const MAXIMUM_UPSTREAM_BYTES = 256 * 1024;
const MAXIMUM_PUBLIC_HTML_BYTES = 512 * 1024;
const MINIMUM_CALENDAR_WEEKS = 52;
const MAXIMUM_CALENDAR_WEEKS = 53;
const MINIMUM_CALENDAR_DAYS = 364;
const MAXIMUM_CALENDAR_DAYS = 371;
const DEFAULT_TIMEOUT_MS = 8_000;

// GitHub's GraphQL contributionCalendar is the authoritative source for the
// public profile graph. The login is intentionally a literal, not a request
// variable, so this server endpoint cannot become an arbitrary GitHub proxy.
export const GITHUB_CONTRIBUTION_QUERY = `
  query CumulusContributionCalendar {
    user(login: "ocque41") {
      login
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              contributionCount
              contributionLevel
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

export class GithubContributionUpstreamError extends Error {
  readonly code:
    | "github_network_error"
    | "github_http_error"
    | "github_response_too_large"
    | "github_invalid_response";

  constructor(code: GithubContributionUpstreamError["code"]) {
    super(code);
    this.name = "GithubContributionUpstreamError";
    this.code = code;
  }
}

interface FetchGithubContributionCalendarOptions {
  accessToken: string;
  fetcher?: typeof fetch;
  now?: () => Date;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isCanonicalDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(timestamp)
    && new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function contributionLevel(value: unknown): ContributionLevel | undefined {
  switch (value) {
    case "NONE":
      return 0;
    case "FIRST_QUARTILE":
      return 1;
    case "SECOND_QUARTILE":
      return 2;
    case "THIRD_QUARTILE":
      return 3;
    case "FOURTH_QUARTILE":
      return 4;
    default:
      return undefined;
  }
}

function parseCalendar(
  value: unknown,
  fetchedAt: string,
): GithubContributionsPayload {
  if (!isRecord(value)) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  if (
    "errors" in value
    && (!Array.isArray(value.errors) || value.errors.length > 0)
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  const data = value.data;
  const user = isRecord(data) ? data.user : undefined;
  const collection = isRecord(user) ? user.contributionsCollection : undefined;
  const calendar = isRecord(collection)
    ? collection.contributionCalendar
    : undefined;

  if (
    !isRecord(user)
    || typeof user.login !== "string"
    || user.login.toLowerCase() !== GITHUB_CONTRIBUTION_USERNAME
    || !isRecord(calendar)
    || !isSafeCount(calendar.totalContributions)
    || !Array.isArray(calendar.weeks)
    || calendar.weeks.length < MINIMUM_CALENDAR_WEEKS
    || calendar.weeks.length > MAXIMUM_CALENDAR_WEEKS
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  const contributions: ContributionDay[] = [];
  let previousTimestamp: number | undefined;
  let countedContributions = 0;

  for (const week of calendar.weeks) {
    if (
      !isRecord(week)
      || !isCanonicalDate(week.firstDay)
      || !Array.isArray(week.contributionDays)
      || week.contributionDays.length < 1
      || week.contributionDays.length > 7
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }

    let firstDate: string | undefined;
    const weekdays = new Set<number>();
    for (const day of week.contributionDays) {
      if (
        !isRecord(day)
        || !isCanonicalDate(day.date)
        || !isSafeCount(day.contributionCount)
        || !Number.isInteger(day.weekday)
        || (day.weekday as number) < 0
        || (day.weekday as number) > 6
      ) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }

      const level = contributionLevel(day.contributionLevel);
      const timestamp = Date.parse(`${day.date}T00:00:00.000Z`);
      if (
        level === undefined
        || weekdays.has(day.weekday as number)
        || new Date(timestamp).getUTCDay() !== day.weekday
        || (previousTimestamp !== undefined
          && timestamp - previousTimestamp !== 86_400_000)
      ) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }

      firstDate ??= day.date;
      weekdays.add(day.weekday as number);
      previousTimestamp = timestamp;
      countedContributions += day.contributionCount;
      if (!Number.isSafeInteger(countedContributions)) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }
      contributions.push({
        date: day.date,
        count: day.contributionCount,
        level,
      });
    }

    if (week.firstDay !== firstDate) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
  }

  if (
    contributions.length < MINIMUM_CALENDAR_DAYS
    || contributions.length > MAXIMUM_CALENDAR_DAYS
    || countedContributions !== calendar.totalContributions
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  return {
    username: GITHUB_CONTRIBUTION_USERNAME,
    contributions,
    totalContributions: calendar.totalContributions,
    fetchedAt,
  };
}

async function readBoundedText(
  response: Response,
  maximumBytes = MAXIMUM_UPSTREAM_BYTES,
  signal?: AbortSignal,
): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null) {
    const parsedLength = Number(contentLength);
    if (
      Number.isFinite(parsedLength)
      && parsedLength > maximumBytes
    ) {
      throw new GithubContributionUpstreamError(
        "github_response_too_large",
      );
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await readStreamChunk(reader, signal);
      if (chunk.done) break;
      receivedBytes += chunk.value.byteLength;
      if (receivedBytes > maximumBytes) {
        await reader.cancel();
        throw new GithubContributionUpstreamError(
          "github_response_too_large",
        );
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof GithubContributionUpstreamError) throw error;
    throw new GithubContributionUpstreamError(
      signal?.aborted ? "github_network_error" : "github_invalid_response",
    );
  } finally {
    reader.releaseLock();
  }

  return text;
}

async function readStreamChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal?: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (!signal) return reader.read();
  if (signal.aborted) {
    await reader.cancel();
    throw new GithubContributionUpstreamError("github_network_error");
  }

  return new Promise((resolve, reject) => {
    const abort = () => {
      void reader.cancel();
      reject(new GithubContributionUpstreamError("github_network_error"));
    };
    signal.addEventListener("abort", abort, { once: true });
    void reader.read().then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
}

async function readBoundedJson(
  response: Response,
  signal?: AbortSignal,
): Promise<unknown> {
  const text = await readBoundedText(response, MAXIMUM_UPSTREAM_BYTES, signal);

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }
}

function htmlAttribute(source: string, name: string): string | undefined {
  const match = source.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`, "i"));
  return match?.[1];
}

function parsePublicCalendar(
  html: string,
  fetchedAt: string,
): GithubContributionsPayload {
  const pairPattern =
    /<td\b([^>]*)>\s*<\/td>\s*<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/gi;
  const contributions: ContributionDay[] = [];
  const seenDates = new Set<string>();
  const seenIds = new Set<string>();

  for (const match of html.matchAll(pairPattern)) {
    const cellAttributes = match[1] ?? "";
    const tooltipAttributes = match[2] ?? "";
    const tooltipText = match[3] ?? "";
    const classes = htmlAttribute(cellAttributes, "class")?.split(/\s+/) ?? [];
    if (!classes.includes("ContributionCalendar-day")) continue;

    const date = htmlAttribute(cellAttributes, "data-date");
    const id = htmlAttribute(cellAttributes, "id");
    const rawLevel = htmlAttribute(cellAttributes, "data-level");
    const tooltipFor = htmlAttribute(tooltipAttributes, "for");
    const countMatch = tooltipText.trim().match(
      /^(No|[0-9][0-9,]*) contributions? on\b/i,
    );
    if (
      !isCanonicalDate(date)
      || !id
      || id.length > 128
      || !/^[A-Za-z0-9_-]+$/.test(id)
      || tooltipFor !== id
      || !/^[0-4]$/.test(rawLevel ?? "")
      || !countMatch
      || seenDates.has(date)
      || seenIds.has(id)
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }

    const level = Number(rawLevel) as ContributionLevel;
    const rawCount = countMatch[1] ?? "";
    if (
      rawCount.toLowerCase() !== "no"
      && !/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/.test(rawCount)
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const count = rawCount.toLowerCase() === "no"
      ? 0
      : Number(rawCount.replaceAll(",", ""));
    if (
      !isSafeCount(count)
      || (count === 0) !== (level === 0)
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }

    seenDates.add(date);
    seenIds.add(id);
    contributions.push({ date, count, level });
  }

  contributions.sort((left, right) => left.date.localeCompare(right.date));
  if (
    contributions.length < MINIMUM_CALENDAR_DAYS
    || contributions.length > MAXIMUM_CALENDAR_DAYS
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  let totalContributions = 0;
  let previousTimestamp: number | undefined;
  for (const day of contributions) {
    const timestamp = Date.parse(`${day.date}T00:00:00.000Z`);
    if (
      previousTimestamp !== undefined
      && timestamp - previousTimestamp !== 86_400_000
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    previousTimestamp = timestamp;
    totalContributions += day.count;
    if (!Number.isSafeInteger(totalContributions)) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
  }

  return {
    username: GITHUB_CONTRIBUTION_USERNAME,
    contributions,
    totalContributions,
    fetchedAt,
  };
}

export async function fetchGithubContributionCalendar(
  options: FetchGithubContributionCalendarOptions,
): Promise<GithubContributionsPayload> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? (() => new Date());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(GITHUB_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "cumulus-contribution-calendar",
      },
      body: JSON.stringify({ query: GITHUB_CONTRIBUTION_QUERY }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new GithubContributionUpstreamError("github_http_error");
    }

    const fetchedAt = now();
    if (Number.isNaN(fetchedAt.getTime())) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const value = await readBoundedJson(response, controller.signal);
    return parseCalendar(value, fetchedAt.toISOString());
  } catch (error) {
    if (error instanceof GithubContributionUpstreamError) throw error;
    throw new GithubContributionUpstreamError("github_network_error");
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicGithubContributionCalendar(
  options: Omit<FetchGithubContributionCalendarOptions, "accessToken">,
): Promise<GithubContributionsPayload> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? (() => new Date());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(GITHUB_PUBLIC_CONTRIBUTIONS_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "text/html; charset=utf-8",
        "User-Agent": "cumulus-contribution-calendar",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new GithubContributionUpstreamError("github_http_error");
    }

    const fetchedAt = now();
    if (Number.isNaN(fetchedAt.getTime())) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const html = await readBoundedText(
      response,
      MAXIMUM_PUBLIC_HTML_BYTES,
      controller.signal,
    );
    return parsePublicCalendar(html, fetchedAt.toISOString());
  } catch (error) {
    if (error instanceof GithubContributionUpstreamError) throw error;
    throw new GithubContributionUpstreamError("github_network_error");
  } finally {
    clearTimeout(timeout);
  }
}
