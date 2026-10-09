import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const scriptPath = path.join(repoRoot, "scripts/pandoc-toc-flag.mjs");

async function tocArgs(frontMatter, ...extraArgs) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pandoc-toc-"));
  const markdownPath = path.join(directory, "page.md");
  await writeFile(markdownPath, `---\n${frontMatter}\n---\n\n# one\n\n## two\n`);

  return spawnSync("bun", [scriptPath, markdownPath, ...extraArgs], {
    encoding: "utf8",
  });
}

test("toc arguments include the page's requested depth", async () => {
  const result = await tocArgs("toc: true\ntoc-depth: 1");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "--toc --toc-depth=1");
});

test("legacy page types can default to a toc while honoring explicit false", async () => {
  const [implicit, disabled] = await Promise.all([
    tocArgs("title: implicit", "--default-toc"),
    tocArgs("toc: false", "--default-toc"),
  ]);

  assert.equal(implicit.status, 0, implicit.stderr);
  assert.equal(implicit.stdout, "--toc");
  assert.equal(disabled.status, 0, disabled.stderr);
  assert.equal(disabled.stdout, "");
});

test("every content-page recipe resolves toc arguments from frontmatter", async () => {
  const makefile = await readFile(path.join(repoRoot, "Makefile"), "utf8");
  const contentRecipes = [
    "$(HTML_HOME)",
    "$(HTML_SECTIONS)",
    "$(HTML_BLOGS)",
    "$(HTML_NESTED_INDEX_PAGES)",
    "$(HTML_SUBPAGES)",
  ];

  for (const target of contentRecipes) {
    const start = makefile.indexOf(`${target}:`);
    assert.notEqual(start, -1, `${target} recipe exists`);
    const nextRecipe = makefile.indexOf("\n# ", start + target.length);
    const recipe = makefile.slice(start, nextRecipe === -1 ? undefined : nextRecipe);
    assert.match(recipe, /bun \$\(PANDOC_TOC_FLAG\)/, `${target} resolves toc frontmatter`);
  }
});
