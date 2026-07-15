#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.resolve(ROOT_DIR, process.env.DIST_DIR || "dist");
const SITEMAP_PATH = path.join(DIST_DIR, "sitemap.xml");
const ROBOTS_PATH = path.join(DIST_DIR, "robots.txt");
const ROBOT_FRAME_PATH = path.join(ROOT_DIR, "assets", "blackhole_frame_robot.txt");
const SITE_URL = (process.env.SITE_URL || "https://hunterpaulson.dev").replace(/\/+$/, "");

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function collectPages() {
  const { contentPagesForMode, createContentManifest } = await import("./content-manifest.mjs");
  const mode = process.env.SITE_MODE || "production";

  return contentPagesForMode(createContentManifest(ROOT_DIR), mode)
    .filter((page) => !page.noindex)
    .sort((left, right) => left.route.localeCompare(right.route));
}

function buildSitemapXml(pages) {
  const urlLines = [];

  for (const page of pages) {
    const absoluteUrl = `${SITE_URL}${page.route}`;
    const lastmod = fs.statSync(page.absoluteSourcePath).mtime.toISOString();

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

async function writeSitemapFiles() {
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const pages = await collectPages();
  fs.writeFileSync(SITEMAP_PATH, buildSitemapXml(pages));
  fs.writeFileSync(ROBOTS_PATH, buildRobotsTxt());
}

async function main() {
  await writeSitemapFiles();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
