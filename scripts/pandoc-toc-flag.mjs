#!/usr/bin/env bun

import fs from "node:fs";
import { parseFrontMatter } from "./page-metadata.mjs";

function parseBooleanValue(rawValue, fallback = false) {
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

function parseTocDepth(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }

  const normalized = String(rawValue).trim();
  if (!/^[1-9][0-9]*$/.test(normalized)) {
    throw new Error(`toc-depth must be a positive integer, received: ${rawValue}`);
  }

  return normalized;
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("usage: pandoc-toc-flag.mjs <markdown-file>");
  process.exit(2);
}

const markdown = fs.readFileSync(inputPath, "utf8");
const frontMatter = parseFrontMatter(markdown).data;

if (parseBooleanValue(frontMatter.toc, false)) {
  const args = ["--toc"];
  const tocDepth = parseTocDepth(frontMatter["toc-depth"]);
  if (tocDepth) {
    args.push(`--toc-depth=${tocDepth}`);
  }
  process.stdout.write(args.join(" "));
}
