#include "blackhole_core.h"

#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

static const double Mbh = 1.0;
static inline double A(double r) { return 1.0 - 2.0 * Mbh / r; }

static const double rin = 6.0;
static const double rout = 40.0;
static const double emiss_p = 2.0;

static const char RAMP[] = " `,-:'_;~/\\^\"<>!=()?{}|[]#%$&@";

static inline size_t bh_index(const BHSceneParams *params, int x, int y) {
  return (size_t)y * (size_t)params->width + (size_t)x;
}

void bh_init_scene_params(BHSceneParams *params) {
  if (!params) {
    return;
  }
  params->width = 80;
  params->height = 52;
  params->robs = 39.0;
  params->inc_deg = 10.0;
  params->phi_obs = 0.0;
  params->FOVx = 60.0 * M_PI / 180.0;
  params->gamma_c = 0.30;
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
  params->theta_obs =
      M_PI / 2.0 - (params->inc_deg * M_PI / 180.0); // inclination
  params->FOVy =
      params->FOVx * ((double)params->height / (double)params->width);
}

size_t bh_pixel_count(const BHSceneParams *params) {
  if (!params) {
    return 0;
  }
  return (size_t)params->width * (size_t)params->height;
}

static inline double ring_mul(double r) {
  double clamped = r;
  if (clamped < rin) {
    clamped = rin;
  }
  if (clamped > rout) {
    clamped = rout;
  }
  double s = (clamped - rin) / (rout - rin);
  const double Nbands = 8.0;
  const double fill_frac = 0.30;
  const double edge_soft = 0.02;
  const double band_floor = 0.12;
  const double peak = 1.45;
  double pos = Nbands * s;
  double f = pos - floor(pos);
  double w = edge_soft + 1e-6;
  double t = 0.5 + 0.5 * tanh((fill_frac - f) / w);
  return band_floor + (peak - band_floor) * t;
}

static inline double hotspots_mul(double r, double phi, double phase) {
  const int N = 1;
  const double amp = 3.0;
  const double rc = 0.5 * rout;
  const double Rh = 0.5 * rout;
  const double edge = 0.1 * rout;
  double x = r * cos(phi), y = r * sin(phi);
  double m = 1.0;
  for (int k = 0; k < N; k++) {
    double ang = -phase + 2.0 * M_PI * (double)k / (double)N;
    double cx = rc * cos(ang);
    double cy = rc * sin(ang);
    double dx = x - cx, dy = y - cy;
    double d = sqrt(dx * dx + dy * dy);
    double t = 0.5 + 0.5 * tanh((Rh - d) / (edge + 1e-9));
    m += amp * t;
  }
  return m;
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

static void pix_ray(const BHSceneParams *params, int px, int py, double x0[4],
                    double v0[4]) {
  double u = (px + 0.5) / (double)params->width - 0.5;
  double v = (py + 0.5) / (double)params->height - 0.5;
  double ax = u * params->FOVx;
  double ay = v * params->FOVy;
  double nr = -1.0, nth = tan(ay), nph = tan(ax);
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

static Hit trace_pixel(const BHSceneParams *params, int px, int py) {
  Hit H;
  H.hit = 0;
  H.bg_type = 0;
  double x[4], v[4];
  pix_ray(params, px, py, x, v);
  double th_prev = x[2], x_prev[4], v_prev[4];
  for (int i = 0; i < 4; i++) {
    x_prev[i] = x[i];
    v_prev[i] = v[i];
  }
  const double h0 = 0.5, rh = 2.0 * Mbh;
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
      H.bg_type = 2;
      return H;
    }
    if (x[1] > 1.2 * params->robs && step > 10) {
      if (rmin < 3.0 * Mbh) {
        H.bg_type = 2;
      } else if (rmin < rin) {
        H.bg_type = 3;
      } else {
        H.bg_type = 1;
      }
      return H;
    }
    if ((th_prev - M_PI / 2.0) * (x[2] - M_PI / 2.0) <= 0.0) {
      double f = (M_PI / 2.0 - th_prev) / (x[2] - th_prev + 1e-15);
      double rhit = x_prev[1] + f * (x[1] - x_prev[1]);
      double phit = x_prev[3] + f * (x[3] - x_prev[3]);
      if (rhit >= rin && rhit <= rout) {
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
        double g = (Eobs / (Eem > 1e-15 ? Eem : 1e-15));
        H.hit = 1;
        H.bg_type = 0;
        H.r = rhit;
        H.phi = fmod(phit + 1000.0 * M_PI * 2, 2 * M_PI);
        H.g = g > 0 ? g : 0;
        H.emiss = pow(rhit, -emiss_p);
        return H;
      }
    }
    th_prev = x[2];
    for (int i = 0; i < 4; i++) {
      x_prev[i] = x[i];
      v_prev[i] = v[i];
    }
  }
  if (rmin < 3.0 * Mbh) {
    H.bg_type = 2;
  } else if (rmin < rin) {
    H.bg_type = 3;
  } else {
    H.bg_type = 1;
  }
  return H;
}

