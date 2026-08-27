import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildPageCitationMetadata } from "../../scripts/page-citation.mjs";

test("buildPageCitationMetadata leaves pages without a citation key alone", () => {
  const markdown = [
    "---",
    "title: an ordinary post",
    "date: 2026-07-04",
    "---",
  ].join("\n");

  assert.deepEqual(buildPageCitationMetadata(markdown), {});
});

test("buildPageCitationMetadata derives display fields from page metadata", () => {
  const markdown = [
    "---",
    "title: closed LLM API providers are charging you _twice_ for output tokens",
    "author: Hunter Paulson",
    "date: 2026-07-04",
    "canonical-url: https://hunterpaulson.dev/blog/cache-write-output-tokens/",
    "citation-key: paulson2026cachewriteoutputtokens",
    "---",
  ].join("\n");

  assert.deepEqual(buildPageCitationMetadata(markdown), {
    "citation-author": "Hunter Paulson",
    "citation-month": "July",
    "citation-title": "closed LLM API providers are charging you twice for output tokens",
    "citation-url": "https://hunterpaulson.dev/blog/cache-write-output-tokens/",
    "citation-year": "2026",
  });
});

test("buildPageCitationMetadata requires complete citation metadata", () => {
  assert.throws(() => buildPageCitationMetadata([
    "---",
    "title: incomplete post",
    "date: sometime",
    "citation-key: paulson2026incomplete",
    "---",
  ].join("\n")), /citation requires author, date in YYYY-MM-DD format, and canonical-url/);
});

test("buildPageCitationMetadata rejects unstable citation keys", () => {
  assert.throws(() => buildPageCitationMetadata([
    "---",
    "title: example",
    "author: Hunter Paulson",
    "date: 2026-01-01",
    "canonical-url: https://example.com/blog/example/",
    "citation-key: Example Citation",
    "---",
  ].join("\n")), /invalid citation-key/);
});

test("buildPageCitationMetadata escapes BibTeX-sensitive text", () => {
  const metadata = buildPageCitationMetadata([
    "---",
    'title: C# & C_{x} use "quoted" values at 50%',
    "author: Hunter Paulson & Example Collaborator",
    "date: 2026-01-01",
    "canonical-url: https://example.com/blog/example/",
    "citation-key: paulson2026example",
    "---",
  ].join("\n"));

  assert.equal(
    metadata["citation-title"],
    'C\\# \\& C\\_\\{x\\} use {"}quoted{"} values at 50\\%',
  );
  assert.equal(metadata["citation-author"], "Hunter Paulson \\& Example Collaborator");
});

test("the template puts unlabeled citation code between end matter and the site footer", () => {
  const template = fs.readFileSync("content/template.html", "utf8");
  const bodyIndex = template.indexOf("$body$");
  const citationIndex = template.indexOf("$if(citation-key)$");
  const footerIndex = template.indexOf('<footer class="site-footer">');

  assert.ok(bodyIndex < citationIndex);
  assert.ok(citationIndex < footerIndex);
  assert.match(
    template.slice(citationIndex, footerIndex),
    /<hr \/>\s*<pre class="bibtex" data-filename="BibTeX"><code>@article/,
  );
  assert.doesNotMatch(template, /if you want to cite this/i);
});
