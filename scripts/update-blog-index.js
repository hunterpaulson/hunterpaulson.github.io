#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const BLOG_CONTENT_DIR = path.join(ROOT_DIR, "content", "blog");
const BLOG_INDEX_PATH = path.join(BLOG_CONTENT_DIR, "index.md");
const START_MARKER = "<!-- BLOG-POSTS:START -->";
const END_MARKER = "<!-- BLOG-POSTS:END -->";

function parseDateValue(rawDate) {
  if (!rawDate) {
    return { time: 0, display: "" };
  }
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return { time: 0, display: "" };
  }
  const iso = parsed.toISOString().slice(0, 10);
  return { time: parsed.getTime(), display: iso };
}

async function readPosts() {
  const { createContentManifest } = await import("./content-manifest.mjs");
  const pages = createContentManifest(ROOT_DIR);
  const posts = pages
    .filter((page) => {
      const parts = page.relativeSourcePath.split("/");
      return parts.length === 3
        && parts[0] === "blog"
        && parts[2] === "index.md"
        && page.status === "published"
        && page.listed;
    })
    .map((page) => {
      const slug = page.relativeSourcePath.split("/")[1];
      const { time, display } = parseDateValue(page.frontMatter.date);

      return {
        dateDisplay: display || "????-??-??",
        slug,
        time,
        title: page.title,
      };
    });

  return posts.sort((a, b) => {
    if (a.time !== b.time) {
      return b.time - a.time;
    }
    return a.slug.localeCompare(b.slug);
  });
}

function injectListing(indexContent, listingLines) {
  const startIndex = indexContent.indexOf(START_MARKER);
  if (startIndex === -1) {
    throw new Error(`Unable to find start marker "${START_MARKER}" in blog index.`);
  }

  const endIndex = indexContent.indexOf(END_MARKER, startIndex);
  if (endIndex === -1) {
    throw new Error(`Unable to find end marker "${END_MARKER}" in blog index.`);
  }

  const before = indexContent.slice(0, startIndex + START_MARKER.length);
  const after = indexContent.slice(endIndex);
  const listingBlock = listingLines.length > 0
    ? `\n\n${listingLines.join("\n")}\n\n`
    : "\n\n<!-- No posts available -->\n\n";

  return `${before}${listingBlock}${after}`;
}

async function main() {
  const posts = await readPosts();
  const listingLines = posts.map(
    (post) => `- ${post.dateDisplay} — [${post.title}](/blog/${post.slug}/)`
  );

  const indexContent = fs.readFileSync(BLOG_INDEX_PATH, "utf8");
  const updatedContent = injectListing(indexContent, listingLines);

  if (updatedContent === indexContent) {
    return;
  }

  fs.writeFileSync(BLOG_INDEX_PATH, updatedContent);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
