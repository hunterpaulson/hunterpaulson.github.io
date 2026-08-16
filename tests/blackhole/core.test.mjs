import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("native core keeps logical projection separate from the 2x3 sample grid", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "blackhole-core-"));
  const harnessPath = path.join(tempDirectory, "harness.c");
  const executablePath = path.join(tempDirectory, "harness");
  await writeFile(harnessPath, `
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include "blackhole_core.h"
#include "generated/blackhole_glyphs.h"

int main(void) {
  BHSceneParams params;
  bh_init_scene_params(&params);
  params.width = 80;
  params.height = 40;
  params.sample_columns = 2;
  params.sample_rows = 3;
  bh_update_derived(&params);

  float slash[BH_GLYPH_REGION_COUNT];
  float letter_a[BH_GLYPH_REGION_COUNT];
  for (unsigned int i = 0; i < BH_GLYPH_REGION_COUNT; i++) {
    slash[i] = BH_GLYPHS['/' - 32].regions[i];
    letter_a[i] = BH_GLYPHS['A' - 32].regions[i];
  }

  printf("%zu %zu %.9f %u %u %u\\n",
    sizeof(BHSample),
    bh_sample_count(&params),
    params.FOVy / params.FOVx,
    bh_match_glyph((float[BH_GLYPH_REGION_COUNT]){0}, BH_GLYPH_SET_ASCII),
    bh_match_glyph(slash, BH_GLYPH_SET_ASCII),
    bh_match_glyph(letter_a, BH_GLYPH_SET_CONTOUR_STARS));
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
    assert.equal(run.stdout.trim(), "32 19200 0.500000000 32 47 35");
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("transparent disk gaps retain the ray's resolved background", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "blackhole-layers-"));
  const harnessPath = path.join(tempDirectory, "harness.c");
  const executablePath = path.join(tempDirectory, "harness");
  await writeFile(harnessPath, `
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "blackhole_core.h"

int main(void) {
  BHSceneParams params;
  bh_init_scene_params(&params);
  params.width = 80;
  params.height = 40;
  bh_update_derived(&params);

  BHSample *map = malloc(bh_sample_count(&params) * sizeof(*map));
  if (!map) return 2;
  bh_trace_map(&params, map);

  int disk_with_sky = 0;
  int unresolved_disk = 0;
  for (size_t index = 0; index < bh_sample_count(&params); index++) {
    if (map[index].kind != BH_SAMPLE_DISK) continue;
    if (map[index].background_kind == BH_SAMPLE_SKY) disk_with_sky++;
    if (map[index].background_kind == BH_SAMPLE_EMPTY) unresolved_disk++;
  }
  free(map);

  params.ring_irregularity = 0.0;
  double minimum_opacity = INFINITY;
  double maximum_opacity = -INFINITY;
  const double radius = 9.4;
  for (int sample = 0; sample < 8192; sample++) {
    const double phi = 6.283185307179586 * sample / 8192.0;
    BHDiskAppearance appearance = bh_disk_appearance(
        &params, 0.15, 1.0, radius, phi, 0.0);
    minimum_opacity = fmin(minimum_opacity, appearance.opacity);
    maximum_opacity = fmax(maximum_opacity, appearance.opacity);
  }

  printf("%zu %d %d %.9f %.9f\\n",
      sizeof(BHSample), disk_with_sky, unresolved_disk,
      minimum_opacity, maximum_opacity);
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
    const [sampleBytes, diskWithSky, unresolvedDisk, ...opacities] =
      run.stdout.trim().split(" ").map(Number);
    assert.equal(sampleBytes, 32);
    assert.ok(diskWithSky > 0, "expected disk intersections with sky behind them");
    assert.equal(unresolvedDisk, 0);
    assert.ok(opacities[0] < 1e-6, `disk gap opacity was ${opacities[0]}`);
    assert.ok(opacities[1] > 0.99, `disk material opacity was ${opacities[1]}`);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
