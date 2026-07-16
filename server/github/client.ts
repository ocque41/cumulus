import {
  GITHUB_CONTRIBUTION_USERNAME,
  type ContributionDay,
  type ContributionLevel,
  type GithubActivityDay,
  type GithubActivityHighlight,
  type GithubContributionsPayload,
} from "./types.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
export const GITHUB_PUBLIC_CONTRIBUTIONS_ENDPOINT =
  "https://github.com/users/ocque41/contributions";
export const GITHUB_PUBLIC_ACTIVITY_ENDPOINT =
  "https://api.github.com/users/ocque41/events/public?per_page=100&page=1";
const MAXIMUM_UPSTREAM_BYTES = 256 * 1024;
const MAXIMUM_PUBLIC_HTML_BYTES = 512 * 1024;
const MAXIMUM_PUBLIC_SEARCH_BYTES = 2 * 1024 * 1024;
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
        commitContributionsByRepository(maxRepositories: 50) {
          repository {
            nameWithOwner
          }
          contributions(first: 100) {
            nodes {
              commitCount
              occurredAt
            }
          }
        }
        issueContributions(first: 100) {
          nodes {
            occurredAt
            issue {
              title
              url
              repository {
                nameWithOwner
              }
            }
          }
        }
        pullRequestContributions(first: 100) {
          nodes {
            occurredAt
            pullRequest {
              title
              url
              repository {
                nameWithOwner
              }
            }
          }
        }
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

const MAXIMUM_HIGHLIGHTS_PER_DAY = 6;
const MAXIMUM_TITLE_LENGTH = 140;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;

function canonicalGithubUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 512) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function activityDate(value: unknown): string | undefined {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return undefined;
  const date = new Date(value).toISOString().slice(0, 10);
  return isCanonicalDate(date) ? date : undefined;
}

function activityDays(collection: Record<string, unknown>): {
  activityDays: GithubActivityDay[];
  activityDetailStatus: "live" | "unavailable";
} {
  const commitGroups = collection.commitContributionsByRepository;
  const issueConnection = collection.issueContributions;
  const pullRequestConnection = collection.pullRequestContributions;
  if (
    commitGroups === undefined
    && issueConnection === undefined
    && pullRequestConnection === undefined
  ) {
    return { activityDays: [], activityDetailStatus: "unavailable" };
  }
  if (
    !Array.isArray(commitGroups)
    || !isRecord(issueConnection)
    || !Array.isArray(issueConnection.nodes)
    || !isRecord(pullRequestConnection)
    || !Array.isArray(pullRequestConnection.nodes)
    || commitGroups.length > 50
    || issueConnection.nodes.length > 100
    || pullRequestConnection.nodes.length > 100
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  const days = new Map<string, GithubActivityDay>();
  const dayFor = (date: string): GithubActivityDay => {
    const existing = days.get(date);
    if (existing) return existing;
    const next: GithubActivityDay = {
      commits: 0,
      date,
      highlights: [],
      issues: 0,
      pullRequests: 0,
    };
    days.set(date, next);
    return next;
  };
  const addHighlight = (day: GithubActivityDay, highlight: GithubActivityHighlight) => {
    if (day.highlights.length < MAXIMUM_HIGHLIGHTS_PER_DAY) {
      day.highlights.push(highlight);
    }
  };

  for (const group of commitGroups) {
    if (!isRecord(group) || !isRecord(group.repository) || !isRecord(group.contributions)) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const repository = group.repository.nameWithOwner;
    const nodes = group.contributions.nodes;
    if (
      typeof repository !== "string"
      || !REPOSITORY_PATTERN.test(repository)
      || !Array.isArray(nodes)
      || nodes.length > 100
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    for (const node of nodes) {
      if (!isRecord(node) || !isSafeCount(node.commitCount)) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }
      const date = activityDate(node.occurredAt);
      if (!date) throw new GithubContributionUpstreamError("github_invalid_response");
      const day = dayFor(date);
      day.commits = (day.commits ?? 0) + node.commitCount;
      if (!Number.isSafeInteger(day.commits)) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }
      addHighlight(day, {
        kind: "commit",
        repository,
        title: `${node.commitCount} commit${node.commitCount === 1 ? "" : "s"}`,
      });
    }
  }

  const parseCreated = (
    nodes: unknown[],
    field: "issue" | "pullRequest",
    kind: "issue" | "pull-request",
  ) => {
    for (const node of nodes) {
      if (!isRecord(node) || !isRecord(node[field])) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }
      const date = activityDate(node.occurredAt);
      const item = node[field] as Record<string, unknown>;
      const repositoryRecord = item.repository;
      const repository = isRecord(repositoryRecord)
        ? repositoryRecord.nameWithOwner
        : undefined;
      const url = canonicalGithubUrl(item.url);
      if (
        !date
        || typeof item.title !== "string"
        || item.title.length === 0
        || typeof repository !== "string"
        || !REPOSITORY_PATTERN.test(repository)
        || !url
      ) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }
      const day = dayFor(date);
      if (kind === "issue") day.issues += 1;
      else day.pullRequests += 1;
      addHighlight(day, {
        kind,
        repository,
        title: item.title.slice(0, MAXIMUM_TITLE_LENGTH),
        url,
      });
    }
  };

  parseCreated(issueConnection.nodes, "issue", "issue");
  parseCreated(pullRequestConnection.nodes, "pullRequest", "pull-request");
  return {
    activityDays: [...days.values()].sort((left, right) => left.date.localeCompare(right.date)),
    activityDetailStatus: "live",
  };
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

  const activity = activityDays(collection as Record<string, unknown>);

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
    ...activity,
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
    activityDays: [],
    activityDetailStatus: "unavailable",
    username: GITHUB_CONTRIBUTION_USERNAME,
    contributions,
    totalContributions,
    fetchedAt,
  };
}

