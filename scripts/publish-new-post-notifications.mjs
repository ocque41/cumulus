import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_RETRY_AFTER_SECONDS = 60;

function parseRetryAfter(response) {
  const value = Number(response.headers.get("retry-after"));
  if (!Number.isFinite(value) || value < 1) return 15_000;
  return Math.min(value, MAX_RETRY_AFTER_SECONDS) * 1000;
}

async function readResult(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function publishNewPostNotifications({
  attempts = 20,
  dryRunOnly = false,
  fetcher = globalThis.fetch,
  origin,
  secret,
  sleep = (milliseconds) => delay(milliseconds),
  slugs,
}) {
  if (origin !== "https://cumulush.com") throw new Error("Unexpected notification origin.");
  if (new globalThis.TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("Notification publication secret is missing or invalid.");
  }
  if (
    !Array.isArray(slugs)
    || slugs.length === 0
    || new Set(slugs).size !== slugs.length
    || slugs.some((slug) => !SLUG_PATTERN.test(slug))
  ) {
    throw new Error("Notification publication slugs are missing or invalid.");
  }

  const endpoint = `${origin}/api/notifications/publish`;
  const request = async (slug, dryRun) => {
    let lastStatus = 0;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      let response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug, dryRun }),
          signal: globalThis.AbortSignal.timeout(30_000),
        });
      } catch (error) {
        if (attempt === attempts) throw error;
        await sleep(15_000);
        continue;
      }
      lastStatus = response.status;
      const result = await readResult(response);
      if (response.ok) return result;
      if (![404, 429, 503].includes(response.status) || attempt === attempts) {
        throw new Error(`Notification publication failed for ${slug} with HTTP ${response.status}.`);
      }
      await sleep(parseRetryAfter(response));
    }
    throw new Error(`Notification publication failed for ${slug} with HTTP ${lastStatus}.`);
  };

  const results = [];
  for (const slug of slugs) {
    const validation = await request(slug, true);
    if (
      !validation
      || validation.ok !== true
      || validation.dryRun !== true
      || validation.status !== "dry_run"
    ) {
      throw new Error(`Notification dry run returned an invalid result for ${slug}.`);
    }
    if (dryRunOnly) {
      results.push({ slug, status: "dry_run" });
      continue;
    }
    const publication = await request(slug, false);
    if (
      !publication
      || publication.ok !== true
      || publication.dryRun !== false
      || !["created", "already_sent"].includes(publication.status)
    ) {
      throw new Error(`Notification publication returned an invalid result for ${slug}.`);
    }
    results.push({ slug, status: publication.status });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slugs = (process.env.NOTIFICATION_POST_SLUGS ?? "")
    .split("\n")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const results = await publishNewPostNotifications({
    dryRunOnly: process.env.NOTIFICATION_DRY_RUN_ONLY === "true",
    origin: process.env.NOTIFICATION_SITE_ORIGIN ?? "",
    secret: process.env.NOTIFICATION_PUBLISH_SECRET ?? "",
    slugs,
  });
  for (const result of results) {
    console.log(`NOTIFICATION_PUBLICATION_OK slug=${result.slug} status=${result.status}`);
  }
}
