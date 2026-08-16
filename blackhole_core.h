#ifndef BLACKHOLE_CORE_H
#define BLACKHOLE_CORE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
  BH_TERMINAL_UNRESOLVED = 0,
  BH_TERMINAL_SKY = 1,
  BH_TERMINAL_HORIZON = 2,
} BHRayTerminalKind;

typedef enum {
  BH_GLYPH_SET_ASCII = 0,
  BH_GLYPH_SET_ASCII_BRAILLE = 1,
  BH_GLYPH_SET_BRAILLE_STARS = 2,
  BH_GLYPH_SET_CONTOUR_STARS = 3,
} BHGlyphSet;

#define BH_MAX_DISK_LAYERS 4u

typedef struct {
  float radius;
  float phi;
  float base; // phase-independent disk brightness
  uint32_t _padding;
} BHDiskLayer;

typedef struct {
  BHDiskLayer disk_layers[BH_MAX_DISK_LAYERS];
  float background_a; // final sky theta
  float background_b; // final sky phi
  uint32_t terminal_kind;
  uint32_t disk_layer_count;
} BHSample;

typedef struct {
  float emission;
  float opacity;
} BHDiskAppearance;

typedef struct {
  int width;
  int height;
  int sample_columns;
  int sample_rows;
  BHGlyphSet glyph_set;
  double robs;
  double inc_deg;
  double roll_deg;
  double phi_obs;
  double theta_obs;
  double FOVx;
  double FOVy;
  double gamma_c;
  double roll_rad;
  double ring_count;
  double ring_fill;
  double ring_edge;
  double ring_floor;
  double ring_irregularity;
} BHSceneParams;

void bh_init_scene_params(BHSceneParams *params);
void bh_update_derived(BHSceneParams *params);
size_t bh_pixel_count(const BHSceneParams *params);
size_t bh_sample_count(const BHSceneParams *params);
double bh_ring_emissivity(const BHSceneParams *params, double r, double phi);
BHDiskAppearance bh_disk_appearance(const BHSceneParams *params, double base,
                                    double norm_scale, double r, double phi,
                                    double phase);
double bh_disk_brightness(const BHSceneParams *params, double base,
                          double norm_scale, double r, double phi,
                          double phase);
void bh_trace_map(const BHSceneParams *params, BHSample *map_out);
float bh_compute_norm_scale(const BHSceneParams *params, const BHSample *map);
uint32_t bh_match_glyph(const float values[6], BHGlyphSet glyph_set);
void bh_generate_ascii_frame(const BHSceneParams *params, const BHSample *map,
                             double phase, float norm_scale,
                             uint32_t *out_codepoints);

#ifdef __cplusplus
}
#endif

#endif // BLACKHOLE_CORE_H
