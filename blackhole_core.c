#include "blackhole_core.h"

#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include "generated/blackhole_glyphs.h"

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

static const double Mbh = 1.0;
static inline double A(double r) { return 1.0 - 2.0 * Mbh / r; }

static const double rin = 6.0;
static const double rout = 40.0;
static const double emiss_p = 2.0;

static inline size_t bh_pixel_index(const BHSceneParams *params, int x, int y) {
  return (size_t)y * (size_t)params->width + (size_t)x;
}

static inline size_t bh_sample_index(const BHSceneParams *params, int sample_x,
                                     int sample_y) {
  const size_t sample_width =
      (size_t)params->width * (size_t)params->sample_columns;
  return (size_t)sample_y * sample_width + (size_t)sample_x;
}

void bh_init_scene_params(BHSceneParams *params) {
  if (!params) {
    return;
  }
  params->width = 80;
  params->height = 52;
  params->sample_columns = 2;
  params->sample_rows = 3;
  params->glyph_set = BH_GLYPH_SET_BRAILLE_STARS;
  params->robs = 80.0;
  params->inc_deg = 2.0;
  params->roll_deg = 0.0;
  params->phi_obs = 0.0;
  params->FOVx = 60.0 * M_PI / 180.0;
  params->gamma_c = 0.25;
  params->ring_count = 5.0;
  params->ring_fill = 0.60;
  params->ring_edge = 0.04;
  params->ring_floor = 0.0;
  params->ring_irregularity = 0.65;
  bh_update_derived(params);
}

void bh_update_derived(BHSceneParams *params) {
  if (!params) {
    return;
  }
  if (params->width < 1) {
    params->width = 1;
  }
  if (params->height < 1) {
    params->height = 1;
  }
  if (params->sample_columns < 1) {
    params->sample_columns = 1;
  }
  if (params->sample_rows < 1) {
    params->sample_rows = 1;
  }
  params->ring_count = fmax(1.0, fmin(16.0, params->ring_count));
  params->ring_fill = fmax(0.05, fmin(0.95, params->ring_fill));
  params->ring_edge = fmax(0.001, fmin(0.25, params->ring_edge));
  params->ring_floor = fmax(0.0, fmin(1.0, params->ring_floor));
  params->ring_irregularity =
      fmax(0.0, fmin(1.0, params->ring_irregularity));
  params->theta_obs =
      M_PI / 2.0 - (params->inc_deg * M_PI / 180.0); // inclination
  params->FOVy =
      params->FOVx * ((double)params->height / (double)params->width);
  params->roll_rad = params->roll_deg * M_PI / 180.0;
}

size_t bh_pixel_count(const BHSceneParams *params) {
  if (!params) {
    return 0;
  }
  return (size_t)params->width * (size_t)params->height;
}

size_t bh_sample_count(const BHSceneParams *params) {
  if (!params) {
    return 0;
  }
  return bh_pixel_count(params) * (size_t)params->sample_columns *
         (size_t)params->sample_rows;
}

typedef struct {
  int index;
  int count;
  double radial_position;
  double start;
  double width;
} BHRingBand;

static BHRingBand ring_band_at(const BHSceneParams *params, double r) {
  const double clamped = fmax(rin, fmin(rout, r));
  const double radial_position = (clamped - rin) / (rout - rin);
  const double irregularity = params->ring_irregularity;
  const int band_count =
      (int)fmax(1.0, fmin(16.0, floor(params->ring_count + 0.5)));

  double total_weight = 0.0;
  for (int candidate = 0; candidate < band_count; candidate++) {
    const double band_number = (double)(candidate + 1);
    const double variation =
        0.820 * sin(1.91 * band_number + 0.40) +
        0.320 * sin(4.13 * band_number + 1.10);
    total_weight += fmax(0.20, 1.0 + irregularity * variation);
  }

  BHRingBand band = {
      .index = band_count - 1,
      .count = band_count,
      .radial_position = radial_position,
      .start = 0.0,
      .width = 1.0,
  };
  double cursor = 0.0;
  for (int candidate = 0; candidate < band_count; candidate++) {
    const double band_number = (double)(candidate + 1);
    const double variation =
        0.820 * sin(1.91 * band_number + 0.40) +
        0.320 * sin(4.13 * band_number + 1.10);
    const double weight = fmax(0.20, 1.0 + irregularity * variation);
    const double width = weight / total_weight;
    const double next = cursor + width;
    if (radial_position <= next || candidate == band_count - 1) {
      band.index = candidate;
      band.start = cursor;
      band.width = width;
      break;
    }
    cursor = next;
  }
  return band;
}

