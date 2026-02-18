#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT_DIR, "content");
const BLOG_CONTENT_DIR = path.join(CONTENT_DIR, "blog");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SITEMAP_PATH = path.join(DIST_DIR, "sitemap.xml");
const ROBOTS_PATH = path.join(DIST_DIR, "robots.txt");
const ROBOT_FRAME_PATH = path.join(ROOT_DIR, "assets", "blackhole_frame_robot.txt");
const SITE_URL = (process.env.SITE_URL || "https://hunterpaulson.dev").replace(/\/+$/, "");

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

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readPageFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return parseFrontMatter(content);
}

function shouldIncludeInSitemap(filePath) {
  const frontMatter = readPageFrontMatter(filePath);
  return !parseBooleanValue(frontMatter.noindex, false);
}

function listContentTopLevelPages() {
  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(CONTENT_DIR, entry.name);
    const slug = entry.name.slice(0, -3);
    const relativeUrl = slug === "index" ? "/" : `/${slug}.html`;
    pages.push({ filePath, relativeUrl });
  }

  return pages;
}

function listSectionIndexPages() {
  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const filePath = path.join(CONTENT_DIR, entry.name, "index.md");
    if (!fs.existsSync(filePath)) {
      continue;
    }

    pages.push({
      filePath,
      relativeUrl: `/${entry.name}/`,
    });
  }

  return pages;
}

function listBlogPostPages() {
  if (!fs.existsSync(BLOG_CONTENT_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(BLOG_CONTENT_DIR, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const filePath = path.join(BLOG_CONTENT_DIR, entry.name, "index.md");
    if (!fs.existsSync(filePath)) {
      continue;
    }

    pages.push({
      filePath,
      relativeUrl: `/blog/${entry.name}/`,
    });
  }

  return pages;
}

function collectPages() {
  const allPages = [
    ...listContentTopLevelPages(),
    ...listSectionIndexPages(),
    ...listBlogPostPages(),
  ];

  const byUrl = new Map();
  for (const page of allPages) {
    byUrl.set(page.relativeUrl, page);
  }

  return Array.from(byUrl.values())
    .filter((page) => shouldIncludeInSitemap(page.filePath))
    .sort((a, b) => a.relativeUrl.localeCompare(b.relativeUrl));
}

function buildSitemapXml(pages) {
  const urlLines = [];

  for (const page of pages) {
    const absoluteUrl = `${SITE_URL}${page.relativeUrl}`;
    const lastmod = fs.statSync(page.filePath).mtime.toISOString();

    urlLines.push("  <url>");
    urlLines.push(`    <loc>${escapeXml(absoluteUrl)}</loc>`);
    urlLines.push(`    <lastmod>${lastmod}</lastmod>`);
    urlLines.push("  </url>");
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlLines,
    "</urlset>",
    "",
  ].join("\n");
}

function readRobotFrameCommentLines() {
  if (!fs.existsSync(ROBOT_FRAME_PATH)) {
    return [];
  }

  const frameContent = fs.readFileSync(ROBOT_FRAME_PATH, "utf8");
  const frameLines = frameContent.replace(/\r\n/g, "\n").split("\n");

  while (frameLines.length > 0 && frameLines[frameLines.length - 1] === "") {
    frameLines.pop();
  }

  return frameLines.map((line) => `# ${line}`);
}

function buildRobotsTxt() {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "",
  ];

  const robotFrameCommentLines = readRobotFrameCommentLines();
  if (robotFrameCommentLines.length > 0) {
    lines.push(...robotFrameCommentLines);
    lines.push("");
  }

  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`);
  lines.push("");

  return lines.join("\n");
}

function writeSitemapFiles() {
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const pages = collectPages();
  fs.writeFileSync(SITEMAP_PATH, buildSitemapXml(pages));
  fs.writeFileSync(ROBOTS_PATH, buildRobotsTxt());
}

function main() {
  writeSitemapFiles();
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
