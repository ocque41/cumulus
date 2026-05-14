import test from "node:test";
import assert from "node:assert/strict";

import { CONTACT_EMAIL, findPage, pageIndex, pages } from "../src/content.js";
import { renderFrame, renderPlain, stripAnsi } from "../src/render.js";

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

test("home and documents advertise create-cumulus", () => {
  const home = renderPlain(findPage("/"));
  const documents = renderPlain(findPage("/documents"));

  assert.match(home, /npx create-cumulus@latest my-acme/);
  assert.match(home, /npm create cumulus@latest my-acme/);
  assert.match(documents, /--template full\|outer\|inner\|agent-auth/);
  assert.match(documents, /--agent-auth hosted\|self-hosted/);
  assert.match(documents, /--cumulus-db cloud\|local\|both/);
  assert.match(documents, /full, inner, and agent-auth default to both/);
  assert.match(documents, /outer defaults to cloud/);
  assert.match(documents, /agent-auth defaults to both Cumulus DB modes/);
  assert.match(documents, /Generated app code talks to Cumulus DB over HTTP\/token APIs/);
});

test("contact page uses the requested email address", () => {
  const contact = findPage("/contact");
  assert.equal(CONTACT_EMAIL, "hi@cumulush.com");
  assert.match(renderPlain(contact), /hi@cumulush\.com/);
});

test("interactive frame renders ASCII logos and horizontal links", () => {
  const home = stripAnsi(renderFrame({ selectedIndex: 0, scroll: 0 }, { columns: 120, rows: 32 }));
  assert.match(home, /cumulus/);
  assert.match(home, /1 Cumulus\s+2 Documents\s+3 Relay\s+4 Tado\s+5 Rune\s+6 Contact/);
  assert.match(home, /<\s+1 Cumulus/);
  assert.match(home, /6 Contact\s+>/);

  const tado = stripAnsi(renderFrame({ selectedIndex: 3, scroll: 0 }, { columns: 120, rows: 40 }));
  assert.match(tado, /\+------\+/);
  assert.match(tado, /\+----------\+\s+\+----------\+\s+\+----------\+/);
});
