import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { packGlyphs } from "../../assets/blackhole_gpu.js";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const catalog = JSON.parse(await readFile(
  new URL("../../assets/blackhole_glyphs.json", import.meta.url),
  "utf8",
));
const fixtures = JSON.parse(await readFile(
  new URL("../fixtures/blackhole_glyph_vectors.json", import.meta.url),
  "utf8",
));

test("golden font features reach the GPU buffer unchanged", () => {
  const packed = packGlyphs(catalog.glyphs);
  const view = new DataView(packed);

  for (const fixture of fixtures) {
    const glyphIndex = catalog.glyphs.findIndex(({ codepoint }) => codepoint === fixture.codepoint);
    assert.notEqual(glyphIndex, -1, fixture.name);
    const glyph = catalog.glyphs[glyphIndex];
    assert.deepEqual(
      {
        codepoint: glyph.codepoint,
        coverage: glyph.coverage,
        regions2x2: glyph.regions2x2,
        regions: glyph.regions,
      },
      {
        codepoint: fixture.codepoint,
        coverage: fixture.coverage,
        regions2x2: fixture.regions2x2,
        regions: fixture.regions,
      },
      fixture.name,
    );

    const offset = glyphIndex * 48;
    for (let region = 0; region < 6; region += 1) {
      assert.ok(
        Math.abs(view.getFloat32(offset + region * 4, true) - fixture.regions[region]) < 1e-6,
        `${fixture.name} six-region feature ${region}`,
      );
    }
    for (let region = 0; region < 4; region += 1) {
      assert.ok(
        Math.abs(view.getFloat32(offset + 24 + region * 4, true) - fixture.regions2x2[region]) < 1e-6,
        `${fixture.name} four-region feature ${region}`,
      );
    }
    assert.ok(
      Math.abs(view.getFloat32(offset + 40, true) - fixture.coverage) < 1e-6,
      `${fixture.name} scalar coverage`,
    );
    assert.equal(view.getUint32(offset + 44, true), fixture.codepoint, fixture.name);
  }
});

test("golden six-region vectors select the same native glyphs", async () => {
  const cases = fixtures.filter(({ codepoint }) => codepoint !== 32);
  const rows = cases.map((fixture) => {
    const values = fixture.regions
      .map((value) => `${Number.isInteger(value) ? value.toFixed(1) : value}f`)
      .join(", ");
    const glyphSet = fixture.codepoint >= 0x2800
      ? "BH_GLYPH_SET_ASCII_BRAILLE"
      : "BH_GLYPH_SET_ASCII";
    return `  printf("%u\\n", bh_match_glyph((float[6]){${values}}, ${glyphSet}));`;
  });
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "blackhole-golden-"));
  const harnessPath = path.join(tempDirectory, "harness.c");
  const executablePath = path.join(tempDirectory, "harness");
  await writeFile(harnessPath, `
#include <stdio.h>
#include "blackhole_core.h"

int main(void) {
${rows.join("\n")}
  return 0;
}
`);

  try {
    const compile = spawnSync("cc", [
      "-std=c11", "-O2", "-I", repoRoot,
      harnessPath,
      path.join(repoRoot, "blackhole_core.c"),
      "-lm", "-o", executablePath,
    ], { encoding: "utf8" });
    assert.equal(compile.status, 0, compile.stderr);

    const run = spawnSync(executablePath, [], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(
      run.stdout.trim().split("\n").map(Number),
      cases.map(({ codepoint }) => codepoint),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
