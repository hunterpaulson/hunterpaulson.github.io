#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include <emscripten/emscripten.h>

#include "blackhole_core.h"

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

typedef struct {
  BHSceneParams params;
  BHSample *map;
  uint32_t *frame_codepoints;
  float *matter_field;
  size_t pixel_count;
  size_t sample_count;
  float norm_scale;
} BHContext;

static BHContext ctx = {0};

static void bh_wasm_clear(void) {
  free(ctx.map);
  free(ctx.frame_codepoints);
  free(ctx.matter_field);
  memset(&ctx, 0, sizeof(ctx));
}

static int bh_wasm_alloc_buffers(void) {
  ctx.pixel_count = bh_pixel_count(&ctx.params);
  ctx.sample_count = bh_sample_count(&ctx.params);
  if (ctx.pixel_count == 0 || ctx.sample_count == 0) {
    return -1;
  }
  ctx.map = (BHSample *)malloc(sizeof(BHSample) * ctx.sample_count);
  ctx.frame_codepoints =
      (uint32_t *)malloc(sizeof(uint32_t) * ctx.pixel_count);
  ctx.matter_field = (float *)malloc(sizeof(float) * ctx.pixel_count);
  if (!ctx.map || !ctx.frame_codepoints || !ctx.matter_field) {
    bh_wasm_clear();
    return -2;
  }
  bh_seed_spiral_matter(ctx.matter_field, ctx.params.width, ctx.params.height);
  ctx.params.matter_field = ctx.matter_field;
  ctx.params.matter_width = ctx.params.width;
  ctx.params.matter_height = ctx.params.height;
  return 0;
}

EMSCRIPTEN_KEEPALIVE
int bh_wasm_init(int width, int height, double inc_deg, double fovx_deg,
                 double robs, double roll_deg, int glyph_set,
                 int sample_count, double ring_count, double ring_fill,
                 double ring_edge, double ring_floor,
                 double ring_irregularity) {
  if (width <= 0 || height <= 0) {
    return -1;
  }
  bh_wasm_clear();

  bh_init_scene_params(&ctx.params);
  ctx.params.width = width;
  ctx.params.height = height;
  ctx.params.sample_columns = sample_count == 1 ? 1 : 2;
  ctx.params.sample_rows = sample_count == 1 ? 1 : (sample_count == 4 ? 2 : 3);
  ctx.params.glyph_set = glyph_set == BH_GLYPH_SET_ASCII_BRAILLE
                             ? BH_GLYPH_SET_ASCII_BRAILLE
                         : glyph_set == BH_GLYPH_SET_CONTOUR_STARS
                             ? BH_GLYPH_SET_CONTOUR_STARS
                         : glyph_set == BH_GLYPH_SET_BRAILLE_STARS
                             ? BH_GLYPH_SET_BRAILLE_STARS
                             : BH_GLYPH_SET_ASCII;
  if (inc_deg > -89.0 && inc_deg < 89.0) {
    ctx.params.inc_deg = inc_deg;
  }
  if (fovx_deg > 5.0 && fovx_deg < 170.0) {
    ctx.params.FOVx = fovx_deg * M_PI / 180.0;
  }
  if (robs > 10.0 && robs < 2000.0) {
    ctx.params.robs = robs;
  }
  if (roll_deg >= -90.0 && roll_deg <= 90.0) {
    ctx.params.roll_deg = roll_deg;
  }
  ctx.params.ring_count = ring_count;
  ctx.params.ring_fill = ring_fill;
  ctx.params.ring_edge = ring_edge;
  ctx.params.ring_floor = ring_floor;
  ctx.params.ring_irregularity = ring_irregularity;
  bh_update_derived(&ctx.params);

  int alloc_status = bh_wasm_alloc_buffers();
  if (alloc_status != 0) {
    return alloc_status;
  }

  bh_trace_map(&ctx.params, ctx.map);
  ctx.norm_scale = bh_compute_norm_scale(&ctx.params, ctx.map);
  return 0;
}

EMSCRIPTEN_KEEPALIVE
void bh_wasm_destroy(void) { bh_wasm_clear(); }

EMSCRIPTEN_KEEPALIVE
int bh_wasm_width(void) { return ctx.params.width; }

EMSCRIPTEN_KEEPALIVE
int bh_wasm_height(void) { return ctx.params.height; }

EMSCRIPTEN_KEEPALIVE
int bh_wasm_glyph_set(void) { return ctx.params.glyph_set; }

EMSCRIPTEN_KEEPALIVE
size_t bh_wasm_frame_len(void) { return ctx.pixel_count; }

EMSCRIPTEN_KEEPALIVE
float *bh_wasm_matter_ptr(void) { return ctx.matter_field; }

EMSCRIPTEN_KEEPALIVE
const uint32_t *bh_wasm_generate_frame(double phase) {
  if (!ctx.map || !ctx.frame_codepoints) {
    return NULL;
  }

  bh_generate_ascii_frame(&ctx.params, ctx.map, phase, ctx.norm_scale,
                          ctx.frame_codepoints);
  return ctx.frame_codepoints;
}