double bh_ring_emissivity(const BHSceneParams *params, double r, double phi) {
  const BHRingBand ring = ring_band_at(params, r);
  const double s = ring.radial_position;
  const double irregularity = params->ring_irregularity;
  const double band = (double)ring.index;
  const double local_position = (s - ring.start) / ring.width;
  const double azimuth_ripple =
      irregularity *
      (0.130 * sin(phi + 0.83 * band + 2.0 * M_PI * s) +
       0.065 * sin(2.0 * phi - 0.37 * band - 2.0 * M_PI * s) +
       0.030 * sin(5.0 * phi + 0.51 * band));
  double f = local_position + azimuth_ripple;
  f -= floor(f);
  double fill = params->ring_fill +
                irregularity *
                    (0.220 * sin(2.17 * band + 0.40) +
                     0.080 * sin(4.03 * band + 1.30) +
                     0.100 * sin(2.0 * phi + 0.90 * band) +
                     0.045 * sin(5.0 * phi - 0.60 * band));
  fill = fmax(0.18, fmin(0.88, fill));
  double edge_scale =
      1.0 + irregularity * 0.55 * sin(3.11 * band + 0.90);
  edge_scale = fmax(0.55, fmin(1.45, edge_scale));
  double w = params->ring_edge * edge_scale + 1e-6;
  double t = 0.5 + 0.5 * tanh((fill - f) / w);
  double peak = 1.45 *
                (1.0 + irregularity *
                           (0.180 * sin(1.37 * band + 0.60) +
                            0.080 * sin(3.73 * band + 1.10) +
                            0.120 * sin(phi - 0.45 * band) +
                            0.060 * sin(4.0 * phi + 0.35 * band)));
  return params->ring_floor + (peak - params->ring_floor) * t;
}

static inline double smooth_window(double distance) {
  double value = fmax(0.0, 1.0 - fabs(distance));
  return value * value * (3.0 - 2.0 * value);
}

static inline double wrap_angle(double angle) {
  return angle - 2.0 * M_PI * floor((angle + M_PI) / (2.0 * M_PI));
}

static inline double angular_lobe(double angle, double half_width) {
  return smooth_window(wrap_angle(angle) / half_width);
}

static inline double readable_orbital_phase(double radius, double phi,
                                            double phase) {
  const double angular_speed = fmin(1.6, pow(12.0 / radius, 1.5));
  return phi + phase * angular_speed;
}

