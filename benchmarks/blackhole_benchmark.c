#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include "blackhole_core.h"

static double now_seconds(void) {
  struct timespec time;
  timespec_get(&time, TIME_UTC);
  return (double)time.tv_sec + (double)time.tv_nsec / 1e9;
}

static void benchmark_lattice(int columns, int rows) {
  BHSceneParams params;
  bh_init_scene_params(&params);
  params.width = 80;
  params.height = 40;
  params.sample_columns = columns;
  params.sample_rows = rows;
  bh_update_derived(&params);

  const size_t pixels = bh_pixel_count(&params);
  const size_t samples = bh_sample_count(&params);
  BHSample *map = malloc(samples * sizeof(*map));
  uint32_t *frame = malloc(pixels * sizeof(*frame));
  if (!map || !frame) {
    fprintf(stderr, "allocation failed\n");
    exit(1);
  }

  const double trace_start = now_seconds();
  bh_trace_map(&params, map);
  const double trace_ms = (now_seconds() - trace_start) * 1000.0;
  const float norm = bh_compute_norm_scale(&params, map);

  const int shade_frames = 120;
  const double shade_start = now_seconds();
  for (int frame_index = 0; frame_index < shade_frames; frame_index++) {
    bh_generate_ascii_frame(&params, map, frame_index * 0.01, norm, frame);
  }
  const double shade_ms =
      (now_seconds() - shade_start) * 1000.0 / shade_frames;

  printf("%dx%d,%zu,%zu,%.3f,%.3f\n", columns, rows, samples,
         samples * sizeof(*map), trace_ms, shade_ms);
  free(frame);
  free(map);
}

int main(void) {
  puts("lattice,samples,map_bytes,trace_ms,shade_ms");
  benchmark_lattice(1, 1);
  benchmark_lattice(2, 2);
  benchmark_lattice(2, 3);
  return 0;
}
