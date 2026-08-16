import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

import { resolveBrowserExecutable } from "../media/browser.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FONT_PATH = path.join(REPO_ROOT, "assets/fonts/JetBrainsMonoMedium.woff");
const BRAILLE_FONT_PATH = path.join(REPO_ROOT, "assets/fonts/BlackholeBraille.woff2");
const JSON_PATH = path.join(REPO_ROOT, "assets/blackhole_glyphs.json");
const HEADER_PATH = path.join(REPO_ROOT, "generated/blackhole_glyphs.h");
const CONTOUR_ASCII_CODEPOINTS = [
  ..." `,-:'_;~/\\^\"<>!=()?{}|[]#%$&@",
].map((character) => character.codePointAt(0));

function codepointRange(first, count, family) {
  return Array.from({ length: count }, (_, index) => ({
    codepoint: first + index,
    family,
  }));
}

function roundFeature(value) {
  return Number(value.toFixed(7));
}

function makeHeader(catalog) {
  const rows = catalog.glyphs.map((glyph) => {
    const regions2x2 = glyph.regions2x2.map((value) => `${value.toFixed(7)}f`).join(", ");
    const regions = glyph.regions.map((value) => `${value.toFixed(7)}f`).join(", ");
    return `  {${glyph.codepoint}u, ${glyph.coverage.toFixed(7)}f, {${regions2x2}}, {${regions}}},`;
  });

  return `#ifndef BLACKHOLE_GLYPHS_H
#define BLACKHOLE_GLYPHS_H

#include <stdint.h>

#define BH_GLYPH_REGION_COUNT 6u
#define BH_ASCII_GLYPH_OFFSET 0u
#define BH_ASCII_GLYPH_COUNT 95u
#define BH_BRAILLE_GLYPH_OFFSET 95u
#define BH_BRAILLE_GLYPH_COUNT 256u
#define BH_GLYPH_COUNT 351u
#define BH_CONTOUR_ASCII_GLYPH_COUNT ${catalog.sets.contourAscii.length}u
#define BH_ASCII_MAX_COVERAGE ${catalog.maxCoverage.ascii.toFixed(7)}f
#define BH_BRAILLE_MAX_COVERAGE ${catalog.maxCoverage.braille.toFixed(7)}f
#define BH_ASCII_BRAILLE_MAX_COVERAGE ${catalog.maxCoverage.asciiBraille.toFixed(7)}f
#define BH_ASCII_MAX_FEATURE_2X2 ${catalog.maxFeature.ascii.regions2x2.toFixed(7)}f
#define BH_BRAILLE_MAX_FEATURE_2X2 ${catalog.maxFeature.braille.regions2x2.toFixed(7)}f
#define BH_ASCII_BRAILLE_MAX_FEATURE_2X2 ${catalog.maxFeature.asciiBraille.regions2x2.toFixed(7)}f
#define BH_ASCII_MAX_FEATURE_2X3 ${catalog.maxFeature.ascii.regions2x3.toFixed(7)}f
#define BH_BRAILLE_MAX_FEATURE_2X3 ${catalog.maxFeature.braille.regions2x3.toFixed(7)}f
#define BH_ASCII_BRAILLE_MAX_FEATURE_2X3 ${catalog.maxFeature.asciiBraille.regions2x3.toFixed(7)}f

static const float BH_ASCII_MAX_FEATURE_2X2_BY_REGION[4] = {
  ${catalog.maxFeatureByRegion.ascii.regions2x2.map((value) => `${value.toFixed(7)}f`).join(", ")}
};
static const float BH_BRAILLE_MAX_FEATURE_2X2_BY_REGION[4] = {
  ${catalog.maxFeatureByRegion.braille.regions2x2.map((value) => `${value.toFixed(7)}f`).join(", ")}
};
static const float BH_ASCII_BRAILLE_MAX_FEATURE_2X2_BY_REGION[4] = {
  ${catalog.maxFeatureByRegion.asciiBraille.regions2x2.map((value) => `${value.toFixed(7)}f`).join(", ")}
};
static const float BH_ASCII_MAX_FEATURE_2X3_BY_REGION[6] = {
  ${catalog.maxFeatureByRegion.ascii.regions2x3.map((value) => `${value.toFixed(7)}f`).join(", ")}
};
static const float BH_BRAILLE_MAX_FEATURE_2X3_BY_REGION[6] = {
  ${catalog.maxFeatureByRegion.braille.regions2x3.map((value) => `${value.toFixed(7)}f`).join(", ")}
};
static const float BH_ASCII_BRAILLE_MAX_FEATURE_2X3_BY_REGION[6] = {
  ${catalog.maxFeatureByRegion.asciiBraille.regions2x3.map((value) => `${value.toFixed(7)}f`).join(", ")}
};

typedef struct {
  uint32_t codepoint;
  float coverage;
  float regions2x2[4];
  float regions[BH_GLYPH_REGION_COUNT];
} BHGlyph;

static const uint32_t
    BH_CONTOUR_ASCII_CODEPOINTS[BH_CONTOUR_ASCII_GLYPH_COUNT] = {
  ${catalog.sets.contourAscii.map((codepoint) => `${codepoint}u`).join(", ")}
};

static const BHGlyph BH_GLYPHS[BH_GLYPH_COUNT] = {
${rows.join("\n")}
};

#endif
`;
}

