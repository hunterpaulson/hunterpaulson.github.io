import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildPageMetadata,
  injectPageMetadata,
  markdownToPlainText,
  parseFrontMatter,
  readImageMetadata,
  resolveContentRoute,
} from "../../scripts/page-metadata.mjs";
import { prepareMarkdownPage } from "../../scripts/prepare-markdown-page.mjs";

function makeGifHeader(width, height) {
  const buffer = Buffer.alloc(10);
  buffer.write("GIF89a", 0, "ascii");
  buffer.writeUInt16LE(width, 6);
  buffer.writeUInt16LE(height, 8);
  return buffer;
}

async function makeTempSite() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "page-metadata-test-"));
  await fs.mkdir(path.join(tempRoot, "content", "blog", "post"), { recursive: true });
  await fs.mkdir(path.join(tempRoot, "assets", "social"), { recursive: true });
  await fs.writeFile(
    path.join(tempRoot, "assets", "social", "card.gif"),
    makeGifHeader(1200, 630),
  );
  return tempRoot;
}

test("resolveContentRoute maps content files to production routes", () => {
  const rootDirectory = "/site";

  assert.equal(resolveContentRoute("/site/content/index.md", rootDirectory), "/");
  assert.equal(resolveContentRoute("/site/content/404.md", rootDirectory), "/404.html");
  assert.equal(resolveContentRoute("/site/content/art/index.md", rootDirectory), "/art/");
  assert.equal(resolveContentRoute("/site/content/blog/post/index.md", rootDirectory), "/blog/post/");
});

test("buildPageMetadata creates absolute social URLs and image dimensions", async () => {
  const tempRoot = await makeTempSite();
  const inputPath = path.join(tempRoot, "content", "blog", "post", "index.md");
  const markdown = [
    "---",
    "title: Example Post",
    "date: 2026-05-21",
    "description: Custom preview description.",
    "social-image: /assets/social/card.gif",
    "social-image-alt: Example social card.",
    "---",
    "",
    "# Example Post",
  ].join("\n");

  const metadata = buildPageMetadata(inputPath, markdown, {
    rootDirectory: tempRoot,
    siteUrl: "https://example.com/",
  });

  assert.equal(metadata["canonical-url"], "https://example.com/blog/post/");
  assert.equal(metadata["og-type"], "article");
  assert.equal(metadata["article-published-time"], "2026-05-21");
  assert.equal(metadata["social-title"], "Example Post | hunter paulson");
  assert.equal(metadata["social-description"], "Custom preview description.");
  assert.equal(metadata["social-image-url"], "https://example.com/assets/social/card.gif");
  assert.equal(metadata["social-image-type"], "image/gif");
  assert.equal(metadata["social-image-width"], 1200);
  assert.equal(metadata["social-image-height"], 630);
  assert.equal(metadata["twitter-card"], "summary_large_image");

  await fs.rm(tempRoot, { recursive: true, force: true });
});

test("buildPageMetadata strips markdown from social metadata", async () => {
  const tempRoot = await makeTempSite();
  const inputPath = path.join(tempRoot, "content", "blog", "post", "index.md");
  const markdown = [
    "---",
    "title: LLM API providers are charging you _twice_ for output tokens",
    "date: 2026-07-04",
    "description: once during `generation` and then again during cache write",
    "social-image: /assets/social/card.gif",
    "social-image-alt: Diagram of **cache writes**.",
    "---",
    "",
    "# LLM API providers are charging you _twice_ for output tokens",
  ].join("\n");

  const metadata = buildPageMetadata(inputPath, markdown, {
    rootDirectory: tempRoot,
    siteUrl: "https://example.com/",
  });

  assert.equal(
    metadata["social-title"],
    "LLM API providers are charging you twice for output tokens | hunter paulson",
  );
  assert.equal(
    metadata["social-description"],
    "once during generation and then again during cache write",
  );
  assert.equal(metadata["social-image-alt"], "Diagram of cache writes.");

  await fs.rm(tempRoot, { recursive: true, force: true });
});

test("markdownToPlainText handles common inline markdown", () => {
  assert.equal(
    markdownToPlainText("see [prompt _caching_](https://example.com) and `usage`"),
    "see prompt caching and usage",
  );
});

test("injectPageMetadata preserves frontmatter and adds derived fields", () => {
  const prepared = injectPageMetadata([
    "---",
    "title: Example",
    "---",
    "",
    "body",
  ].join("\n"), {
    "canonical-url": "https://example.com/example/",
    "description": "Example description.",
  });
  const parsed = parseFrontMatter(prepared);

  assert.equal(parsed.data.title, "Example");
  assert.equal(parsed.data["canonical-url"], "https://example.com/example/");
  assert.equal(parsed.data.description, "Example description.");
  assert.match(prepared, /^---\ntitle: Example\ncanonical-url: "https:\/\/example\.com\/example\/"\ndescription: "Example description\."\n---/);
});

test("prepareMarkdownPage expands includes before adding social metadata", async () => {
  const tempRoot = await makeTempSite();
  const sourcePath = path.join(tempRoot, "content", "index.md");
  const includePath = path.join(tempRoot, "content", "snippet.html");

  await fs.writeFile(includePath, "<p>included</p>\n");
  await fs.writeFile(sourcePath, [
    "---",
    "title: Home",
    "social-image: /assets/social/card.gif",
    "---",
    "",
    '{{ include "./snippet.html" }}',
  ].join("\n"));

  const prepared = await prepareMarkdownPage(sourcePath, {
    rootDirectory: tempRoot,
    siteUrl: "https://example.com",
  });
  const parsed = parseFrontMatter(prepared);

  assert.equal(parsed.data["canonical-url"], "https://example.com/");
  assert.equal(parsed.data["social-title"], "hunter paulson | Home");
  assert.equal(parsed.data["social-image-width"], "1200");
  assert.match(prepared, /<p>included<\/p>/);

  await fs.rm(tempRoot, { recursive: true, force: true });
});

test("readImageMetadata returns null for missing images", () => {
  assert.equal(readImageMetadata("/assets/does-not-exist.gif", "/tmp/nope"), null);
});
