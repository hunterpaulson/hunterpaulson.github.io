#ifndef BLACKHOLE_CORE_H
#define BLACKHOLE_CORE_H

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
  double r;
  double phi;
  double g;
  double emiss;
  int hit;
  int bg_type;
} Hit;

typedef struct {
  int width;
  int height;
  double robs;
  double inc_deg;
  double roll_deg;
  double phi_obs;
  double theta_obs;
  double FOVx;
  double FOVy;
  double gamma_c;
  double roll_rad;
} BHSceneParams;

void bh_init_scene_params(BHSceneParams *params);
void bh_update_derived(BHSceneParams *params);
size_t bh_pixel_count(const BHSceneParams *params);
void bh_trace_map(const BHSceneParams *params, Hit *map_out);
double bh_compute_norm_scale(const BHSceneParams *params, const Hit *map);
void bh_generate_ascii_frame(const BHSceneParams *params, const Hit *map,
                             double phase, double norm_scale, char *out_chars);

#ifdef __cplusplus
}
#endif

#endif // BLACKHOLE_CORE_H