BHDiskAppearance bh_disk_appearance(const BHSceneParams *params, double base,
                                    double norm_scale, double r, double phi,
                                    double phase) {
  BHDiskAppearance appearance = {0};
  const double gamma_c = params->gamma_c;
  const double safe_norm = fmax(norm_scale, 1e-12);
  const double normalized = fmax(0.0, fmin(1.0, base / safe_norm));
  if (normalized <= 0.0) {
    return appearance;
  }
  const double toned = pow(normalized, gamma_c);
  const double radius = fmax(rin, fmin(rout, r));
  const double radial_position = (radius - rin) / (rout - rin);
  const double radial_opacity =
      fmax(0.0, fmin(1.0, bh_ring_emissivity(params, radius, phi)));

  const double readable_phi = readable_orbital_phase(radius, phi, phase);
  const double inner_emphasis = 1.0 - radial_position;
  const double inner_area = inner_emphasis * inner_emphasis;
  const double ridge_width = 0.36 + 0.48 * inner_area;
  const double wake_width = 0.95 + 0.30 * inner_emphasis;
  const double angle =
      wrap_angle(readable_phi + 7.5 * radial_position - 0.45);
  const double ridge = angular_lobe(angle, ridge_width);
  const double wake = 0.48 * angular_lobe(angle - 0.62, wake_width);
  const double spiral = fmax(ridge, wake);
  const double highlight = 0.90 - 0.15 * radial_position;
  appearance.emission =
      (float)(spiral * (0.72 * toned + highlight * (1.0 - toned)));
  appearance.opacity = (float)(radial_opacity * spiral);

  appearance.emission = fmaxf(0.0f, fminf(1.0f, appearance.emission));
  appearance.opacity = fmaxf(0.0f, fminf(1.0f, appearance.opacity));
  return appearance;
}

double bh_disk_brightness(const BHSceneParams *params, double base,
                          double norm_scale, double r, double phi,
                          double phase) {
  return bh_disk_appearance(params, base, norm_scale, r, phi, phase).emission;
}

static void metric(double r, double th, double g[4][4]) {
  double Ar = A(r), s = sin(th), s2 = s * s;
  memset(g, 0, sizeof(double) * 16);
  g[0][0] = -Ar;
  g[1][1] = 1.0 / Ar;
  g[2][2] = r * r;
  g[3][3] = r * r * s2;
}

static void accel(double x[4], double v[4], double a[4]) {
  double r = x[1], th = x[2], s = sin(th), c = cos(th), Ar = A(r);
  (void)Ar;
  double Gttr = Mbh / (r * (r - 2.0 * Mbh));
  double Grtt = Ar * Mbh / (r * r);
  double Grrr = -Mbh / (r * (r - 2.0 * Mbh));
  double Grthth = -(r - 2.0 * Mbh);
  double Grphph = -(r - 2.0 * Mbh) * s * s;
  double Gthrth = 1.0 / r;
  double Gthphph = -s * c;
  double Gphrph = 1.0 / r;
  double Gphthph = (c / (s + 1e-12));

  double vt = v[0], vr = v[1], vth = v[2], vph = v[3];
  a[0] = -2.0 * Gttr * vt * vr;
  a[1] = -(Grtt * vt * vt + Grrr * vr * vr + Grthth * vth * vth +
           Grphph * vph * vph);
  a[2] = -(2.0 * Gthrth * vr * vth + Gthphph * vph * vph);
  a[3] = -(2.0 * Gphrph * vr * vph + 2.0 * Gphthph * vth * vph);
}

static void rk4(double x[4], double v[4], double h) {
  double k1x[4], k2x[4], k3x[4], k4x[4];
  double k1v[4], k2v[4], k3v[4], k4v[4];
  double a[4], xt[4], vt[4];
  accel(x, v, a);
  for (int i = 0; i < 4; i++) {
    k1x[i] = h * v[i];
    k1v[i] = h * a[i];
    xt[i] = x[i] + 0.5 * k1x[i];
    vt[i] = v[i] + 0.5 * k1v[i];
  }
  accel(xt, vt, a);
  for (int i = 0; i < 4; i++) {
    k2x[i] = h * vt[i];
    k2v[i] = h * a[i];
    xt[i] = x[i] + 0.5 * k2x[i];
    vt[i] = v[i] + 0.5 * k2v[i];
  }
  accel(xt, vt, a);
  for (int i = 0; i < 4; i++) {
    k3x[i] = h * vt[i];
    k3v[i] = h * a[i];
    xt[i] = x[i] + k3x[i];
    vt[i] = v[i] + k3v[i];
  }
  accel(xt, vt, a);
  for (int i = 0; i < 4; i++) {
    k4x[i] = h * vt[i];
    k4v[i] = h * a[i];
  }
  for (int i = 0; i < 4; i++) {
    x[i] += (k1x[i] + 2 * k2x[i] + 2 * k3x[i] + k4x[i]) / 6.0;
    v[i] += (k1v[i] + 2 * k2v[i] + 2 * k3v[i] + k4v[i]) / 6.0;
  }
  if (x[2] < 1e-6) {
    x[2] = 1e-6;
  }
  if (x[2] > M_PI - 1e-6) {
    x[2] = M_PI - 1e-6;
  }
}

