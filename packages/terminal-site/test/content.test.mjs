import test from "node:test";
import assert from "node:assert/strict";

import { CONTACT_EMAIL, findPage, pageIndex, pages } from "../src/content.js";
import { renderFrame, renderPlain, stripAnsi } from "../src/render.js";

test("terminal site exposes the requested pages and aliases", () => {
  assert.deepEqual(
    pages.map((page) => page.route),
    ["/", "/documents", "/contact"],
  );

  assert.equal(findPage("/docs").id, "documents");
  assert.equal(findPage("/documents/").id, "documents");
  assert.equal(pageIndex("/contact"), 2);
});

test("all pages render useful plain output", () => {
  for (const page of pages) {
    const output = renderPlain(page);
    assert.match(output, new RegExp(page.title));
    assert.ok(output.length > 200, `${page.id} should have substantial copy`);
  }
});

test("home and documents focus on Cumulus DB", () => {
  const home = renderPlain(findPage("/"));
  const documents = renderPlain(findPage("/documents"));

  assert.match(home, /Cumulus DB is the free database for AI agents/);
  assert.match(home, /npm run db:build/);
  assert.match(home, /npm run db:start/);
  assert.match(documents, /CUMULUS_DB_ENGINE=jsonl/);
  assert.match(documents, /CUMULUS_DB_MASTER_KEY=replace-with-32-byte-base64-key/);
  assert.match(documents, /App-side code talks to Cumulus DB over HTTP\/token APIs/);
});

test("contact page uses the requested email address", () => {
  const contact = findPage("/contact");
  assert.equal(CONTACT_EMAIL, "hi@cumulush.com");
  assert.match(renderPlain(contact), /hi@cumulush\.com/);
});

test("interactive frame renders ASCII logos and horizontal links", () => {
  const home = stripAnsi(renderFrame({ selectedIndex: 0, scroll: 0 }, { columns: 120, rows: 32 }));
  assert.match(home, /cumulus/);
  assert.match(home, /1 Cumulus\s+2 Documents\s+3 Contact/);
  assert.match(home, /<\s+1 Cumulus/);
  assert.match(home, /3 Contact\s+>/);
});
