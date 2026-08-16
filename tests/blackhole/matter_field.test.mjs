import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  MATTER_HEIGHT,
  MATTER_MAX_BRUSH_SIZE,
  MATTER_WIDTH,
  createSpiralMatterField,
  brushSizeFromInput,
  matterCellFromPointer,
  matterFieldToText,
  normalizeBrushSize,
  paintMatterLine,
} from "../../src/art/blackhole_matter.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("the default editable field is a bounded top-down spiral", () => {
  const field = createSpiralMatterField();

  assert.equal(MATTER_WIDTH, 80);
  assert.equal(MATTER_HEIGHT, 40);
  assert.equal(field.length, MATTER_WIDTH * MATTER_HEIGHT);
  assert.ok(field.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));

  const center = Math.floor(MATTER_HEIGHT / 2) * MATTER_WIDTH + Math.floor(MATTER_WIDTH / 2);
  assert.equal(field[center], 0, "the event-horizon/ISCO area should not be drawable matter");
  assert.equal(field[0], 0, "the square editor corners lie outside the disk");

  const occupied = field.filter((value) => value >= 0.20).length;
  assert.ok(
    occupied >= 550 && occupied <= 650,
    `the complete spiral occupied ${occupied} cells`,
  );

  const text = matterFieldToText(field);
  const rows = text.split("\n");
  assert.equal(rows.length, MATTER_HEIGHT);
  assert.ok(rows.every((row) => [...row].length === MATTER_WIDTH));
  assert.match(text, /█/u);
});

test("painting interpolates between pointer samples without leaving holes", () => {
  const width = 12;
  const height = 8;
  const field = new Float32Array(width * height);

  paintMatterLine(field, width, height, { x: 1, y: 1 }, { x: 10, y: 6 });

  for (let x = 1; x <= 10; x += 1) {
    const columnHasMatter = Array.from(
      { length: height },
      (_, y) => field[y * width + x],
    ).some((value) => value === 1);
    assert.equal(columnHasMatter, true, `paint stroke skipped column ${x}`);
  }
});

test("brush size paints a round multi-cell footprint", () => {
  const width = 9;
  const height = 9;
  const field = new Float32Array(width * height);

  paintMatterLine(
    field,
    width,
    height,
    { x: 4, y: 4 },
    { x: 4, y: 4 },
    1,
    5,
  );

  assert.equal(field[4 * width + 4], 1);
  assert.equal(field[4 * width + 2], 1);
  assert.equal(field[2 * width + 4], 1);
  assert.equal(field[2 * width + 2], 0, "the brush footprint should be round, not square");
});

test("brush sizes remain odd single digits", () => {
  assert.equal(MATTER_MAX_BRUSH_SIZE, 9);
  assert.equal(normalizeBrushSize(-1), 1);
  assert.equal(normalizeBrushSize(2), 3);
  assert.equal(normalizeBrushSize(8), 9);
  assert.equal(normalizeBrushSize(10), 9);
  assert.equal(normalizeBrushSize(11), 9);
  assert.equal(
    brushSizeFromInput("", 5),
    5,
    "temporarily empty input preserves the active brush while the user retypes",
  );
  assert.equal(brushSizeFromInput("8", 5), 9);
});

test("captured drawing pointers clamp to the original pad", () => {
  const shared = {
    left: 100,
    top: 200,
    charWidth: 10,
    lineHeight: 20,
    width: 80,
    height: 40,
  };

  assert.deepEqual(
    matterCellFromPointer({ ...shared, clientX: 125, clientY: 245 }),
    { x: 2, y: 2 },
  );
  assert.deepEqual(
    matterCellFromPointer({ ...shared, clientX: -50, clientY: 2000 }),
    { x: 0, y: 39 },
  );
});

test("the drawing pad does not reserve a scrollbar-sized false row", async () => {
  const css = await readFile(
    path.join(repoRoot, "src/styles/components/ascii-animations.css"),
    "utf8",
  );
  const rule = css.match(/\.blackhole-matter-pad\s*{(?<body>[^}]*)}/s)?.groups?.body ?? "";

  assert.match(
    rule,
    /overflow:\s*(?:clip|hidden)/,
    "the 80-cell content must not create a horizontal scrollbar below row 40",
  );
  assert.doesNotMatch(
    rule,
    /overscroll-behavior:\s*contain/,
    "wheel scrolling over the drawing pad must continue scrolling the page",
  );
});

test("the compact brush input retains its native increment controls", async () => {
  const css = await readFile(
    path.join(repoRoot, "src/styles/components/ascii-animations.css"),
    "utf8",
  );
  const rule = css.match(
    /\.blackhole-brush-size input\s*{(?<body>[^}]*)}/s,
  )?.groups?.body ?? "";

  assert.doesNotMatch(rule, /appearance:\s*textfield/);
  assert.doesNotMatch(
    css,
    /\.blackhole-brush-size input::-(?:webkit-inner|webkit-outer)-spin-button/,
  );
});