static void pix_ray(const BHSceneParams *params, int sample_x, int sample_y,
                    double x0[4], double v0[4]) {
  const int sample_width = params->width * params->sample_columns;
  const int sample_height = params->height * params->sample_rows;
  double u = (sample_x + 0.5) / (double)sample_width - 0.5;
  double v = (sample_y + 0.5) / (double)sample_height - 0.5;
  double ax = u * params->FOVx;
  double ay = v * params->FOVy;
  double nr = -1.0, nth = tan(ay), nph = tan(ax);
  if (params->roll_rad != 0.0) {
    double c = cos(params->roll_rad);
    double s = sin(params->roll_rad);
    double nth_rot = nth * c - nph * s;
    double nph_rot = nth * s + nph * c;
    nth = nth_rot;
    nph = nph_rot;
  }
  double norm = sqrt(nr * nr + nth * nth + nph * nph);
  nr /= norm;
  nth /= norm;
  nph /= norm;
  double Ar = A(params->robs), s = sin(params->theta_obs);
  x0[0] = 0.0;
  x0[1] = params->robs;
  x0[2] = params->theta_obs;
  x0[3] = params->phi_obs;
  v0[0] = 1.0 / sqrt(Ar);
  v0[1] = nr * sqrt(Ar);
  v0[2] = nth / params->robs;
  v0[3] = nph / (params->robs * (s > 1e-12 ? s : 1e-12));
}

static void resolve_terminal(BHSample *sample, BHRayTerminalKind kind,
                             double theta, double phi) {
  const float resolved_phi =
      (float)fmod(phi + 1000.0 * M_PI * 2.0, 2.0 * M_PI);
  sample->terminal_kind = (uint32_t)kind;
  if (kind == BH_TERMINAL_SKY) {
    sample->background_a = (float)theta;
    sample->background_b = resolved_phi;
  }
}

