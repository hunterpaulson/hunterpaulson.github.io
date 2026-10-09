import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { expandMarkdownIncludes } from "../../scripts/expand-markdown-includes.mjs";

test("expandMarkdownIncludes replaces include markers with file contents", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-includes-test-"));
  const sourcePath = path.join(tempRoot, "source.md");
  const includePath = path.join(tempRoot, "snippet.html");

  await fs.writeFile(includePath, "<div>shared</div>\n");
  await fs.writeFile(sourcePath, [
    "before",
    '{{ include "./snippet.html" }}',
    "after",
  ].join("\n"));

  assert.equal(
    await expandMarkdownIncludes(sourcePath),
    [
      "before",
      "<div>shared</div>",
      "after",
    ].join("\n"),
  );

  await fs.rm(tempRoot, { recursive: true, force: true });
});

test("expandMarkdownIncludes recursively expands nested Markdown partials", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-includes-nested-test-"));
  const sourcePath = path.join(tempRoot, "source.md");
  const partialDirectory = path.join(tempRoot, "partials");
  const wrapperPath = path.join(partialDirectory, "wrapper.md");
  const stepPath = path.join(partialDirectory, "step.md");

  await fs.mkdir(partialDirectory, { recursive: true });
  await fs.writeFile(sourcePath, '{{ include "./partials/wrapper.md" }}\n');
  await fs.writeFile(wrapperPath, '{{ include "./step.md" }}\n');
  await fs.writeFile(stepPath, "## nested step\n\n```json\n{}\n```\n");

  assert.equal(
    await expandMarkdownIncludes(sourcePath),
    "## nested step\n\n```json\n{}\n```",
  );

  await fs.rm(tempRoot, { recursive: true, force: true });
});

test("expandMarkdownIncludes rejects include cycles", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-includes-cycle-test-"));
  const firstPath = path.join(tempRoot, "first.md");
  const secondPath = path.join(tempRoot, "second.md");

  await fs.writeFile(firstPath, '{{ include "./second.md" }}\n');
  await fs.writeFile(secondPath, '{{ include "./first.md" }}\n');

  await assert.rejects(() => expandMarkdownIncludes(firstPath), /include cycle detected/);

  await fs.rm(tempRoot, { recursive: true, force: true });
});
