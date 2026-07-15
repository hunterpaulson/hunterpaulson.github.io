#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  parseBooleanValue,
  parseFrontMatter,
  resolveContentOutputPath,
  resolveContentRoute,
  resolveContentStatus,
} from "./content-page.mjs";

export const CONTENT_MODES = Object.freeze(["development", "production"]);

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function fallbackTitle(relativeSourcePath) {
  const parts = relativeSourcePath.split("/");
  const fileName = parts.at(-1);
  const stem = fileName.slice(0, -3);
  const titleStem = stem === "index" && parts.length > 1 ? parts.at(-2) : stem;
  return titleStem.replaceAll("-", " ");
}

function listMarkdownFiles(directory, contentDirectory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (filePath !== path.join(contentDirectory, "includes")) {
        files.push(...listMarkdownFiles(filePath, contentDirectory));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(filePath);
    }
  }

  return files;
}

export function validateContentMode(mode) {
  if (!CONTENT_MODES.includes(mode)) {
    throw new Error(`invalid content mode "${mode}"; expected ${CONTENT_MODES.join(" or ")}`);
  }

  return mode;
}

export function createContentManifest(rootDirectory = process.cwd()) {
  const contentDirectory = path.join(rootDirectory, "content");
  if (!fs.existsSync(contentDirectory)) {
    throw new Error(`content directory does not exist: ${contentDirectory}`);
  }

  return listMarkdownFiles(contentDirectory, contentDirectory)
    .sort((left, right) => left.localeCompare(right))
    .map((absoluteSourcePath) => {
      const markdown = fs.readFileSync(absoluteSourcePath, "utf8");
      const frontMatter = parseFrontMatter(markdown).data;
      const relativeSourcePath = normalizePath(path.relative(contentDirectory, absoluteSourcePath));
      const sourcePath = `content/${relativeSourcePath}`;

      return {
        absoluteSourcePath,
        frontMatter,
        listed: parseBooleanValue(frontMatter.listed, true),
        noindex: parseBooleanValue(frontMatter.noindex, false),
        outputPath: resolveContentOutputPath(absoluteSourcePath, rootDirectory),
        relativeSourcePath,
        route: resolveContentRoute(absoluteSourcePath, rootDirectory),
        sourcePath,
        status: resolveContentStatus(frontMatter, sourcePath),
        title: frontMatter.title || fallbackTitle(relativeSourcePath),
      };
    });
}

export function contentPagesForMode(manifest, mode = "production") {
  validateContentMode(mode);
  if (mode === "development") {
    return manifest;
  }

  return manifest.filter((page) => page.status === "published");
}

function parseCliArguments(argv) {
  const command = argv[0] || "json";
  let mode = process.env.SITE_MODE || "production";

  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "--mode") {
      mode = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`unknown argument: ${argv[index]}`);
  }

  return { command, mode: validateContentMode(mode) };
}

function main() {
  const { command, mode } = parseCliArguments(process.argv.slice(2));
  const manifest = createContentManifest();
  const pages = contentPagesForMode(manifest, mode);

  if (command === "validate") {
    return;
  }
  if (command === "sources") {
    process.stdout.write(`${pages.map((page) => page.sourcePath).join("\n")}\n`);
    return;
  }
  if (command === "json") {
    process.stdout.write(`${JSON.stringify(pages, null, 2)}\n`);
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