test("simulation buttons stay on the monospace grid while pressed", async () => {
  const css = await readFile(
    path.join(repoRoot, "src/styles/components/ascii-animations.css"),
    "utf8",
  );
  const playRule = css.match(
    /\.blackhole-play-toggle\s*{(?<body>[^}]*)}/s,
  )?.groups?.body ?? "";
  const activeRule = css.match(
    /\.blackhole-sim-controls button:active\s*{(?<body>[^}]*)}/s,
  )?.groups?.body ?? "";
  const shortcutKeyRule = css.match(
    /\.blackhole-shortcut-key\s*{(?<body>[^}]*)}/s,
  )?.groups?.body ?? "";

  assert.match(
    playRule,
    /text-align:\s*left/,
    "PLAY and PAUSE must begin on the same character-cell edge",
  );
  assert.match(
    activeRule,
    /transform:\s*none/,
    "the button box must remain on the character grid",
  );
  assert.doesNotMatch(
    css,
    /\.blackhole-sim-controls button:active \.blackhole-button-label/,
    "pressed controls must not move their button or inner label",
  );
  assert.match(
    shortcutKeyRule,
    /text-decoration(?:-line)?:\s*underline/,
    "single-key shortcuts should be visible in their control labels",
  );
});

test("native matter sampling advects a drawn field at radius-dependent speed", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "blackhole-matter-"));
  const harnessPath = path.join(tempDirectory, "harness.c");
  const executablePath = path.join(tempDirectory, "harness");
  await writeFile(harnessPath, `
#include <math.h>
#include <stdio.h>
#include "blackhole_core.h"

int main(void) {
  float field[80 * 40];
  for (int y = 0; y < 40; y++) {
    for (int x = 0; x < 80; x++) {
      field[y * 80 + x] = (float)x / 79.0f;
    }
  }

  BHSceneParams params;
  bh_init_scene_params(&params);
  params.matter_field = field;
  params.matter_width = 80;
  params.matter_height = 40;

  const double radius = 18.0;
  const double phi = 0.37;
  const double phase = 0.61;
  const double speed = fmin(1.6, pow(12.0 / radius, 1.5));
  const double moving = bh_matter_density(&params, radius, phi, phase);
  const double transported = bh_matter_density(
      &params, radius, phi + phase * speed, 0.0);
  const double opposite = bh_matter_density(&params, radius, phi + 3.141592653589793, phase);
  const double projected_top = bh_matter_density(
      &params, radius, 1.5707963267948966, 0.0);
  const double projected_right = bh_matter_density(&params, radius, 0.0, 0.0);

  for (int index = 0; index < 80 * 40; index++) {
    field[index] = 1.0f;
  }
  const double filled_inner_axis = bh_matter_density(
      &params, 32.0, 1.5707963267948966, 0.0);
  const double filled_outer_axis = bh_matter_density(
      &params, 45.0, 1.5707963267948966, 0.0);
  const double filled_outer_diagonal = bh_matter_density(
      &params, 45.0, 2.356194490192345, 0.0);
  const double filled_speed = pow(12.0 / 45.0, 1.5);
  const double filled_rotated_outer_axis = bh_matter_density(
      &params, 45.0, 1.5707963267948966,
      0.7853981633974483 / filled_speed);

  float seeded[80 * 40];
  bh_seed_spiral_matter(seeded, 80, 40);
  double seed_sum = 0.0;
  double weighted_seed_sum = 0.0;
  for (int index = 0; index < 80 * 40; index++) {
    seed_sum += seeded[index];
    weighted_seed_sum += seeded[index] * (index + 1);
  }

  double seed_fallback_error = 0.0;
  for (int sample = 0; sample < 32; sample++) {
    const double sample_phi = 6.283185307179586 * sample / 32.0;
    params.matter_field = seeded;
    const double sampled_seed = bh_matter_density(
        &params, 18.0, sample_phi, 0.0);
    params.matter_field = NULL;
    const double analytic_seed = bh_matter_density(
        &params, 18.0, sample_phi, 0.0);
    seed_fallback_error = fmax(
        seed_fallback_error, fabs(sampled_seed - analytic_seed));
  }

  printf("%.12f %.12f %.12f %.12f %.12f %.12f %.12f %.12f %.12f %.12f %.12f %.12f\\n",
         moving, transported, opposite, projected_top, projected_right,
         filled_inner_axis, filled_outer_axis, filled_outer_diagonal,
         filled_rotated_outer_axis,
         seed_sum, weighted_seed_sum, seed_fallback_error);
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
    const [
      moving,
      transported,
      opposite,
      projectedTop,
      projectedRight,
      filledInnerAxis,
      filledOuterAxis,
      filledOuterDiagonal,
      filledRotatedOuterAxis,
      seedSum,
      weightedSeedSum,
      seedFallbackError,
    ] = run.stdout.trim().split(" ").map(Number);
    assert.ok(Math.abs(moving - transported) < 1e-9);
    assert.ok(Math.abs(moving - opposite) > 0.2);
    assert.ok(
      projectedTop > projectedRight + 0.2,
      "a right-side editor mark should project counterclockwise to the top of the disk",
    );
    assert.equal(filledInnerAxis, 1, "the original spiral radius fits inside the editor");
    assert.equal(filledOuterAxis, 0, "the disk outside the inscribed editor square stays empty");
    assert.equal(filledOuterDiagonal, 1, "the square corners reach the larger disk support");
    assert.equal(
      filledRotatedOuterAxis,
      1,
      "a filled square visibly rotates into its empty outer axes",
    );
    assert.ok(
      seedFallbackError < 0.15,
      `the analytic fallback diverged from the editable seed by ${seedFallbackError}`,
    );

    const jsSeed = createSpiralMatterField();
    const jsSeedSum = jsSeed.reduce((sum, value) => sum + value, 0);
    const jsWeightedSeedSum = jsSeed.reduce(
      (sum, value, index) => sum + value * (index + 1),
      0,
    );
    assert.ok(Math.abs(seedSum - jsSeedSum) < 1e-4);
    assert.ok(Math.abs(weightedSeedSum - jsWeightedSeedSum) < 0.1);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
