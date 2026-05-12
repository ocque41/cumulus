import test from "node:test";
import assert from "node:assert/strict";

import { CONTACT_EMAIL, findPage, pageIndex, pages } from "../src/content.js";
import { renderPlain } from "../src/render.js";

test("terminal site exposes the requested pages and aliases", () => {
  assert.deepEqual(
    pages.map((page) => page.route),
    ["/", "/documents", "/relay", "/tado", "/rune", "/contact"],
  );

  assert.equal(findPage("/docs").id, "documents");
  assert.equal(findPage("/documents/").id, "documents");
  assert.equal(findPage("/cumulus/rune").id, "rune");
  assert.equal(pageIndex("/contact"), 5);
});

test("all pages render useful plain output", () => {
  for (const page of pages) {
    const output = renderPlain(page);
    assert.match(output, new RegExp(page.title));
    assert.ok(output.length > 200, `${page.id} should have substantial copy`);
  }
});

test("contact page uses the requested email address", () => {
  const contact = findPage("/contact");
  assert.equal(CONTACT_EMAIL, "hi@cumulush.com");
  assert.match(renderPlain(contact), /hi@cumulush\.com/);
});