void bh_trace_map(const BHSceneParams *params, Hit *map_out) {
  if (!params || !map_out) {
    return;
  }
  for (int y = 0; y < params->height; y++) {
    for (int x = 0; x < params->width; x++) {
      map_out[bh_index(params, x, y)] = trace_pixel(params, x, y);
    }
  }
}

static inline double base_disk_value(const Hit *hit) {
  double g3 = pow(hit->g, 3.0);
  return hit->emiss * g3 * ring_mul(hit->r);
}

static inline double disk_value_with_hotspots(const Hit *hit, double phase) {
  return base_disk_value(hit) * hotspots_mul(hit->r, hit->phi, phase);
}

double bh_compute_norm_scale(const BHSceneParams *params, const Hit *map) {
  (void)params;
  if (!map) {
    return 1.0;
  }
  double norm_scale = 1e-12;
  const size_t count = bh_pixel_count(params);
  for (size_t i = 0; i < count; i++) {
    if (map[i].hit) {
      double base = base_disk_value(&map[i]);
      if (base > norm_scale) {
        norm_scale = base;
      }
    }
  }
  return norm_scale;
}

static inline char sky_char(int x, int y, double phase) {
  unsigned int h = (unsigned int)(1469598103u);
  h ^= (unsigned int)(x * 374761393u + y * 668265263u);
  h *= 16777619u;
  unsigned int r = h & 0xffffu;
  if (r < 12000u) {
    return '.';
  }
  if (r < 16000u) {
    double tw = sin(phase * 0.60 +
                    ((h >> 8) & 1023u) * (2.0 * M_PI / 1024.0));
    return (tw > 0.92) ? '*' : '+';
  }
  if (r < 16800u) {
    double tw =
        sin(phase * 0.75 + (h & 1023u) * (2.0 * M_PI / 1024.0));
    return (tw > 0.10) ? '*' : '+';
  }
  return ' ';
}

void bh_generate_ascii_frame(const BHSceneParams *params, const Hit *map,
                             double phase, double norm_scale,
                             char *out_chars) {
  if (!params || !map || !out_chars) {
    return;
  }
  if (norm_scale <= 0.0) {
    norm_scale = 1.0;
  }
  int ramp_len = (int)sizeof(RAMP) - 1;
  if (ramp_len < 1) {
    ramp_len = 1;
  }
  for (int y = 0; y < params->height; y++) {
    for (int x = 0; x < params->width; x++) {
      size_t idx = bh_index(params, x, y);
      const Hit *hit = &map[idx];
      char ch = ' ';
      if (hit->hit) {
        double val = disk_value_with_hotspots(hit, phase);
        double v = val / norm_scale;
        if (v < 0.0) {
          v = 0.0;
        }
        if (v > 1.0) {
          v = 1.0;
        }
        double q = pow(v, params->gamma_c);
        int idx_base = (int)(q * (ramp_len - 1));
        if (idx_base < 0) {
          idx_base = 0;
        }
        if (idx_base > ramp_len - 1) {
          idx_base = ramp_len - 1;
        }
        ch = RAMP[idx_base];
      } else if (hit->bg_type == 2) {
        ch = ' ';
      } else if (hit->bg_type == 3) {
        ch = ' ';
      } else {
        ch = sky_char(x, y, phase);
      }
      out_chars[idx] = ch;
    }
  }
}


