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
  Hit *map;
  char *raw_pixels;
  char *frame_chars;
  size_t pixel_count;
  size_t frame_bytes;
  double norm_scale;
} BHContext;

static BHContext ctx = {0};

static void bh_wasm_clear(void) {
  free(ctx.map);
  free(ctx.raw_pixels);
  free(ctx.frame_chars);
  memset(&ctx, 0, sizeof(ctx));
}

static int bh_wasm_alloc_buffers(void) {
  ctx.pixel_count = bh_pixel_count(&ctx.params);
  if (ctx.pixel_count == 0) {
    return -1;
  }
  ctx.map = (Hit *)malloc(sizeof(Hit) * ctx.pixel_count);
  ctx.raw_pixels = (char *)malloc(ctx.pixel_count);
  ctx.frame_bytes =
      ctx.pixel_count + (size_t)ctx.params.height + 1; // newline per row + NUL
  ctx.frame_chars = (char *)malloc(ctx.frame_bytes);
  if (!ctx.map || !ctx.raw_pixels || !ctx.frame_chars) {
    bh_wasm_clear();
    return -2;
  }
  return 0;
}

EMSCRIPTEN_KEEPALIVE
int bh_wasm_init(int width, int height, double inc_deg, double fovx_deg,
                 double robs) {
  if (width <= 0 || height <= 0) {
    return -1;
  }
  bh_wasm_clear();

  bh_init_scene_params(&ctx.params);
  ctx.params.width = width;
  ctx.params.height = height;
  if (inc_deg > -89.0 && inc_deg < 89.0) {
    ctx.params.inc_deg = inc_deg;
  }
  if (fovx_deg > 5.0 && fovx_deg < 170.0) {
    ctx.params.FOVx = fovx_deg * M_PI / 180.0;
  }
  if (robs > 10.0 && robs < 2000.0) {
    ctx.params.robs = robs;
  }
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
size_t bh_wasm_frame_len(void) { return ctx.frame_bytes; }

EMSCRIPTEN_KEEPALIVE
const char *bh_wasm_generate_frame(double phase) {
  if (!ctx.map || !ctx.raw_pixels || !ctx.frame_chars) {
    return NULL;
  }

  bh_generate_ascii_frame(&ctx.params, ctx.map, phase, ctx.norm_scale,
                          ctx.raw_pixels);

  const char *src = ctx.raw_pixels;
  char *dst = ctx.frame_chars;
  int width = ctx.params.width;
  int height = ctx.params.height;
  for (int y = 0; y < height; y++) {
    memcpy(dst, src, width);
    dst += width;
    src += width;
    *dst++ = '\n';
  }
  *dst = '\0';
  return ctx.frame_chars;
}