static BHSample trace_sample(const BHSceneParams *params, int sample_x,
                            int sample_y) {
  BHSample sample = {0};
  double x[4], v[4];
  pix_ray(params, sample_x, sample_y, x, v);
  double th_prev = x[2], x_prev[4], v_prev[4];
  for (int i = 0; i < 4; i++) {
    x_prev[i] = x[i];
    v_prev[i] = v[i];
  }
  const double h0 = 0.5, rh = 2.0 * Mbh;
  const double escape_radius = fmax(1.2 * params->robs, rout + 10.0 * Mbh);
  double rmin = x[1];
  for (int step = 0; step < 5000; ++step) {
    double h = h0;
    if (x[1] < 10.0) {
      h = 0.25 * h0;
    }
    if (x[1] < 6.0) {
      h = 0.125 * h0;
    }
    rk4(x, v, h);
    if (x[1] < rmin) {
      rmin = x[1];
    }
    if (x[1] <= 1.001 * rh) {
      resolve_terminal(&sample, BH_TERMINAL_HORIZON, 0.0, 0.0);
      return sample;
    }
    if (x[1] > escape_radius && step > 10) {
      if (rmin < 3.0 * Mbh) {
        resolve_terminal(&sample, BH_TERMINAL_HORIZON, 0.0, 0.0);
      } else {
        resolve_terminal(&sample, BH_TERMINAL_SKY, x[2], x[3]);
      }
      return sample;
    }
    if ((th_prev - M_PI / 2.0) * (x[2] - M_PI / 2.0) <= 0.0) {
      double f = (M_PI / 2.0 - th_prev) / (x[2] - th_prev + 1e-15);
      double rhit = x_prev[1] + f * (x[1] - x_prev[1]);
      double phit = x_prev[3] + f * (x[3] - x_prev[3]);
      if (rhit >= rin && rhit <= rout &&
          sample.disk_layer_count < BH_MAX_DISK_LAYERS) {
        double vh[4];
        for (int i = 0; i < 4; i++) {
          vh[i] = v_prev[i] + f * (v[i] - v_prev[i]);
        }
        double gmn[4][4];
        metric(rhit, M_PI / 2.0, gmn);
        double pmu[4] = {0};
        for (int a = 0; a < 4; a++) {
          for (int b = 0; b < 4; b++) {
            pmu[a] += gmn[a][b] * vh[b];
          }
        }
        double ut_obs = 1.0 / sqrt(A(params->robs));
        double Eobs = -(pmu[0] * ut_obs);
        double denom = sqrt(1.0 - 3.0 * Mbh / rhit);
        double ut = 1.0 / denom;
        double uphi = sqrt(Mbh / (rhit * rhit * rhit)) / denom;
        double Eem = -(pmu[0] * ut + pmu[3] * uphi);
        double Eobs_clamped = fmax(fmin(Eobs, 1e6), -1e6);
        double Eem_clamped =
            (fabs(Eem) < 1e-12) ? (Eem >= 0.0 ? 1e-12 : -1e-12) : Eem;
        double g = (Eobs_clamped / Eem_clamped);
        if (!isfinite(g)) {
          g = 0.0;
        }
        const double phi = fmod(phit + 1000.0 * M_PI * 2, 2 * M_PI);
        const double positive_g = g > 0 ? g : 0;
        BHDiskLayer *layer =
            &sample.disk_layers[sample.disk_layer_count++];
        layer->radius = (float)rhit;
        layer->phi = (float)phi;
        layer->base =
            (float)(pow(rhit, -emiss_p) * pow(positive_g, 3.0) *
                    bh_ring_emissivity(params, rhit, phi));
      }
    }
    th_prev = x[2];
    for (int i = 0; i < 4; i++) {
      x_prev[i] = x[i];
      v_prev[i] = v[i];
    }
  }
  if (rmin < 3.0 * Mbh) {
    resolve_terminal(&sample, BH_TERMINAL_HORIZON, 0.0, 0.0);
  } else {
    resolve_terminal(&sample, BH_TERMINAL_SKY, x[2], x[3]);
  }
  return sample;
}

void bh_trace_map(const BHSceneParams *params, BHSample *map_out) {
  if (!params || !map_out) {
    return;
  }
  const int sample_width = params->width * params->sample_columns;
  const int sample_height = params->height * params->sample_rows;
  for (int y = 0; y < sample_height; y++) {
    for (int x = 0; x < sample_width; x++) {
      map_out[bh_sample_index(params, x, y)] = trace_sample(params, x, y);
    }
  }
}

float bh_compute_norm_scale(const BHSceneParams *params, const BHSample *map) {
  if (!map) {
    return 1.0;
  }
  float norm_scale = 1e-12f;
  const size_t count = bh_sample_count(params);
  for (size_t i = 0; i < count; i++) {
    for (uint32_t layer_index = 0;
         layer_index < map[i].disk_layer_count; layer_index++) {
      if (map[i].disk_layers[layer_index].base > norm_scale) {
        norm_scale = map[i].disk_layers[layer_index].base;
      }
    }
  }
  return norm_scale;
}

static inline uint32_t hash_sky(float theta, float phi) {
  int32_t theta_cell = (int32_t)(theta * 200.0f);
  int32_t phi_cell = (int32_t)(phi * 100.0f);
  uint32_t h = 2166136261u;
  h ^= (uint32_t)theta_cell * 374761393u;
  h *= 16777619u;
  h ^= (uint32_t)phi_cell * 668265263u;
  h *= 16777619u;
  h ^= h >> 16u;
  h *= 2246822507u;
  h ^= h >> 13u;
  h *= 3266489909u;
  h ^= h >> 16u;
  return h;
}

