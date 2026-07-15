import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  contentPagesForMode,
  createContentManifest,
} from "../../scripts/content-manifest.mjs";
import {
  resolveContentOutputPath,
  resolveContentRoute,
} from "../../scripts/content-page.mjs";
import { renderContentIndex } from "../../scripts/generate-content-index.mjs";

async function makeContentSite() {
  const rootDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "content-manifest-test-"));
  await fs.mkdir(path.join(rootDirectory, "content", "blog", "draft-post"), { recursive: true });
  await fs.mkdir(path.join(rootDirectory, "content", "notes"), { recursive: true });
  await fs.mkdir(path.join(rootDirectory, "content", "includes"), { recursive: true });

  await fs.writeFile(path.join(rootDirectory, "content", "index.md"), [
    "---",
    "title: Home",
    "status: published",
    "---",
  ].join("\n"));
  await fs.writeFile(path.join(rootDirectory, "content", "blog", "draft-post", "index.md"), [
    "---",
    "title: Draft Post",
    "---",
  ].join("\n"));
  await fs.writeFile(path.join(rootDirectory, "content", "notes", "scratch.md"), "# Scratch\n");
  await fs.writeFile(path.join(rootDirectory, "content", "includes", "partial.md"), "ignored\n");

  return rootDirectory;
}

test("content manifest defaults pages to draft and filters production", async () => {
  const rootDirectory = await makeContentSite();
  const manifest = createContentManifest(rootDirectory);
  const developmentPages = contentPagesForMode(manifest, "development");
  const productionPages = contentPagesForMode(manifest, "production");

  assert.equal(manifest.length, 3);
  assert.deepEqual(
    developmentPages.map((page) => [page.relativeSourcePath, page.status]),
    [
      ["blog/draft-post/index.md", "draft"],
      ["index.md", "published"],
      ["notes/scratch.md", "draft"],
    ],
  );
  assert.deepEqual(productionPages.map((page) => page.relativeSourcePath), ["index.md"]);

  await fs.rm(rootDirectory, { recursive: true, force: true });
});

test("content routes and output paths agree for nested subpages", () => {
  const rootDirectory = "/site";
  const inputPath = "/site/content/notes/scratch.md";

  assert.equal(resolveContentRoute(inputPath, rootDirectory), "/notes/scratch/");
  assert.equal(resolveContentOutputPath(inputPath, rootDirectory), "notes/scratch/index.html");
});

test("content manifest rejects unknown statuses", async () => {
  const rootDirectory = await makeContentSite();
  await fs.writeFile(path.join(rootDirectory, "content", "bad.md"), [
    "---",
    "status: private",
    "---",
  ].join("\n"));

  assert.throws(
    () => createContentManifest(rootDirectory),
    /invalid status "private"; expected draft or published/,
  );

  await fs.rm(rootDirectory, { recursive: true, force: true });
});

test("local content index links both draft and published pages", async () => {
  const rootDirectory = await makeContentSite();
  const markdown = renderContentIndex(createContentManifest(rootDirectory));

  assert.match(markdown, /title: content/);
  assert.match(markdown, /content-index: true/);
  assert.match(markdown, /## DRAFT/);
  assert.match(markdown, /class="content-tree__directory-name" href="\/blog\/draft-post\/"/);
  assert.match(markdown, />draft-post\/<\/a>/);
  assert.match(markdown, /href="\/notes\/scratch\/">scratch<\/a>/);
  assert.match(markdown, /## PUBLISHED/);
  assert.match(markdown, /class="content-tree__directory-name" href="\/"/);
  assert.match(markdown, />content\/<\/a>/);
  assert.match(markdown, /&#x251C;&#x2500;&#x2500;/);
  assert.match(markdown, /&#x2514;&#x2500;&#x2500;/);
  assert.match(markdown, /&#x2502;(?:&#x00A0;){3}/);
  assert.doesNotMatch(markdown, /index\.md/);

  await fs.rm(rootDirectory, { recursive: true, force: true });
});
