import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogUrl = new URL("../../assets/blackhole_glyphs.json", import.meta.url);

async function readCatalog() {
  return JSON.parse(await readFile(catalogUrl, "utf8"));
}

test("glyph catalog covers printable ASCII and the complete Braille block", async () => {
  const catalog = await readCatalog();
  const ascii = catalog.glyphs.filter(({ family }) => family === "ascii");
  const braille = catalog.glyphs.filter(({ family }) => family === "braille");

  assert.deepEqual(ascii.map(({ codepoint }) => codepoint),
    Array.from({ length: 95 }, (_, index) => 32 + index));
  assert.deepEqual(braille.map(({ codepoint }) => codepoint),
    Array.from({ length: 256 }, (_, index) => 0x2800 + index));
});

test("every glyph has a finite six-region feature vector", async () => {
  const catalog = await readCatalog();

  assert.equal(catalog.regionColumns, 2);
  assert.equal(catalog.regionRows, 3);
  assert.equal(catalog.glyphs.find(({ codepoint }) => codepoint === 0x2800).coverage, 0);
  assert.ok(catalog.maxCoverage.braille > 0);
  for (const glyph of catalog.glyphs) {
    assert.equal(glyph.regions2x2.length, 4, `U+${glyph.codepoint.toString(16)}`);
    assert.equal(glyph.regions.length, 6, `U+${glyph.codepoint.toString(16)}`);
    assert.ok(glyph.regions.every(Number.isFinite));
    assert.ok(glyph.regions.every((value) => value >= 0));
  }
});

test("measured coverage provides a calibrated scalar ramp", async () => {
  const catalog = await readCatalog();
  const byCodepoint = new Map(catalog.glyphs.map((glyph) => [glyph.codepoint, glyph]));

  assert.equal(byCodepoint.get(32).coverage, 0);
  assert.ok(byCodepoint.get("@".codePointAt(0)).coverage > byCodepoint.get(".".codePointAt(0)).coverage);

  const asciiRamp = catalog.ramps.ascii;
  assert.equal(asciiRamp[0], 32);
  for (let index = 1; index < asciiRamp.length; index += 1) {
    assert.ok(
      byCodepoint.get(asciiRamp[index - 1]).coverage <= byCodepoint.get(asciiRamp[index]).coverage,
      "ASCII ramp must be sorted by measured coverage",
    );
  }
});

test("each sampling lattice has its own measured feature scale", async () => {
  const catalog = await readCatalog();

  assert.equal(catalog.maxFeature.ascii.scalar, catalog.maxCoverage.ascii);
  assert.ok(catalog.maxFeature.ascii.regions2x2 > catalog.maxFeature.ascii.scalar);
  assert.ok(catalog.maxFeature.ascii.regions2x3 > catalog.maxFeature.ascii.regions2x2);
  assert.ok(catalog.maxFeature.braille.regions2x3 > catalog.maxFeature.braille.scalar);
});

test("shape matching calibrates every sub-cell region to the font's capacity", async () => {
  const catalog = await readCatalog();

  for (const family of ["ascii", "braille"]) {
    const glyphs = catalog.glyphs.filter((glyph) => glyph.family === family);
    const expected = {
      regions2x2: Array.from(
        { length: 4 },
        (_, region) => Math.max(...glyphs.map((glyph) => glyph.regions2x2[region])),
      ),
      regions2x3: Array.from(
        { length: 6 },
        (_, region) => Math.max(...glyphs.map((glyph) => glyph.regions[region])),
      ),
    };

    assert.deepEqual(catalog.maxFeatureByRegion[family], expected);
  }

  assert.ok(
    catalog.maxFeatureByRegion.ascii.regions2x3[0]
      < catalog.maxFeatureByRegion.ascii.regions2x3[2],
    "the top third must not inherit the middle third's higher ink capacity",
  );
});
