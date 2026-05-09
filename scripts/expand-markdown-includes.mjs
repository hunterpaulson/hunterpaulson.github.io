#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const INCLUDE_PATTERN = /^\{\{\s*include\s+"([^"]+)"\s*\}\}\s*$/gm;
const ROOT_DIRECTORY = process.cwd();

function resolveIncludePath(includePath, currentDirectory) {
  if (includePath.startsWith(".")) {
    return path.resolve(currentDirectory, includePath);
  }
  return path.resolve(ROOT_DIRECTORY, includePath);
}

export async function expandMarkdownIncludes(inputPath, seenPaths = []) {
  const absoluteInputPath = path.resolve(inputPath);
  if (seenPaths.includes(absoluteInputPath)) {
    const cycle = [...seenPaths, absoluteInputPath].join(" -> ");
    throw new Error(`include cycle detected: ${cycle}`);
  }

  const currentDirectory = path.dirname(absoluteInputPath);
  const markdown = await fs.readFile(absoluteInputPath, "utf8");
  const nextSeenPaths = [...seenPaths, absoluteInputPath];
  const replacements = [];

  for (const match of markdown.matchAll(INCLUDE_PATTERN)) {
    const includePath = resolveIncludePath(match[1], currentDirectory);
    replacements.push({
      includePath,
      matchText: match[0],
      replacement: await expandMarkdownIncludes(includePath, nextSeenPaths),
    });
  }

  return replacements.reduce((expanded, replacement) => {
    return expanded.replace(replacement.matchText, replacement.replacement.trimEnd());
  }, markdown);
}

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error("Usage: bun scripts/expand-markdown-includes.mjs input.md output.md");
    process.exitCode = 1;
    return;
  }

  const expanded = await expandMarkdownIncludes(inputPath);
  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await fs.writeFile(outputPath, expanded);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
