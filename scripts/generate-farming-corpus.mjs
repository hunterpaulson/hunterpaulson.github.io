import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_FILES = [
  "blackhole.c",
  "blackhole_core.c",
  "blackhole_core.h",
  "blackhole_wasm.c",
  "assets/blackhole_gpu.js",
  "assets/blackhole_gpu.wgsl",
];

const OUTPUT_PATH = "assets/farming_corpus.txt";

function formatGlobalLineId(lineNumber) {
  return String(((lineNumber - 1) % 9999) + 1).padStart(4, " ");
}

function normalizeSourceLine(lineText) {
  return lineText.replace(/\r/g, "").replace(/\t/g, "  ");
}

function isCommentOrWhitespaceOnlyLine(sourceLine, parserState) {
  let trimmedCursor = sourceLine.trimStart();

  if (trimmedCursor.length === 0) {
    return true;
  }

  if (parserState.inBlockComment) {
    const blockCloseIndex = trimmedCursor.indexOf("*/");
    if (blockCloseIndex === -1) {
      return true;
    }
    parserState.inBlockComment = false;
    trimmedCursor = trimmedCursor.slice(blockCloseIndex + 2).trimStart();
    if (trimmedCursor.length === 0) {
      return true;
    }
  }

  while (trimmedCursor.startsWith("/*")) {
    const blockCloseIndex = trimmedCursor.indexOf("*/", 2);
    if (blockCloseIndex === -1) {
      parserState.inBlockComment = true;
      return true;
    }
    trimmedCursor = trimmedCursor.slice(blockCloseIndex + 2).trimStart();
    if (trimmedCursor.length === 0) {
      return true;
    }
  }

  if (trimmedCursor.startsWith("//")) {
    return true;
  }

  if (/^\*(?:\s|$)/.test(trimmedCursor) || trimmedCursor.startsWith("*/")) {
    return true;
  }

  return false;
}

async function buildCorpus(repoRoot) {
  const outputLines = [];
  let globalLineNumber = 1;

  for (const relativePath of SOURCE_FILES) {
    const parserState = {
      inBlockComment: false,
    };
    const absolutePath = path.join(repoRoot, relativePath);
    const fileContent = await readFile(absolutePath, "utf8");
    const sourceLines = fileContent.replace(/\r/g, "").split("\n");

    for (let sourceIndex = 0; sourceIndex < sourceLines.length; sourceIndex += 1) {
      const sourcePayload = normalizeSourceLine(sourceLines[sourceIndex]);
      if (isCommentOrWhitespaceOnlyLine(sourcePayload, parserState)) {
        continue;
      }
      const lineId = formatGlobalLineId(globalLineNumber);
      outputLines.push(`${lineId}|${sourcePayload}`);
      globalLineNumber += 1;
    }
  }

  return `${outputLines.join("\n")}\n`;
}

async function main() {
  const repoRoot = path.resolve(process.cwd());
  const outputAbsolutePath = path.join(repoRoot, OUTPUT_PATH);
  const outputDirectory = path.dirname(outputAbsolutePath);

  const corpusText = await buildCorpus(repoRoot);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputAbsolutePath, corpusText, "utf8");
}

await main();