static inline float sky_value(float theta, float phi, double phase) {
  uint32_t hash = hash_sky(theta, phi);
  uint32_t density = hash & 0xffffu;
  uint32_t twinkle_hash = hash_sky(theta + 17.0f, phi + 31.0f);
  if (density < 4000u) {
    return 0.20f;
  }
  if (density < 5500u) {
    double offset = (double)(twinkle_hash & 1023u) * (2.0 * M_PI / 1024.0);
    return sin(phase * 0.15 + offset) > 0.5 ? 0.50f : 0.20f;
  }
  if (density < 6200u) {
    double offset = (double)(twinkle_hash & 1023u) * (2.0 * M_PI / 1024.0);
    return sin(phase * 0.20 + offset) > 0.3 ? 0.85f : 0.50f;
  }
  return 0.0f;
}

static int is_contour_glyph(uint32_t codepoint) {
  for (uint32_t index = 0; index < BH_CONTOUR_ASCII_GLYPH_COUNT; index++) {
    if (BH_CONTOUR_ASCII_CODEPOINTS[index] == codepoint) {
      return 1;
    }
  }
  return 0;
}

uint32_t bh_match_glyph(const float values[BH_GLYPH_REGION_COUNT],
                        BHGlyphSet glyph_set) {
  uint32_t count = glyph_set == BH_GLYPH_SET_ASCII_BRAILLE
                       ? BH_GLYPH_COUNT
                       : BH_ASCII_GLYPH_COUNT;
  float best_error = INFINITY;
  uint32_t best_codepoint = 32u;
  for (uint32_t glyph_index = 0; glyph_index < count; glyph_index++) {
    if (glyph_set == BH_GLYPH_SET_CONTOUR_STARS &&
        !is_contour_glyph(BH_GLYPHS[glyph_index].codepoint)) {
      continue;
    }
    float error = 0.0f;
    for (uint32_t region = 0; region < BH_GLYPH_REGION_COUNT; region++) {
      float difference = values[region] - BH_GLYPHS[glyph_index].regions[region];
      error += difference * difference;
    }
    if (error < best_error) {
      best_error = error;
      best_codepoint = BH_GLYPHS[glyph_index].codepoint;
    }
  }
  return best_codepoint;
}

static uint32_t match_lattice(const float values[BH_GLYPH_REGION_COUNT],
                              const BHSceneParams *params,
                              int use_braille) {
  uint32_t count = use_braille
                       ? BH_BRAILLE_GLYPH_COUNT
                   : params->glyph_set == BH_GLYPH_SET_ASCII_BRAILLE
                       ? BH_GLYPH_COUNT
                       : BH_ASCII_GLYPH_COUNT;
  const int region_count = params->sample_columns * params->sample_rows;
  float best_error = INFINITY;
  uint32_t best_codepoint = 32u;
  for (uint32_t candidate = 0; candidate < count; candidate++) {
    uint32_t glyph_index = use_braille && candidate > 0
                               ? BH_BRAILLE_GLYPH_OFFSET + candidate
                               : candidate;
    if (!use_braille && params->glyph_set == BH_GLYPH_SET_CONTOUR_STARS &&
        !is_contour_glyph(BH_GLYPHS[glyph_index].codepoint)) {
      continue;
    }
    float error = 0.0f;
    if (region_count == 1) {
      float difference = values[0] - BH_GLYPHS[glyph_index].coverage;
      error = difference * difference;
    } else {
      for (int region = 0; region < region_count; region++) {
        float feature = region_count == 4
                            ? BH_GLYPHS[glyph_index].regions2x2[region]
                            : BH_GLYPHS[glyph_index].regions[region];
        float difference = values[region] - feature;
        error += difference * difference;
      }
    }
    if (error < best_error) {
      best_error = error;
      best_codepoint = BH_GLYPHS[glyph_index].codepoint;
    }
  }
  return best_codepoint;
}

