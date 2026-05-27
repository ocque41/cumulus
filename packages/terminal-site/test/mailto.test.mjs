import test from "node:test";
import assert from "node:assert/strict";

import { buildMailtoUrl, openMailDraft } from "../src/mailto.js";

test("buildMailtoUrl prepares an addressed draft", () => {
  const url = buildMailtoUrl("Hello from the terminal");
  const decoded = decodeURIComponent(url).replaceAll("+", " ");
  assert.ok(url.startsWith("mailto:hi@cumulush.com?"));
  assert.match(decoded, /Cumulus terminal contact/);
  assert.match(decoded, /Hello from the terminal/);
});

test("openMailDraft supports dry runs for tests and CI", () => {
  const result = openMailDraft("No external app should launch", { dryRun: true });
  assert.equal(result.ok, true);
  assert.equal(result.command, "dry-run");
  assert.match(result.url, /^mailto:hi@cumulush\.com/);
});
