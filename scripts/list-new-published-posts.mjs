import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pathToFileURL, URL } from "node:url";

const CONTENT_PATH = "src/content/researched-posts.ts";
const LEGACY_SLUGS_URL = new URL("../src/content/notification-legacy-slugs.json", import.meta.url);
const LEGACY_POST_COUNT = 24;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMMUTABLE_NOTIFICATION_FIELDS = ["title", "excerpt", "date"];

function validatePosts(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} does not export a post array.`);
  const slugs = new Set();
  for (const post of value) {
    if (
      !post
      || typeof post !== "object"
      || typeof post.slug !== "string"
      || !SLUG_PATTERN.test(post.slug)
      || post.status !== "published"
    ) {
      throw new Error(`${label} contains an invalid published post.`);
    }
    if (slugs.has(post.slug)) throw new Error(`${label} contains duplicate slug ${post.slug}.`);
    slugs.add(post.slug);
  }
  return value;
}

export function listNewPublishedSlugs(currentPosts, previousPosts, legacySlugs = []) {
  const current = validatePosts(currentPosts, "Current content");
  const previous = validatePosts(previousPosts, "Previous content");
  const currentBySlug = new Map(current.map((post) => [post.slug, post]));
  const previousBySlug = new Map(previous.map((post) => [post.slug, post]));
  if (!Array.isArray(legacySlugs) || legacySlugs.some((slug) => typeof slug !== "string" || !SLUG_PATTERN.test(slug))) {
    throw new Error("Legacy notification slugs are invalid.");
  }
  const legacy = new Set(legacySlugs);
  if (legacy.size !== legacySlugs.length) throw new Error("Legacy notification slugs contain duplicates.");
  if (
    legacy.size !== LEGACY_POST_COUNT
    || legacySlugs.some((slug) => !previousBySlug.has(slug))
  ) {
    throw new Error("Legacy notification baseline does not match the pre-automation posts.");
  }

  for (const post of previous) {
    if (!currentBySlug.has(post.slug)) {
      throw new Error(`Published immutable slug ${post.slug} was deleted.`);
    }
  }

  for (const post of current) {
    const prior = previousBySlug.get(post.slug);
    if (!prior) continue;
    for (const field of IMMUTABLE_NOTIFICATION_FIELDS) {
      if (post[field] !== prior[field]) {
        throw new Error(
          `Published notification field ${field} changed for immutable slug ${post.slug}.`,
        );
      }
    }
  }

  return current
    .filter((post) => !legacy.has(post.slug))
    .map((post) => post.slug);
}

async function loadPosts(source, label) {
  const withoutTypeImport = source.replace(
    /^import type \{ Post \} from "\.\/post-types\.js";\s*/,
    "",
  );
  const executable = withoutTypeImport.replace(
    /\]\s+as const satisfies readonly Post\[\];\s*$/,
    "];",
  );
  if (executable === source || !executable.endsWith("];")) {
    throw new Error(`${label} does not match the expected public content module.`);
  }
  const encoded = Buffer.from(executable).toString("base64");
  const module = await import(`data:text/javascript;base64,${encoded}`);
  return validatePosts(module.RESEARCHED_POSTS, label);
}

export async function listNewPublishedSlugsFromGit(baseRef) {
  if (!/^[A-Za-z0-9._~^/-]+$/.test(baseRef)) throw new Error("Invalid base ref.");
  const currentSource = await readFile(new URL(`../${CONTENT_PATH}`, import.meta.url), "utf8");
  const previousSource = execFileSync(
    "git",
    ["show", `${baseRef}:${CONTENT_PATH}`],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  const legacySlugs = JSON.parse(await readFile(LEGACY_SLUGS_URL, "utf8"));
  return listNewPublishedSlugs(
    await loadPosts(currentSource, "Current content"),
    await loadPosts(previousSource, "Previous content"),
    legacySlugs,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseRef = process.argv[2];
  if (!baseRef) throw new Error("Usage: node scripts/list-new-published-posts.mjs <base-ref>");
  for (const slug of await listNewPublishedSlugsFromGit(baseRef)) console.log(slug);
}
