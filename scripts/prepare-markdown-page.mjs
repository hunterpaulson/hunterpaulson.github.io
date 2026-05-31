#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import { expandMarkdownIncludes } from "./expand-markdown-includes.mjs";
import { buildPageMetadata, injectPageMetadata } from "./page-metadata.mjs";

export async function prepareMarkdownPage(inputPath, options = {}) {
  const expanded = await expandMarkdownIncludes(inputPath);
  const metadata = buildPageMetadata(inputPath, expanded, options);
  return injectPageMetadata(expanded, metadata);
}

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error("Usage: bun scripts/prepare-markdown-page.mjs input.md output.md");
    process.exitCode = 1;
    return;
  }

  const prepared = await prepareMarkdownPage(inputPath);
  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await fs.writeFile(outputPath, prepared);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
