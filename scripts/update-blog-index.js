#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const BLOG_CONTENT_DIR = path.join(ROOT_DIR, "content", "blog");
const BLOG_INDEX_PATH = path.join(BLOG_CONTENT_DIR, "index.md");
const START_MARKER = "<!-- BLOG-POSTS:START -->";
const END_MARKER = "<!-- BLOG-POSTS:END -->";

function parseFrontMatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return {};
  }

  const data = {};
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === "---") {
      break;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return data;
}

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

function parseBooleanValue(rawValue, fallback) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return fallback;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function readPosts() {
  const entries = fs.readdirSync(BLOG_CONTENT_DIR, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const slug = entry.name;
    const postPath = path.join(BLOG_CONTENT_DIR, slug, "index.md");
    if (!fs.existsSync(postPath)) {
      continue;
    }

    const content = fs.readFileSync(postPath, "utf8");
    const frontMatter = parseFrontMatter(content);

    const title = frontMatter.title || slug;
    const { time, display } = parseDateValue(frontMatter.date);
    const listed = parseBooleanValue(frontMatter.listed, true);

    posts.push({
      slug,
      title,
      time,
      listed,
      dateDisplay: display || "????-??-??",
    });
  }

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

function main() {
  const posts = readPosts().filter((post) => post.listed);
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

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
