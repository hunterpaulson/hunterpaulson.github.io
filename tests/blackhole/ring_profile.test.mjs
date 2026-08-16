import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = new URL("../../", import.meta.url);
const repoPath = path.resolve(import.meta.dirname, "../..");

test("disk ring emissivity uses disk-local rather than screen-space coordinates", async () => {
  const [nativeSource, shaderSource] = await Promise.all([
    readFile(new URL("blackhole_core.c", repoRoot), "utf8"),
    readFile(new URL("assets/blackhole_gpu.wgsl", repoRoot), "utf8"),
  ]);

  for (const source of [nativeSource, shaderSource]) {
    assert.doesNotMatch(source, /ring_lensed_emphasis/);
    assert.doesNotMatch(source, /ring_mul\([^)]*screen_v/);
  }
});

test("ring irregularity varies band spacing, width, and disk-local azimuth", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "blackhole-rings-"));
  const harnessPath = path.join(tempDirectory, "harness.c");
  const executablePath = path.join(tempDirectory, "harness");
  await writeFile(harnessPath, `
#include <math.h>
#include <stdio.h>
#include "blackhole_core.h"

static double radius_at(double s) {
  return 6.0 + s * (40.0 - 6.0);
}

int main(void) {
  BHSceneParams params;
  bh_init_scene_params(&params);

  params.ring_irregularity = 0.0;
  double uniform_min = INFINITY;
  double uniform_max = -INFINITY;
  for (int ring = 0; ring < 5; ring++) {
    double value = bh_ring_emissivity(&params, radius_at((ring + 0.30) / 5.0), 0.0);
    uniform_min = fmin(uniform_min, value);
    uniform_max = fmax(uniform_max, value);
  }

  params.ring_irregularity = 0.65;
  double varied_min = INFINITY;
  double varied_max = -INFINITY;
  double azimuth_delta = 0.0;
  double profile_min = INFINITY;
  double profile_max = -INFINITY;
  double rising_edges[16];
  int rising_edge_count = 0;
  for (int ring = 0; ring < 5; ring++) {
    double value = bh_ring_emissivity(&params, radius_at((ring + 0.30) / 5.0), 0.0);
    varied_min = fmin(varied_min, value);
    varied_max = fmax(varied_max, value);
  }
  for (int sample = 0; sample <= 400; sample++) {
    double r = radius_at(sample / 400.0);
    double first = bh_ring_emissivity(&params, r, 0.0);
    double second = bh_ring_emissivity(&params, r, 1.7);
    azimuth_delta = fmax(azimuth_delta, fabs(first - second));
    profile_min = fmin(profile_min, fmin(first, second));
    profile_max = fmax(profile_max, fmax(first, second));
  }

  double previous = bh_ring_emissivity(&params, radius_at(0.0), 0.0);
  for (int sample = 1; sample <= 20000; sample++) {
    double s = sample / 20000.0;
    double current = bh_ring_emissivity(&params, radius_at(s), 0.0);
    if (previous < 0.20 && current > 0.80 && rising_edge_count < 16) {
      rising_edges[rising_edge_count++] = s;
    }
    previous = current;
  }
  double narrowest_period = INFINITY;
  double widest_period = 0.0;
  for (int edge = 1; edge < rising_edge_count; edge++) {
    double period = rising_edges[edge] - rising_edges[edge - 1];
    narrowest_period = fmin(narrowest_period, period);
    widest_period = fmax(widest_period, period);
  }
  double period_ratio = widest_period / narrowest_period;
  int fewest_bright_samples = 20001;
  int most_bright_samples = 0;
  for (int angle = 0; angle < 16; angle++) {
    double phi = angle * 6.283185307179586 / 16.0;
    int bright_samples = 0;
    for (int sample = 0; sample <= 20000; sample++) {
      double value = bh_ring_emissivity(
          &params, radius_at(sample / 20000.0), phi);
      bright_samples += value > 0.50;
    }
    fewest_bright_samples = fmin(fewest_bright_samples, bright_samples);
    most_bright_samples = fmax(most_bright_samples, bright_samples);
  }
  double bright_fraction_range =
      (most_bright_samples - fewest_bright_samples) / 20000.0;

  printf("%.9f %.9f %.9f %.9f %.9f %.9f %d %.9f\\n",
    uniform_max - uniform_min,
    varied_max - varied_min,
    azimuth_delta,
    profile_min,
    profile_max,
    period_ratio,
    rising_edge_count,
    bright_fraction_range);
  return 0;
}
`);

  try {
    const compile = spawnSync("cc", [
      "-std=c11", "-O2", "-I", repoPath,
      harnessPath,
      path.join(repoPath, "blackhole_core.c"),
      "-lm", "-o", executablePath,
    ], { encoding: "utf8" });
    assert.equal(compile.status, 0, compile.stderr);

    const run = spawnSync(executablePath, [], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const [
      uniformRange,
      variedRange,
      azimuthDelta,
      profileMin,
      profileMax,
      periodRatio,
      risingEdgeCount,
      brightFractionRange,
    ] =
      run.stdout.trim().split(" ").map(Number);

    assert.ok(uniformRange < 1e-8, `uniform profile range was ${uniformRange}`);
    assert.ok(variedRange > 0.10, `irregular band range was ${variedRange}`);
    assert.ok(azimuthDelta > 0.10, `azimuthal variation was ${azimuthDelta}`);
    assert.ok(profileMin < 1e-4, `darkest gap was ${profileMin}`);
    assert.ok(profileMax > 1.0, `brightest band was ${profileMax}`);
    assert.ok(risingEdgeCount >= 4, `found ${risingEdgeCount} ring boundaries`);
    assert.ok(periodRatio > 1.75, `widest/narrowest period ratio was ${periodRatio}`);
    assert.ok(
      brightFractionRange > 0.03,
      `azimuthal bright-width range was ${brightFractionRange}`,
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
