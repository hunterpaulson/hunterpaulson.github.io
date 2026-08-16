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

static void write_codepoint(FILE *out, uint32_t codepoint) {
  unsigned char encoded[4];
  size_t length = 0;
  if (codepoint <= 0x7fu) {
    encoded[length++] = (unsigned char)codepoint;
  } else if (codepoint <= 0x7ffu) {
    encoded[length++] = (unsigned char)(0xc0u | (codepoint >> 6u));
    encoded[length++] = (unsigned char)(0x80u | (codepoint & 0x3fu));
  } else if (codepoint <= 0xffffu) {
    encoded[length++] = (unsigned char)(0xe0u | (codepoint >> 12u));
    encoded[length++] = (unsigned char)(0x80u | ((codepoint >> 6u) & 0x3fu));
    encoded[length++] = (unsigned char)(0x80u | (codepoint & 0x3fu));
  } else {
    encoded[length++] = (unsigned char)(0xf0u | (codepoint >> 18u));
    encoded[length++] = (unsigned char)(0x80u | ((codepoint >> 12u) & 0x3fu));
    encoded[length++] = (unsigned char)(0x80u | ((codepoint >> 6u) & 0x3fu));
    encoded[length++] = (unsigned char)(0x80u | (codepoint & 0x3fu));
  }
  fwrite(encoded, 1, length, out);
}

static void write_frame(FILE *out, const BHSceneParams *params,
                        const uint32_t *frame_codepoints) {
  for (int y = 0; y < params->height; y++) {
    for (int x = 0; x < params->width; x++) {
      write_codepoint(out, frame_codepoints[(size_t)y * params->width + x]);
    }
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
      } else if (numpos == 3 && val >= -90.0 && val <= 90.0) {
        params.roll_deg = val;
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

  size_t sample_count = bh_sample_count(&params);
  BHSample *map = (BHSample *)malloc(sizeof(BHSample) * sample_count);
  if (!map) {
    fprintf(stderr, "failed to allocate map (%zu bytes)\n",
            sizeof(BHSample) * sample_count);
    return 1;
  }

  bh_trace_map(&params, map);
  float norm_scale = bh_compute_norm_scale(&params, map);

  uint32_t *frame_codepoints =
      (uint32_t *)malloc(sizeof(uint32_t) * pixel_count);
  if (!frame_codepoints) {
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
      free(frame_codepoints);
      free(map);
      return 1;
    }
    for (int frame = 0; frame < dump_frames; ++frame) {
      bh_generate_ascii_frame(&params, map, phase, norm_scale,
                              frame_codepoints);
      write_frame(f, &params, frame_codepoints);
      if (frame != dump_frames - 1) {
        fputc('\f', f);
      }
      phase += dphase;
    }
    fclose(f);
    fprintf(stderr, "dumped %d frames to %s (size %dx%d)\n", dump_frames,
            dump_path, params.width, params.height);
    free(frame_codepoints);
    free(map);
    return 0;
  }

  printf("\x1b[2J");
  for (;;) {
    printf("\x1b[H");
    bh_generate_ascii_frame(&params, map, phase, norm_scale,
                            frame_codepoints);
    write_frame(stdout, &params, frame_codepoints);
    fflush(stdout);
    usleep(40000);
    phase += dphase;
  }

  free(frame_codepoints);
  free(map);
  return 0;
}
