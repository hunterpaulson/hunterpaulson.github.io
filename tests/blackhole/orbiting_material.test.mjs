import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoPath = path.resolve(import.meta.dirname, "../..");

test("disk rings expose coherent landmarks at distinct orbital speeds", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "blackhole-rings-"));
  const harnessPath = path.join(tempDirectory, "harness.c");
  const executablePath = path.join(tempDirectory, "harness");
  await writeFile(harnessPath, `
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "blackhole_core.h"

int main(void) {
  const int samples = 8192;
  const double phase = 0.41;
  BHSceneParams params;
  bh_init_scene_params(&params);
  params.ring_count = 5.0;
  params.ring_irregularity = 0.0;

  for (int ring = 0; ring < 5; ring++) {
    const double ring_start = 6.0 + 34.0 * ring / 5.0;
    const double ring_width = 34.0 / 5.0;
    const double radius = ring_start + 0.5 * ring_width;
    const double speed = pow(12.0 / radius, 1.5);
    double minimum = INFINITY;
    double maximum = -INFINITY;
    double transport_error = 0.0;
    int clusters = 0;
    const double last_phi = 6.283185307179586 * (samples - 1) / samples;
    int previous_bright = bh_disk_brightness(
        &params, 0.15, 1.0, radius, last_phi, 0.0) > 0.30;

    for (int sample = 0; sample < samples; sample++) {
      const double phi = 6.283185307179586 * sample / samples;
      const double value = bh_disk_brightness(
          &params, 0.15, 1.0, radius, phi, 0.0);
      const int bright = value > 0.30;
      clusters += bright && !previous_bright;
      previous_bright = bright;
      minimum = fmin(minimum, value);
      maximum = fmax(maximum, value);

      for (int edge = 0; edge < 2; edge++) {
        const double edge_radius =
            ring_start + (edge == 0 ? 0.1 : 0.9) * ring_width;
        const double edge_speed = fmin(1.6, pow(12.0 / edge_radius, 1.5));
        const double moving = bh_disk_brightness(
            &params, 0.15, 1.0, edge_radius, phi, phase);
        const double transported = bh_disk_brightness(
            &params, 0.15, 1.0, edge_radius, phi + phase * edge_speed, 0.0);
        transport_error = fmax(transport_error, fabs(moving - transported));
      }
    }

    printf("%d %.12f %.12f %.12f ",
      clusters, maximum - minimum, transport_error, speed);
  }

  params.width = 80;
  params.height = 40;
  params.ring_irregularity = 0.65;
  bh_update_derived(&params);
  BHSample *map = malloc(bh_sample_count(&params) * sizeof(*map));
  if (!map) {
    return 2;
  }
  bh_trace_map(&params, map);
  double left_base = 0.0;
  double right_base = 0.0;
  const int sample_width = params.width * params.sample_columns;
  const int sample_height = params.height * params.sample_rows;
  for (int y = 0; y < sample_height; y++) {
    for (int x = 0; x < sample_width; x++) {
      BHSample *sample = &map[y * sample_width + x];
      if (sample->disk_layer_count == 0) {
        continue;
      }
      for (uint32_t layer = 0; layer < sample->disk_layer_count; layer++) {
        if (x < sample_width / 2) {
          left_base += sample->disk_layers[layer].base;
        } else {
          right_base += sample->disk_layers[layer].base;
        }
      }
    }
  }
  free(map);
  double minimum = INFINITY;
  double maximum = -INFINITY;
  for (int sample = 0; sample < samples; sample++) {
    const double phi = 6.283185307179586 * sample / samples;
    const double value = bh_disk_brightness(
        &params, 0.15, 1.0, 18.0, phi, 0.0);
    minimum = fmin(minimum, value);
    maximum = fmax(maximum, value);
  }
  printf("%.12f %.12f %.12f\\n",
    right_base / left_base, minimum, maximum);
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
    const values = run.stdout.trim().split(" ").map(Number);
    const rings = Array.from({ length: 5 }, (_, ring) => ({
      clusters: values[ring * 4],
      contrast: values[ring * 4 + 1],
      transportError: values[ring * 4 + 2],
      speed: values[ring * 4 + 3],
    }));

    assert.deepEqual(rings.map(({ clusters }) => clusters), [1, 1, 2, 2, 2]);
    for (const ring of rings) {
      assert.ok(ring.contrast > 0.5, `ring contrast was ${ring.contrast}`);
      assert.ok(ring.transportError < 1e-9, `transport error was ${ring.transportError}`);
    }
    for (let ring = 0; ring < rings.length - 1; ring += 1) {
      assert.ok(rings[ring].speed > rings[ring + 1].speed);
    }
    assert.ok(values[20] > 1.1, `Doppler-bright side ratio was ${values[20]}`);
    assert.ok(values[21] < 0.22, `disk minimum was ${values[21]}`);
    assert.ok(values[22] > 0.75, `disk maximum was ${values[22]}`);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("native, WebGPU, WASM, and browser callers expose one orbital simulation", async () => {
  const [
    nativeSource,
    wasmSource,
    gpuSource,
    shaderSource,
    browserSource,
    runtimeSource,
    matterSource,
    measurementSource,
  ] = await Promise.all([
    "blackhole_core.c",
    "blackhole_wasm.c",
    "assets/blackhole_gpu.js",
    "assets/blackhole_gpu.wgsl",
    "src/blackhole_simulation.js",
    "src/art/blackhole_runtime.mjs",
    "src/art/blackhole_matter.mjs",
    "scripts/blackhole/measure-browser.mjs",
  ].map((relativePath) => readFile(path.join(repoPath, relativePath), "utf8")));

  for (const source of [nativeSource, shaderSource]) {
    assert.match(source, /ring_band_at/);
    assert.match(source, /readable_orbital_phase/);
    assert.match(source, /matter_density/);
    assert.match(source, /disk_appearance/);
    assert.match(source, /terminal_kind/);
    assert.match(source, /disk_layers/);
    assert.match(source, /projected_phi/);
    assert.match(source, /editor_scale/);
  }
  for (const source of [nativeSource, matterSource]) {
    assert.match(source, /ridge_width|ridgeWidth/);
    assert.match(source, /wake_width|wakeWidth/);
    assert.match(source, /spiral/i);
  }
  assert.match(gpuSource, /sampleCount \* SAMPLE_BYTES/);
  assert.match(gpuSource, /setMatterField/);
  assert.match(shaderSource, /matter_field/);
  assert.match(wasmSource, /bh_wasm_matter_ptr/);
  assert.match(wasmSource, /bh_generate_ascii_frame/);
  assert.match(runtimeSource, /BLACKHOLE_WASM_INIT_PARAMETER_TYPES/);
  assert.match(browserSource, /draftMatter/);
  assert.match(browserSource, /activeMatter\.set\(draftMatter\)/);
  assert.match(matterSource, /MATTER_EDITOR_RADIUS/);
  for (const caller of [browserSource, measurementSource]) {
    assert.match(caller, /blackholeWasmInitArguments/);
  }
});