function parsePublicActivity(
  value: unknown,
  observedAt: Date,
): Pick<GithubContributionsPayload, "activityDays" | "activityDetailStatus"> {
  if (!Array.isArray(value) || value.length > 100) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  const days = new Map<string, GithubActivityDay>();
  const seenEventIds = new Set<string>();
  const seenPullRequests = new Map<string, Set<string>>();
  const seenIssues = new Map<string, Set<string>>();
  const minimumTimestamp = observedAt.getTime() - 32 * 86_400_000;
  const maximumTimestamp = observedAt.getTime() + 6 * 3_600_000;
  const dayFor = (date: string): GithubActivityDay => {
    const existing = days.get(date);
    if (existing) return existing;
    const next: GithubActivityDay = {
      commits: null,
      date,
      highlights: [],
      issues: 0,
      pullRequests: 0,
    };
    days.set(date, next);
    return next;
  };
  const addHighlight = (day: GithubActivityDay, highlight: GithubActivityHighlight) => {
    if (day.highlights.length < MAXIMUM_HIGHLIGHTS_PER_DAY) day.highlights.push(highlight);
  };

  for (const event of value) {
    if (
      !isRecord(event)
      || typeof event.id !== "string"
      || !/^\d{1,30}$/.test(event.id)
      || seenEventIds.has(event.id)
      || typeof event.type !== "string"
      || !isRecord(event.actor)
      || typeof event.actor.login !== "string"
      || event.actor.login.toLowerCase() !== GITHUB_CONTRIBUTION_USERNAME
      || !isRecord(event.repo)
      || typeof event.repo.name !== "string"
      || !REPOSITORY_PATTERN.test(event.repo.name)
      || !isRecord(event.payload)
      || event.public !== true
      || typeof event.created_at !== "string"
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const timestamp = Date.parse(event.created_at);
    const date = activityDate(event.created_at);
    if (!date || timestamp < minimumTimestamp || timestamp > maximumTimestamp) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    seenEventIds.add(event.id);
    const repository = event.repo.name;
    const payload = event.payload;
    const day = dayFor(date);

    if (event.type === "PushEvent") {
      const commits = isSafeCount(payload.size)
        ? Math.min(payload.size, 10_000)
        : Array.isArray(payload.commits) && payload.commits.length <= 100
          ? payload.commits.length
          : 0;
      if (commits > 0) day.commits = (day.commits ?? 0) + commits;
      if (day.commits !== null && !Number.isSafeInteger(day.commits)) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }
      const branch = typeof payload.ref === "string" && payload.ref.length <= 200
        ? payload.ref.replace(/^refs\/heads\//, "")
        : "a public ref";
      addHighlight(day, {
        kind: "commit",
        repository,
        title: commits > 0
          ? `${commits} commit${commits === 1 ? "" : "s"} to ${branch}`
          : `Push to ${branch}`,
      });
      continue;
    }

    const createdItem = event.type === "PullRequestEvent"
      ? payload.pull_request
      : event.type === "IssuesEvent"
        ? payload.issue
        : undefined;
    if (createdItem === undefined) continue;
    if (!isRecord(createdItem)) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const url = canonicalGithubUrl(createdItem.html_url);
    const number = createdItem.number;
    const action = payload.action;
    if (
      typeof createdItem.title !== "string"
      || createdItem.title.length === 0
      || !isSafeCount(number)
      || typeof action !== "string"
      || !/^[a-z_-]{1,32}$/.test(action)
      || !url
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const key = `${repository}#${number}`;
    const isPullRequest = event.type === "PullRequestEvent";
    const seenItems = isPullRequest ? seenPullRequests : seenIssues;
    const dateItems = seenItems.get(date) ?? new Set<string>();
    if (!dateItems.has(key)) {
      if (isPullRequest) day.pullRequests += 1;
      else day.issues += 1;
      dateItems.add(key);
      seenItems.set(date, dateItems);
    }
    addHighlight(day, {
      kind: isPullRequest ? "pull-request" : "issue",
      repository,
      title: `${action}: ${createdItem.title.slice(0, MAXIMUM_TITLE_LENGTH - action.length - 2)}`,
      url,
    });
  }

  return {
    activityDays: [...days.values()]
      .filter((day) => (day.commits ?? 0) > 0 || day.pullRequests > 0 || day.issues > 0 || day.highlights.length > 0)
      .sort((left, right) => left.date.localeCompare(right.date)),
    activityDetailStatus: "live",
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

export async function fetchPublicGithubActivity(
  options: Omit<FetchGithubContributionCalendarOptions, "accessToken">,
): Promise<Pick<GithubContributionsPayload, "activityDays" | "activityDetailStatus">> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? (() => new Date());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(GITHUB_PUBLIC_ACTIVITY_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "cumulus-contribution-calendar",
        "X-GitHub-Api-Version": "2026-03-10",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new GithubContributionUpstreamError("github_http_error");
    }
    const observedAt = now();
    if (Number.isNaN(observedAt.getTime())) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const value = await readBoundedJson(response, controller.signal);
    return parsePublicActivity(value, observedAt);
  } catch (error) {
    if (error instanceof GithubContributionUpstreamError) throw error;
    throw new GithubContributionUpstreamError("github_network_error");
  } finally {
    clearTimeout(timeout);
  }
}

interface PublicCommitSearchPage {
  incomplete: boolean;
  items: unknown[];
  totalCount: number;
}

function parsePublicCommitSearchPage(value: unknown): PublicCommitSearchPage {
  if (
    !isRecord(value)
    || !isSafeCount(value.total_count)
    || value.total_count > 10_000
    || typeof value.incomplete_results !== "boolean"
    || !Array.isArray(value.items)
    || value.items.length > 100
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }
  return {
    incomplete: value.incomplete_results,
    items: value.items,
    totalCount: value.total_count,
  };
}

function parsePublicCommitActivity(
  pages: readonly PublicCommitSearchPage[],
  observedAt: Date,
): GithubActivityDay[] {
  const days = new Map<string, GithubActivityDay>();
  const seen = new Set<string>();
  const minimumTimestamp = observedAt.getTime() - 32 * 86_400_000;
  const maximumTimestamp = observedAt.getTime() + 6 * 3_600_000;

  for (const item of pages.flatMap((page) => page.items)) {
    if (
      !isRecord(item)
      || typeof item.sha !== "string"
      || !/^[a-f0-9]{40,64}$/i.test(item.sha)
      || seen.has(item.sha)
      || !isRecord(item.author)
      || typeof item.author.login !== "string"
      || item.author.login.toLowerCase() !== GITHUB_CONTRIBUTION_USERNAME
      || !isRecord(item.repository)
      || typeof item.repository.full_name !== "string"
      || !REPOSITORY_PATTERN.test(item.repository.full_name)
      || !isRecord(item.commit)
      || !isRecord(item.commit.author)
      || typeof item.commit.author.date !== "string"
      || typeof item.commit.message !== "string"
      || item.commit.message.length === 0
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    const timestamp = Date.parse(item.commit.author.date);
    const date = activityDate(item.commit.author.date);
    const url = canonicalGithubUrl(item.html_url);
    if (!date || !url || timestamp < minimumTimestamp || timestamp > maximumTimestamp) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
    seen.add(item.sha);
    const repository = item.repository.full_name;
    const day = days.get(date) ?? {
      commits: 0,
      date,
      highlights: [],
      issues: 0,
      pullRequests: 0,
    };
    day.commits = (day.commits ?? 0) + 1;
    if (day.highlights.length < MAXIMUM_HIGHLIGHTS_PER_DAY) {
      const firstLine = item.commit.message.split(/\r?\n/, 1)[0]?.trim() ?? "Commit";
      day.highlights.push({
        kind: "commit",
        repository,
        title: firstLine.slice(0, MAXIMUM_TITLE_LENGTH),
        url,
      });
    }
    days.set(date, day);
  }
  return [...days.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export async function fetchPublicGithubCommitActivity(
  options: Omit<FetchGithubContributionCalendarOptions, "accessToken">,
): Promise<GithubActivityDay[]> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? (() => new Date());
  const observedAt = now();
  if (Number.isNaN(observedAt.getTime())) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }
  const since = new Date(observedAt.getTime() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchPage = async (page: number): Promise<PublicCommitSearchPage> => {
    const parameters = new URLSearchParams({
      order: "desc",
      page: String(page),
      per_page: "100",
      q: `author:${GITHUB_CONTRIBUTION_USERNAME} committer-date:>=${since}`,
      sort: "committer-date",
    });
    const response = await fetcher(`https://api.github.com/search/commits?${parameters}`, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "cumulus-contribution-calendar",
        "X-GitHub-Api-Version": "2026-03-10",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new GithubContributionUpstreamError("github_http_error");
    const text = await readBoundedText(response, MAXIMUM_PUBLIC_SEARCH_BYTES, controller.signal);
    try {
      return parsePublicCommitSearchPage(JSON.parse(text) as unknown);
    } catch (error) {
      if (error instanceof GithubContributionUpstreamError) throw error;
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
  };

  try {
    const first = await fetchPage(1);
    const pages = first.totalCount > first.items.length
      ? [first, await fetchPage(2)]
      : [first];
    return parsePublicCommitActivity(pages, observedAt);
  } catch (error) {
    if (error instanceof GithubContributionUpstreamError) throw error;
    throw new GithubContributionUpstreamError("github_network_error");
  } finally {
    clearTimeout(timeout);
  }
}
