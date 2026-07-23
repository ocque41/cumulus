import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import { URL } from "node:url";

const ENCODED_PAYLOAD_LIMIT = 65_535;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_CATEGORIES = new Map([
  ["Requisia", "requisia"],
  ["Insuja", "insuja"],
  ["Hyoka Hanesu", "hyoka-hanesu"],
  ["gy", "gy"],
  ["Editorial", undefined],
]);
const ALLOWED_PLACEMENTS = new Set([
  "featured",
  "feature-rail",
  "recent",
  "stories",
  "research",
  "build-business",
]);
const ALLOWED_VARIANTS = new Set([
  "cloud-gate",
  "signal-window",
  "terminal-rain",
  "archive-lines",
  "split-horizon",
  "key-vault",
  "paper-field",
  "local-orbit",
  "record-lattice",
  "release-bars",
  "shared-notebook",
  "event-river",
  "handoff-map",
  "compact-grid",
  "plan-stack",
  "context-rings",
  "cost-contours",
  "contract-bridge",
  "workspace-beacon",
]);
const PAYLOAD_KEYS = new Set([
  "attemptNumber",
  "contentDigest",
  "correlationId",
  "draftId",
  "post",
  "schemaVersion",
  "sourceHash",
]);
const POST_KEYS = new Set([
  "body",
  "category",
  "date",
  "excerpt",
  "placement",
  "project",
  "relatedSlugs",
  "slug",
  "sourceLinks",
  "status",
  "tags",
  "title",
  "verifiedAt",
  "visual",
]);

function exactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label} contains unsupported field: ${key}.`);
  }
}

function requiredString(value, label, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(`${label} must be a non-empty string of at most ${maxLength} characters.`);
  }
  return value.trim();
}

function validDate(value, label) {
  const date = requiredString(value, label, 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    !DATE_PATTERN.test(date)
    || Number.isNaN(parsed.getTime())
    || !parsed.toISOString().startsWith(date)
  ) {
    throw new Error(`${label} must be a valid YYYY-MM-DD date.`);
  }
  return date;
}

function safeHttpsUrl(value, label) {
  const href = requiredString(value, label, 2_048);
  const url = new URL(href);
  if (
    url.protocol !== "https:"
    || url.username
    || url.password
    || ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
  ) {
    throw new Error(`${label} must be a public HTTPS URL.`);
  }
  return href;
}

function stringArray(value, label, { maxItems, maxLength, minItems = 0 }) {
  if (!Array.isArray(value) || value.length < minItems || value.length > maxItems) {
    throw new Error(`${label} must contain between ${minItems} and ${maxItems} items.`);
  }
  const result = value.map((item, index) =>
    requiredString(item, `${label}[${index}]`, maxLength)
  );
  if (new Set(result.map((item) => item.toLocaleLowerCase("en-US"))).size !== result.length) {
    throw new Error(`${label} must not contain duplicates.`);
  }
  return result;
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function validatePost(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("post must be an object.");
  }
  exactKeys(input, POST_KEYS, "post");

  const slug = requiredString(input.slug, "post.slug", 120);
  if (!SLUG_PATTERN.test(slug)) throw new Error("post.slug must use lowercase kebab case.");
  const title = requiredString(input.title, "post.title", 180);
  const excerpt = requiredString(input.excerpt, "post.excerpt", 500);
  const date = validDate(input.date, "post.date");
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) throw new Error("post.date cannot be in the future.");
  if (input.status !== "published") throw new Error("post.status must be published.");
  const category = requiredString(input.category, "post.category", 40);
  if (!ALLOWED_CATEGORIES.has(category)) throw new Error("post.category is not approved.");
  const expectedProject = ALLOWED_CATEGORIES.get(category);
  const project = input.project === undefined
    ? undefined
    : requiredString(input.project, "post.project", 40);
  if (project !== expectedProject) {
    throw new Error("post.project does not match the approved category mapping.");
  }
  const tags = stringArray(input.tags, "post.tags", {
    maxItems: 10,
    maxLength: 60,
    minItems: 2,
  });
  if (!ALLOWED_PLACEMENTS.has(input.placement)) {
    throw new Error("post.placement is not supported.");
  }
  if (!input.visual || typeof input.visual !== "object" || Array.isArray(input.visual)) {
    throw new Error("post.visual must be an object.");
  }
  exactKeys(input.visual, new Set(["alt", "variant"]), "post.visual");
  if (!ALLOWED_VARIANTS.has(input.visual.variant)) {
    throw new Error("post.visual.variant is not approved.");
  }
  const visual = {
    alt: requiredString(input.visual.alt, "post.visual.alt", 300),
    variant: input.visual.variant,
  };
  if (!Array.isArray(input.body) || input.body.length < 1 || input.body.length > 6) {
    throw new Error("post.body must contain between one and six sections.");
  }
  const body = input.body.map((section, sectionIndex) => {
    if (!section || typeof section !== "object" || Array.isArray(section)) {
      throw new Error(`post.body[${sectionIndex}] must be an object.`);
    }
    exactKeys(section, new Set(["heading", "paragraphs"]), `post.body[${sectionIndex}]`);
    return {
      heading: requiredString(
        section.heading,
        `post.body[${sectionIndex}].heading`,
        180,
      ),
      paragraphs: stringArray(
        section.paragraphs,
        `post.body[${sectionIndex}].paragraphs`,
        { maxItems: 12, maxLength: 5_000, minItems: 1 },
      ),
    };
  });
  const relatedSlugs = input.relatedSlugs === undefined
    ? undefined
    : stringArray(input.relatedSlugs, "post.relatedSlugs", {
        maxItems: 6,
        maxLength: 120,
      });
  relatedSlugs?.forEach((relatedSlug) => {
    if (!SLUG_PATTERN.test(relatedSlug) || relatedSlug === slug) {
      throw new Error("post.relatedSlugs contains an invalid or self-referencing slug.");
    }
  });
  const sourceLinks = input.sourceLinks === undefined
    ? undefined
    : input.sourceLinks.map((source, index) => {
        if (!source || typeof source !== "object" || Array.isArray(source)) {
          throw new Error(`post.sourceLinks[${index}] must be an object.`);
        }
        exactKeys(source, new Set(["href", "label"]), `post.sourceLinks[${index}]`);
        return {
          href: safeHttpsUrl(source.href, `post.sourceLinks[${index}].href`),
          label: requiredString(source.label, `post.sourceLinks[${index}].label`, 180),
        };
      });
  if (sourceLinks && sourceLinks.length > 20) {
    throw new Error("post.sourceLinks cannot contain more than 20 links.");
  }
  const verifiedAt = validDate(input.verifiedAt, "post.verifiedAt");
  if (verifiedAt > today) throw new Error("post.verifiedAt cannot be in the future.");

  return {
    slug,
    title,
    excerpt,
    status: "published",
    date,
    category,
    tags,
    placement: input.placement,
    visual,
    body,
    ...(project ? { project } : {}),
    ...(sourceLinks ? { sourceLinks } : {}),
    ...(relatedSlugs ? { relatedSlugs } : {}),
    verifiedAt,
  };
}

export function decodePublicationPayload(encoded) {
  if (
    typeof encoded !== "string"
    || encoded.length < 1
    || encoded.length > ENCODED_PAYLOAD_LIMIT
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  ) {
    throw new Error("Publication payload is missing, malformed, or oversized.");
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    throw new Error("Publication payload is not valid base64-encoded JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Publication payload must be an object.");
  }
  exactKeys(parsed, PAYLOAD_KEYS, "payload");
  if (parsed.schemaVersion !== 1) throw new Error("Unsupported publication schema version.");
  const draftId = requiredString(parsed.draftId, "payload.draftId", 128);
  const correlationId = requiredString(parsed.correlationId, "payload.correlationId", 128);
  if (!ID_PATTERN.test(draftId) || !ID_PATTERN.test(correlationId)) {
    throw new Error("Draft and correlation identifiers contain unsupported characters.");
  }
  if (!Number.isInteger(parsed.attemptNumber) || parsed.attemptNumber < 1) {
    throw new Error("payload.attemptNumber must be a positive integer.");
  }
  if (!HASH_PATTERN.test(parsed.sourceHash) || !HASH_PATTERN.test(parsed.contentDigest)) {
    throw new Error("Payload hashes must be lowercase SHA-256 values.");
  }
  const post = validatePost(parsed.post);
  const calculatedDigest = sha256(stableJson(post));
  if (calculatedDigest !== parsed.contentDigest) {
    throw new Error("payload.contentDigest does not match the validated post.");
  }
  return {
    attemptNumber: parsed.attemptNumber,
    contentDigest: calculatedDigest,
    correlationId,
    draftId,
    post,
    schemaVersion: 1,
    sourceHash: parsed.sourceHash,
  };
}

export function applyPublication(catalog, payload) {
  if (!Array.isArray(catalog)) throw new Error("Content catalog must be an array.");
  const publishedSlugs = new Set(
    catalog
      .filter((post) => post && typeof post === "object" && post.status === "published")
      .map((post) => post.slug),
  );
  for (const relatedSlug of payload.post.relatedSlugs ?? []) {
    if (!publishedSlugs.has(relatedSlug)) {
      throw new Error(`Related slug does not resolve to a published post: ${relatedSlug}.`);
    }
  }
  const existing = catalog.find((post) => post.slug === payload.post.slug);
  if (existing) {
    if (sha256(stableJson(validatePost(existing))) === payload.contentDigest) {
      return { catalog, reused: true };
    }
    throw new Error(`Duplicate slug: ${payload.post.slug}.`);
  }
  const next = [...catalog];
  const insertionIndex = next.findIndex((post) => post.date <= payload.post.date);
  next.splice(insertionIndex < 0 ? next.length : insertionIndex, 0, payload.post);
  return { catalog: next, reused: false };
}

export function publicationBranch(payload) {
  const draftFragment = sha256(payload.draftId).slice(0, 10);
  return `content/${payload.post.slug}-${draftFragment}-a${payload.attemptNumber}`;
}

async function writeOutput(path, fields) {
  if (!path) return;
  const lines = Object.entries(fields).map(([key, value]) => `${key}=${value}`);
  await writeFile(path, `${lines.join("\n")}\n`, { flag: "a" });
}

async function runCli() {
  const args = new Set(process.argv.slice(2));
  const encoded = process.env.PUBLISHER_PAYLOAD_BASE64;
  const payload = decodePublicationPayload(encoded);
  const branch = publicationBranch(payload);
  const catalogPath = process.env.PUBLISHER_CATALOG_PATH ?? "src/content/posts.json";
  let reused = false;

  if (args.has("--write")) {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    const result = applyPublication(catalog, payload);
    reused = result.reused;
    if (!reused) {
      await writeFile(catalogPath, `${JSON.stringify(result.catalog, null, 2)}\n`);
    }
  }

  await writeOutput(process.env.GITHUB_OUTPUT, {
    attempt_number: payload.attemptNumber,
    branch,
    content_digest: payload.contentDigest,
    correlation_id: payload.correlationId,
    draft_id: payload.draftId,
    reused,
    slug: payload.post.slug,
  });
  if (process.env.PUBLISHER_RESULT_PATH) {
    await writeFile(
      process.env.PUBLISHER_RESULT_PATH,
      `${JSON.stringify({
        attemptNumber: payload.attemptNumber,
        branch,
        contentDigest: payload.contentDigest,
        correlationId: payload.correlationId,
        draftId: payload.draftId,
        reused,
        slug: payload.post.slug,
      }, null, 2)}\n`,
    );
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  runCli().catch((error) => {
    console.error(`PUBLISHER_CONTRACT_ERROR ${error.message}`);
    process.exitCode = 1;
  });
}
