#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import { createContentManifest } from "./content-manifest.mjs";

const TREE_CELL = "&#x00A0;";
const TREE_BRANCH = `&#x251C;&#x2500;&#x2500;${TREE_CELL}`;
const TREE_LAST_BRANCH = `&#x2514;&#x2500;&#x2500;${TREE_CELL}`;
const TREE_PIPE = `&#x2502;${TREE_CELL.repeat(3)}`;
const TREE_SPACE = TREE_CELL.repeat(4);

function createDirectoryNode(name) {
  return {
    directories: new Map(),
    files: [],
    name,
  };
}

function createContentTree(pages) {
  const root = createDirectoryNode("content");

  for (const page of pages) {
    const parts = page.relativeSourcePath.split("/");
    let directory = root;

    for (const part of parts.slice(0, -1)) {
      if (!directory.directories.has(part)) {
        directory.directories.set(part, createDirectoryNode(part));
      }
      directory = directory.directories.get(part);
    }

    directory.files.push(page);
  }

  return root;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function pageFileName(page) {
  return page.relativeSourcePath.split("/").at(-1);
}

function pageStem(page) {
  return pageFileName(page).slice(0, -3);
}

function renderTreeRow(content, prefix, level, className) {
  return [
    `<div class="content-tree__row ${className}" role="treeitem" aria-level="${level}">`,
    `<span class="content-tree__branches" aria-hidden="true">${prefix}</span>`,
    content,
    "</div>",
  ].join("");
}

function renderFile(page, prefix, level) {
  const link = `<a href="${escapeHtml(page.route)}">${escapeHtml(pageStem(page))}</a>`;
  return renderTreeRow(link, prefix, level, "content-tree__file");
}

function sortedDirectoryEntries(directory) {
  const files = directory.files
    .filter((page) => pageFileName(page) !== "index.md")
    .map((page) => ({ name: pageFileName(page), page, type: "file" }));
  const directories = Array.from(directory.directories.values())
    .map((child) => ({ child, name: child.name, type: "directory" }));

  return [...files, ...directories].sort((left, right) => left.name.localeCompare(right.name));
}

function branchPrefix(parentBranches, isLast) {
  const ancestors = parentBranches
    .map((ancestorIsLast) => (ancestorIsLast ? TREE_SPACE : TREE_PIPE))
    .join("");
  return `${ancestors}${isLast ? TREE_LAST_BRANCH : TREE_BRANCH}`;
}

function renderDirectory(directory, options = {}) {
  const {
    isRoot = false,
    level = 1,
    parentBranches = [],
    prefix = "",
  } = options;
  const indexPage = directory.files.find((page) => pageFileName(page) === "index.md");
  const directoryLabel = `${escapeHtml(directory.name)}/`;
  const label = indexPage
    ? `<a class="content-tree__directory-name" href="${escapeHtml(indexPage.route)}">${directoryLabel}</a>`
    : `<span class="content-tree__directory-name">${directoryLabel}</span>`;
  const entries = sortedDirectoryEntries(directory);
  const row = renderTreeRow(label, prefix, level, "content-tree__directory");
  const children = entries.map((entry, index) => {
    const isLast = index === entries.length - 1;
    const childPrefix = branchPrefix(parentBranches, isLast);
    if (entry.type === "file") {
      return renderFile(entry.page, childPrefix, level + 1);
    }

    return renderDirectory(entry.child, {
      level: level + 1,
      parentBranches: [...parentBranches, isLast],
      prefix: childPrefix,
    });
  });

  if (isRoot) {
    return [
      '<div class="content-tree" role="tree">',
      row,
      children.join(""),
      "</div>",
    ].join("");
  }

  return `${row}${children.join("")}`;
}

function renderStatusSection(status, pages) {
  return [
    `## ${status.toUpperCase()}`,
    "",
    renderDirectory(createContentTree(pages), { isRoot: true }),
    "",
  ];
}

export function renderContentIndex(manifest) {
  const drafts = manifest.filter((page) => page.status === "draft");
  const published = manifest.filter((page) => page.status === "published");

  return [
    "---",
    "title: content",
    "noindex: true",
    "content-index: true",
    "---",
    "",
    "# content",
    "",
    ...renderStatusSection("draft", drafts),
    ...renderStatusSection("published", published),
  ].join("\n");
}

async function main() {
  const outputPath = process.argv[2];
  if (!outputPath) {
    throw new Error("Usage: bun scripts/generate-content-index.mjs output.md");
  }

  const markdown = renderContentIndex(createContentManifest());
  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await fs.writeFile(outputPath, markdown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
