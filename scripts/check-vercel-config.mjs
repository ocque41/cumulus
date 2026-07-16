import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

assert.equal(config.cleanUrls, true, "Vercel clean URLs must remain enabled");
assert.deepEqual(
  config.rewrites,
  [{ source: "/((?!api/).*)", destination: "/index" }],
  "The SPA fallback must be extensionless and must not catch /api routes",
);

const headersBySource = new Map(config.headers.map((entry) => [entry.source, entry.headers]));
for (const source of ["/auth/callback", "/unsubscribe"]) {
  const headers = new Map(headersBySource.get(source)?.map(({ key, value }) => [key, value]));
  assert.equal(headers.get("Cache-Control"), "private, no-store, max-age=0");
  assert.equal(headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(headers.get("X-Robots-Tag"), "noindex, nofollow");
}

assert.ok(headersBySource.has("/assets/(.*)"), "Immutable asset headers must remain configured");
assert.ok(headersBySource.has("/(.*)"), "Global security headers must remain configured");
assert.equal(config.functions?.["api/**/*.ts"]?.maxDuration, 60, "API function config must remain intact");

console.log("VERCEL_CONFIG_OK");