static float glyph_feature_scale(const BHSceneParams *params, int use_braille,
                                 int region) {
  const int region_count = params->sample_columns * params->sample_rows;
  if (region_count == 1) {
    return use_braille
               ? BH_BRAILLE_MAX_COVERAGE
           : params->glyph_set == BH_GLYPH_SET_ASCII_BRAILLE
               ? BH_ASCII_BRAILLE_MAX_COVERAGE
               : BH_ASCII_MAX_COVERAGE;
  }
  if (region_count == 4) {
    return use_braille
               ? BH_BRAILLE_MAX_FEATURE_2X2_BY_REGION[region]
           : params->glyph_set == BH_GLYPH_SET_ASCII_BRAILLE
               ? BH_ASCII_BRAILLE_MAX_FEATURE_2X2_BY_REGION[region]
               : BH_ASCII_MAX_FEATURE_2X2_BY_REGION[region];
  }
  return use_braille
             ? BH_BRAILLE_MAX_FEATURE_2X3_BY_REGION[region]
         : params->glyph_set == BH_GLYPH_SET_ASCII_BRAILLE
             ? BH_ASCII_BRAILLE_MAX_FEATURE_2X3_BY_REGION[region]
             : BH_ASCII_MAX_FEATURE_2X3_BY_REGION[region];
}

void bh_generate_ascii_frame(const BHSceneParams *params, const BHSample *map,
                             double phase, float norm_scale,
                             uint32_t *out_codepoints) {
  if (!params || !map || !out_codepoints) {
    return;
  }
  if (norm_scale <= 0.0) {
    norm_scale = 1.0;
  }
  const int sample_width = params->width * params->sample_columns;
  for (int y = 0; y < params->height; y++) {
    for (int x = 0; x < params->width; x++) {
      float values[BH_GLYPH_REGION_COUNT] = {0};
      float disk_peak = 0.0f;
      float sky_peak = 0.0f;
      for (int sample_y = 0; sample_y < params->sample_rows; sample_y++) {
        for (int sample_x = 0; sample_x < params->sample_columns; sample_x++) {
          int region = sample_y * params->sample_columns + sample_x;
          if (region >= (int)BH_GLYPH_REGION_COUNT) {
            continue;
          }
          const int map_x = x * params->sample_columns + sample_x;
          const int map_y = y * params->sample_rows + sample_y;
          const BHSample *sample =
              &map[(size_t)map_y * (size_t)sample_width + (size_t)map_x];
          float brightness = 0.0f;
          float transmittance = 1.0f;
          for (uint32_t layer_index = 0;
               layer_index < sample->disk_layer_count; layer_index++) {
            const BHDiskLayer *layer = &sample->disk_layers[layer_index];
            const BHDiskAppearance appearance = bh_disk_appearance(
                params, layer->base, norm_scale, layer->radius, layer->phi,
                phase);
            const float visible_emission =
                transmittance * appearance.emission;
            brightness += visible_emission;
            disk_peak = fmaxf(disk_peak, visible_emission);
            transmittance *= 1.0f - appearance.opacity;
          }
          if (sample->terminal_kind == BH_TERMINAL_SKY) {
            const float visible_sky =
                transmittance * sky_value(sample->background_a,
                                          sample->background_b, phase);
            brightness += visible_sky;
            sky_peak = fmaxf(sky_peak, visible_sky);
          }
          values[region] = fminf(1.0f, brightness);
        }
      }
      int use_braille =
          (params->glyph_set == BH_GLYPH_SET_BRAILLE_STARS ||
           params->glyph_set == BH_GLYPH_SET_CONTOUR_STARS) &&
                        sky_peak > 0.0f && sky_peak > disk_peak;
      const int region_count = params->sample_columns * params->sample_rows;
      for (int region = 0; region < region_count; region++) {
        values[region] *= glyph_feature_scale(params, use_braille, region);
      }
      out_codepoints[bh_pixel_index(params, x, y)] =
          match_lattice(values, params, use_braille);
    }
  }
}
