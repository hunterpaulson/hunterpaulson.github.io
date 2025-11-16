#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "blackhole_core.h"

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

static const char *dump_path = NULL;
static int dump_frames = 0;

static void write_frame(FILE *out, const BHSceneParams *params,
                        const char *frame_chars) {
  for (int y = 0; y < params->height; y++) {
    fwrite(frame_chars + (size_t)y * params->width, 1, params->width, out);
    fputc('\n', out);
  }
}

int main(int argc, char **argv) {
  BHSceneParams params;
  bh_init_scene_params(&params);

  int numpos = 0;
  for (int i = 1; i < argc; i++) {
    if (strcmp(argv[i], "--dump") == 0 && i + 1 < argc) {
      dump_path = argv[++i];
      continue;
    }
    if (strcmp(argv[i], "--frames") == 0 && i + 1 < argc) {
      dump_frames = atoi(argv[++i]);
      continue;
    }
    char *end = NULL;
    double val = strtod(argv[i], &end);
    if (end && *end == '\0') {
      if (numpos == 0 && val > -89.0 && val < 89.0) {
        params.inc_deg = val;
      } else if (numpos == 1 && val > 5.0 && val < 170.0) {
        params.FOVx = val * M_PI / 180.0;
      } else if (numpos == 2 && val > 10.0 && val < 2000.0) {
        params.robs = val;
      }
      numpos++;
    }
  }

  bh_update_derived(&params);

  size_t pixel_count = bh_pixel_count(&params);
  if (pixel_count == 0) {
    fprintf(stderr, "invalid dimensions\n");
    return 1;
  }

  Hit *map = (Hit *)malloc(sizeof(Hit) * pixel_count);
  if (!map) {
    fprintf(stderr, "failed to allocate map (%zu bytes)\n",
            sizeof(Hit) * pixel_count);
    return 1;
  }

  bh_trace_map(&params, map);
  double norm_scale = bh_compute_norm_scale(&params, map);

  char *frame_chars = (char *)malloc(pixel_count);
  if (!frame_chars) {
    fprintf(stderr, "failed to allocate frame buffer (%zu bytes)\n",
            pixel_count);
    free(map);
    return 1;
  }

  double phase = 0.0;
  const double dphase = 2 * M_PI / 180.0;

  if (dump_path && dump_frames > 0) {
    FILE *f = fopen(dump_path, "wb");
    if (!f) {
      perror("fopen dump");
      free(frame_chars);
      free(map);
      return 1;
    }
    for (int frame = 0; frame < dump_frames; ++frame) {
      bh_generate_ascii_frame(&params, map, phase, norm_scale, frame_chars);
      write_frame(f, &params, frame_chars);
      if (frame != dump_frames - 1) {
        fputc('\f', f);
      }
      phase += dphase;
      if (phase > 2 * M_PI) {
        phase -= 2 * M_PI;
      }
    }
    fclose(f);
    fprintf(stderr, "dumped %d frames to %s (size %dx%d)\n", dump_frames,
            dump_path, params.width, params.height);
    free(frame_chars);
    free(map);
    return 0;
  }

  printf("\x1b[2J");
  for (;;) {
    printf("\x1b[H");
    bh_generate_ascii_frame(&params, map, phase, norm_scale, frame_chars);
    write_frame(stdout, &params, frame_chars);
    fflush(stdout);
    usleep(40000);
    phase += dphase;
    if (phase > 2 * M_PI) {
      phase -= 2 * M_PI;
    }
  }

  free(frame_chars);
  free(map);
  return 0;
}