async function loadLocalFontDataUrl(filePath, mimeType) {
  const bytes = await readFile(filePath);
  return {
    dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function measureGlyphs(page, fontDataUrl, brailleFontDataUrl, requestedGlyphs) {
  return page.evaluate(async ({ fontDataUrl, brailleFontDataUrl, requestedGlyphs }) => {
    const face = new FontFace("Blackhole JetBrains Mono", `url(${fontDataUrl})`, {
      style: "normal",
      weight: "500",
    });
    await face.load();
    document.fonts.add(face);
    const brailleFace = new FontFace("Blackhole Braille", `url(${brailleFontDataUrl})`, {
      style: "normal",
      weight: "400",
    });
    await brailleFace.load();
    document.fonts.add(brailleFace);

    const fontSize = 160;
    const lineHeight = 192;
    const font = `500 ${fontSize}px "Blackhole JetBrains Mono", "Blackhole Braille", monospace`;
    const sizingCanvas = document.createElement("canvas");
    const sizingContext = sizingCanvas.getContext("2d");
    sizingContext.font = font;
    const sizing = sizingContext.measureText("M");
    const cellWidth = Math.round(sizing.width);
    const cellHeight = lineHeight;
    const ascent = sizing.fontBoundingBoxAscent || sizing.actualBoundingBoxAscent;
    const descent = sizing.fontBoundingBoxDescent || sizing.actualBoundingBoxDescent;
    const baseline = (cellHeight - ascent - descent) / 2 + ascent;

    const canvas = document.createElement("canvas");
    canvas.width = cellWidth;
    canvas.height = cellHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.font = font;
    context.fillStyle = "#fff";
    context.textBaseline = "alphabetic";

    const measured = [];
    for (const requested of requestedGlyphs) {
      const character = String.fromCodePoint(requested.codepoint);
      context.clearRect(0, 0, cellWidth, cellHeight);
      const textWidth = context.measureText(character).width;
      context.fillText(character, (cellWidth - textWidth) / 2, baseline);

      const alpha = context.getImageData(0, 0, cellWidth, cellHeight).data;
      const measureRegions = (columns, rows) => {
        const regions = [];
        for (let regionY = 0; regionY < rows; regionY += 1) {
          const y0 = Math.floor((regionY * cellHeight) / rows);
          const y1 = Math.floor(((regionY + 1) * cellHeight) / rows);
          for (let regionX = 0; regionX < columns; regionX += 1) {
            const x0 = Math.floor((regionX * cellWidth) / columns);
            const x1 = Math.floor(((regionX + 1) * cellWidth) / columns);
            let regionAlpha = 0;
            for (let y = y0; y < y1; y += 1) {
              for (let x = x0; x < x1; x += 1) {
                regionAlpha += alpha[(y * cellWidth + x) * 4 + 3] / 255;
              }
            }
            regions.push(regionAlpha / ((x1 - x0) * (y1 - y0)));
          }
        }
        return regions;
      };
      let totalAlpha = 0;
      for (let y = 0; y < cellHeight; y += 1) {
        for (let x = 0; x < cellWidth; x += 1) {
          totalAlpha += alpha[(y * cellWidth + x) * 4 + 3] / 255;
        }
      }

      measured.push({
        ...requested,
        character,
        coverage: totalAlpha / (cellWidth * cellHeight),
        regions2x2: measureRegions(2, 2),
        regions: measureRegions(2, 3),
      });
    }

    return {
      cellWidth,
      cellHeight,
      fontSize,
      lineHeight,
      measured,
    };
  }, { fontDataUrl, brailleFontDataUrl, requestedGlyphs });
}

async function main() {
  const executablePath = resolveBrowserExecutable();
  if (!executablePath) {
    throw new Error("no Chromium-family browser is available for font measurement");
  }

  const requestedGlyphs = [
    ...codepointRange(32, 95, "ascii"),
    ...codepointRange(0x2800, 256, "braille"),
  ];
  const font = await loadLocalFontDataUrl(FONT_PATH, "font/woff");
  const brailleFont = await loadLocalFontDataUrl(BRAILLE_FONT_PATH, "font/woff2");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });

  let result;
  try {
    const page = await browser.newPage();
    result = await measureGlyphs(page, font.dataUrl, brailleFont.dataUrl, requestedGlyphs);
  } finally {
    await browser.close();
  }

  const glyphs = result.measured.map((glyph) => ({
    ...glyph,
    coverage: roundFeature(glyph.coverage),
    regions2x2: glyph.regions2x2.map(roundFeature),
    regions: glyph.regions.map(roundFeature),
  }));
  const ascii = glyphs.filter(({ family }) => family === "ascii");
  const braille = glyphs.filter(({ family }) => family === "braille");
  const maxCoverage = {
    ascii: Math.max(...ascii.map(({ coverage }) => coverage)),
    braille: Math.max(...braille.map(({ coverage }) => coverage)),
    asciiBraille: Math.max(...glyphs.map(({ coverage }) => coverage)),
  };
  const maxFeatureFor = (familyGlyphs) => ({
    scalar: Math.max(...familyGlyphs.map(({ coverage }) => coverage)),
    regions2x2: Math.max(...familyGlyphs.flatMap(({ regions2x2 }) => regions2x2)),
    regions2x3: Math.max(...familyGlyphs.flatMap(({ regions }) => regions)),
  });
  const maxFeature = {
    ascii: maxFeatureFor(ascii),
    braille: maxFeatureFor(braille),
    asciiBraille: maxFeatureFor(glyphs),
  };
  const maxFeatureByRegionFor = (familyGlyphs) => ({
    regions2x2: Array.from(
      { length: 4 },
      (_, region) => Math.max(...familyGlyphs.map((glyph) => glyph.regions2x2[region])),
    ),
    regions2x3: Array.from(
      { length: 6 },
      (_, region) => Math.max(...familyGlyphs.map((glyph) => glyph.regions[region])),
    ),
  });
  const maxFeatureByRegion = {
    ascii: maxFeatureByRegionFor(ascii),
    braille: maxFeatureByRegionFor(braille),
    asciiBraille: maxFeatureByRegionFor(glyphs),
  };
  const byCoverage = (left, right) => left.coverage - right.coverage || left.codepoint - right.codepoint;
  const catalog = {
    version: 3,
    font: {
      family: "JetBrains Mono",
      weight: 500,
      source: "/assets/fonts/JetBrainsMonoMedium.woff",
      sha256: font.sha256,
      measuredFontSize: result.fontSize,
      measuredLineHeight: result.lineHeight,
      measuredCellWidth: result.cellWidth,
      measuredCellHeight: result.cellHeight,
    },
    brailleFont: {
      family: "Noto Sans Symbols 2",
      weight: 400,
      source: "/assets/fonts/BlackholeBraille.woff2",
      sha256: brailleFont.sha256,
    },
    regionColumns: 2,
    regionRows: 3,
    maxCoverage,
    maxFeature,
    maxFeatureByRegion,
    sets: {
      contourAscii: CONTOUR_ASCII_CODEPOINTS,
    },
    ramps: {
      ascii: [...ascii].sort(byCoverage).map(({ codepoint }) => codepoint),
      asciiBraille: [...glyphs].sort(byCoverage).map(({ codepoint }) => codepoint),
    },
    glyphs,
  };

  await mkdir(path.dirname(HEADER_PATH), { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(HEADER_PATH, makeHeader(catalog));
  console.log(`wrote ${glyphs.length} glyphs to ${path.relative(REPO_ROOT, JSON_PATH)}`);
  console.log(`wrote C table to ${path.relative(REPO_ROOT, HEADER_PATH)}`);
}

await main();
