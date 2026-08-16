import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { packGlyphs, selectGlyphs } from "../../assets/blackhole_gpu.js";

const catalog = JSON.parse(await readFile(
  new URL("../../assets/blackhole_glyphs.json", import.meta.url),
  "utf8",
));

test("GPU glyph buffer uses the generated catalog without duplicating a ramp", () => {
  const ascii = selectGlyphs(catalog, "ascii");
  const all = selectGlyphs(catalog, "ascii-braille");
  const contours = selectGlyphs(catalog, "contour-stars");
  assert.equal(ascii.length, 95);
  assert.equal(all.length, 351);
  assert.equal(selectGlyphs(catalog, "braille-stars").length, 351);
  assert.equal(contours.length, 30 + 256);
  assert.equal(catalog.version, 3);
  assert.deepEqual(
    catalog.sets.contourAscii,
    [..." `,-:'_;~/\\^\"<>!=()?{}|[]#%$&@"].map((character) => character.codePointAt(0)),
  );
  assert.equal(
    contours.filter(({ family }) => family === "ascii")
      .map(({ codepoint }) => String.fromCodePoint(codepoint))
      .join(""),
    " !\"#$%&'(),-/:;<=>?@[\\]^_`{|}~",
  );

  const packed = packGlyphs(ascii);
  const view = new DataView(packed);
  assert.equal(packed.byteLength, 95 * 48);
  assert.equal(view.getUint32(44, true), 32);
  assert.equal(view.getUint32((47 - 32) * 48 + 44, true), 47);
  assert.equal(view.getFloat32((47 - 32) * 48, true), ascii[47 - 32].regions[0]);
});
