// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  GEODESIC RAYTRACING IN SCHWARZSCHILD SPACETIME                          ║
// ║  WebGPU Compute Shader for Real-Time Black Hole Visualization            ║
// ║                                                                          ║
// ║  The Schwarzschild metric describes spacetime around a non-rotating      ║
// ║  black hole. We trace light rays (null geodesics) backwards from the     ║
// ║  camera through curved spacetime using the geodesic equation:            ║
// ║                                                                          ║
// ║    d²xᵘ/dλ² + Γᵘ_αβ (dxᵅ/dλ)(dxᵝ/dλ) = 0                                ║
// ║                                                                          ║
// ║  where Γᵘ_αβ are the Christoffel symbols derived from the metric.        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const PI: f32 = 3.14159265358979323846;
const Mbh: f32 = 1.0;  // Black hole mass (geometric units: G = c = 1)
const rin: f32 = 6.0;   // Inner edge of accretion disk (ISCO for Schwarzschild)
const rout: f32 = 40.0; // Outer edge of accretion disk
const emiss_p: f32 = 2.0; // Emission power law exponent

// Scene parameters - uniforms that can change every frame
struct SceneParams {
    width: u32,
    height: u32,
    sample_columns: u32,
    sample_rows: u32,
    robs: f32,
    theta_obs: f32,
    phi_obs: f32,
    FOVx: f32,
    FOVy: f32,
    roll_rad: f32,
    phase: f32,
    gamma_c: f32,
    glyph_count: u32,
    feature_scale: f32,
    glyph_mode: u32,
    braille_feature_scale: f32,
    ring_count: f32,
    ring_fill: f32,
    ring_edge: f32,
    ring_floor: f32,
    feature_scales_0: vec4<f32>,
    feature_scales_1: vec2<f32>,
    braille_feature_scales_0: vec4<f32>,
    braille_feature_scales_1: vec2<f32>,
    ring_irregularity: f32,
}

struct Sample {
    a: f32,    // disk radius or final sky theta
    b: f32,    // disk azimuth or final sky phi
    base: f32, // phase-independent disk brightness
    kind: u32,
    background_a: f32,
    background_b: f32,
    background_kind: u32,
    _padding: u32,
}

struct RingBand {
    index: u32,
    count: u32,
    radial_position: f32,
    start: f32,
    width: f32,
}

struct Glyph {
    regions: array<f32, 6>,
    regions2x2: array<f32, 4>,
    coverage: f32,
    codepoint: u32,
}

struct Normalization {
    max_bits: atomic<u32>,
}

@group(0) @binding(0) var<uniform> params: SceneParams;
@group(0) @binding(1) var<storage, read_write> sample_map: array<Sample>;
@group(0) @binding(2) var<storage, read_write> output_chars: array<u32>;
@group(0) @binding(3) var<storage, read> glyphs: array<Glyph>;
@group(0) @binding(4) var<storage, read_write> normalization: Normalization;

// ═══════════════════════════════════════════════════════════════════════════
// SCHWARZSCHILD METRIC
// ═══════════════════════════════════════════════════════════════════════════
// 
// The line element in Boyer-Lindquist coordinates (t, r, θ, φ):
//
//   ds² = -A(r)dt² + (1/A(r))dr² + r²dθ² + r²sin²θ dφ²
//
// where A(r) = 1 - 2M/r is the "lapse function" (goes to 0 at horizon r=2M)
// ═══════════════════════════════════════════════════════════════════════════

fn A(r: f32) -> f32 {
    return 1.0 - 2.0 * Mbh / r;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHRISTOFFEL SYMBOLS (GEODESIC ACCELERATION)
// ═══════════════════════════════════════════════════════════════════════════
//
// The geodesic equation tells us how 4-velocity changes along the ray:
//
//   aᵘ = -Γᵘ_αβ vᵅ vᵝ
//
// The non-zero Christoffel symbols for Schwarzschild are:
//   Γᵗ_tr = M/(r(r-2M))
//   Γʳ_tt = A(r)M/r²
//   Γʳ_rr = -M/(r(r-2M))
//   Γʳ_θθ = -(r-2M)
//   Γʳ_φφ = -(r-2M)sin²θ
//   Γᶿ_rθ = 1/r
//   Γᶿ_φφ = -sinθ cosθ
//   Γᵠ_rφ = 1/r
//   Γᵠ_θφ = cosθ/sinθ
// ═══════════════════════════════════════════════════════════════════════════

fn compute_acceleration(x: vec4<f32>, v: vec4<f32>) -> vec4<f32> {
    let r = x[1];
    let th = x[2];
    let s = sin(th);
    let c = cos(th);
    let Ar = A(r);
    
    // Christoffel symbols
    let Gttr = Mbh / (r * (r - 2.0 * Mbh));
    let Grtt = Ar * Mbh / (r * r);
    let Grrr = -Mbh / (r * (r - 2.0 * Mbh));
    let Grthth = -(r - 2.0 * Mbh);
    let Grphph = -(r - 2.0 * Mbh) * s * s;
    let Gthrth = 1.0 / r;
    let Gthphph = -s * c;
    let Gphrph = 1.0 / r;
    let Gphthph = c / (s + 1e-12);
    
    let vt = v[0];
    let vr = v[1];
    let vth = v[2];
    let vph = v[3];
    
    // Geodesic equation: aᵘ = -Γᵘ_αβ vᵅ vᵝ
    var a: vec4<f32>;
    a[0] = -2.0 * Gttr * vt * vr;
    a[1] = -(Grtt * vt * vt + Grrr * vr * vr + Grthth * vth * vth + Grphph * vph * vph);
    a[2] = -(2.0 * Gthrth * vr * vth + Gthphph * vph * vph);
    a[3] = -(2.0 * Gphrph * vr * vph + 2.0 * Gphthph * vth * vph);
    
    return a;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4TH ORDER RUNGE-KUTTA INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
//
// We integrate the geodesic equation using RK4 for accuracy.
// The state is (xᵘ, vᵘ) = (position 4-vector, velocity 4-vector)
//
// RK4 combines four "slopes" at different points to achieve O(h⁴) accuracy:
//   k₁ = f(yₙ)
//   k₂ = f(yₙ + h/2 · k₁)
//   k₃ = f(yₙ + h/2 · k₂)
//   k₄ = f(yₙ + h · k₃)
//   yₙ₊₁ = yₙ + h/6 · (k₁ + 2k₂ + 2k₃ + k₄)
// ═══════════════════════════════════════════════════════════════════════════

fn rk4_step(x_in: vec4<f32>, v_in: vec4<f32>, h: f32) -> array<vec4<f32>, 2> {
    var x = x_in;
    var v = v_in;
    
    // k1
    var a = compute_acceleration(x, v);
    let k1x = h * v;
    let k1v = h * a;
    
    // k2
    var xt = x + 0.5 * k1x;
    var vt = v + 0.5 * k1v;
    a = compute_acceleration(xt, vt);
    let k2x = h * vt;
    let k2v = h * a;
    
    // k3
    xt = x + 0.5 * k2x;
    vt = v + 0.5 * k2v;
    a = compute_acceleration(xt, vt);
    let k3x = h * vt;
    let k3v = h * a;
    
    // k4
    xt = x + k3x;
    vt = v + k3v;
    a = compute_acceleration(xt, vt);
    let k4x = h * vt;
    let k4v = h * a;
    
    // Combine
    x = x + (k1x + 2.0 * k2x + 2.0 * k3x + k4x) / 6.0;
    v = v + (k1v + 2.0 * k2v + 2.0 * k3v + k4v) / 6.0;
    
    // Clamp theta to avoid coordinate singularities at poles
    x[2] = clamp(x[2], 1e-6, PI - 1e-6);
    
    return array<vec4<f32>, 2>(x, v);
}

// ═══════════════════════════════════════════════════════════════════════════
// RAY INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════
//
// For each pixel, we construct the initial 4-position and 4-velocity.
// The observer is at (t=0, r=robs, θ=theta_obs, φ=phi_obs).
//
// The initial ray direction in the observer's local frame is mapped
// from screen coordinates using the field of view angles.
// ═══════════════════════════════════════════════════════════════════════════

fn init_ray(sample_x: u32, sample_y: u32) -> array<vec4<f32>, 2> {
    let sample_width = params.width * params.sample_columns;
    let sample_height = params.height * params.sample_rows;
    let u = (f32(sample_x) + 0.5) / f32(sample_width) - 0.5;
    let v = (f32(sample_y) + 0.5) / f32(sample_height) - 0.5;
    
    // Angular offsets from view center
    let ax = u * params.FOVx;
    let ay = v * params.FOVy;
    
    // Local ray direction (pointing inward, toward black hole)
    var nr = -1.0;
    var nth = tan(ay);
    var nph = tan(ax);
    
    // Apply camera roll
    if (params.roll_rad != 0.0) {
        let cr = cos(params.roll_rad);
        let sr = sin(params.roll_rad);
        let nth_rot = nth * cr - nph * sr;
        let nph_rot = nth * sr + nph * cr;
        nth = nth_rot;
        nph = nph_rot;
    }
    
    // Normalize direction
    let norm = sqrt(nr * nr + nth * nth + nph * nph);
    nr /= norm;
    nth /= norm;
    nph /= norm;
    
    // Observer's position and local frame
    let Ar = A(params.robs);
    let s = sin(params.theta_obs);
    
    // Initial 4-position
    var x0: vec4<f32>;
    x0[0] = 0.0;                // t
    x0[1] = params.robs;        // r
    x0[2] = params.theta_obs;   // θ
    x0[3] = params.phi_obs;     // φ
    
    // Initial 4-velocity (null geodesic: gᵘᵛ vᵤ vᵥ = 0)
    // The factors convert from local orthonormal frame to coordinate basis
    var v0: vec4<f32>;
    v0[0] = 1.0 / sqrt(Ar);                          // dt/dλ
    v0[1] = nr * sqrt(Ar);                           // dr/dλ
    v0[2] = nth / params.robs;                       // dθ/dλ
    v0[3] = nph / (params.robs * max(s, 1e-12));     // dφ/dλ
    
    return array<vec4<f32>, 2>(x0, v0);
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCRETION DISK APPEARANCE
// ═══════════════════════════════════════════════════════════════════════════

fn ring_band_at(r: f32) -> RingBand {
    let clamped = clamp(r, rin, rout);
    let radial_position = (clamped - rin) / (rout - rin);
    let irregularity = params.ring_irregularity;
    let band_count = max(1u, u32(round(params.ring_count)));

    var total_weight = 0.0;
    for (var candidate = 0u; candidate < 16u; candidate++) {
        if (candidate >= band_count) {
            break;
        }
        let band_number = f32(candidate + 1u);
        let variation =
            0.820 * sin(1.91 * band_number + 0.40) +
            0.320 * sin(4.13 * band_number + 1.10);
        total_weight += max(0.20, 1.0 + irregularity * variation);
    }

    var band_index = band_count - 1u;
    var band_start = 0.0;
    var band_width = 1.0;
    var cursor = 0.0;
    for (var candidate = 0u; candidate < 16u; candidate++) {
        if (candidate >= band_count) {
            break;
        }
        let band_number = f32(candidate + 1u);
        let variation =
            0.820 * sin(1.91 * band_number + 0.40) +
            0.320 * sin(4.13 * band_number + 1.10);
        let weight = max(0.20, 1.0 + irregularity * variation);
        let width = weight / total_weight;
        let next = cursor + width;
        if (radial_position <= next || candidate + 1u == band_count) {
            band_index = candidate;
            band_start = cursor;
            band_width = width;
            break;
        }
        cursor = next;
    }

    return RingBand(
        band_index,
        band_count,
        radial_position,
        band_start,
        band_width,
    );
}

fn ring_mul(r: f32, phi: f32) -> f32 {
    let ring = ring_band_at(r);
    let s = ring.radial_position;
    let irregularity = params.ring_irregularity;
    let band = f32(ring.index);
    let local_position = (s - ring.start) / ring.width;
    let azimuth_ripple = irregularity *
        (0.130 * sin(phi + 0.83 * band + 2.0 * PI * s) +
         0.065 * sin(2.0 * phi - 0.37 * band - 2.0 * PI * s) +
         0.030 * sin(5.0 * phi + 0.51 * band));
    let f = local_position + azimuth_ripple - floor(local_position + azimuth_ripple);
    let fill = clamp(
        params.ring_fill + irregularity *
            (0.220 * sin(2.17 * band + 0.40) +
             0.080 * sin(4.03 * band + 1.30) +
             0.100 * sin(2.0 * phi + 0.90 * band) +
             0.045 * sin(5.0 * phi - 0.60 * band)),
        0.18,
        0.88,
    );
    let edge_scale = clamp(
        1.0 + irregularity * 0.55 * sin(3.11 * band + 0.90),
        0.55,
        1.45,
    );
    let w = params.ring_edge * edge_scale + 1e-6;
    let t = 0.5 + 0.5 * tanh((fill - f) / w);
    let peak = 1.45 *
        (1.0 + irregularity *
            (0.180 * sin(1.37 * band + 0.60) +
             0.080 * sin(3.73 * band + 1.10) +
             0.120 * sin(phi - 0.45 * band) +
             0.060 * sin(4.0 * phi + 0.35 * band)));
    return params.ring_floor + (peak - params.ring_floor) * t;
}

fn smooth_window(distance: f32) -> f32 {
    let value = max(0.0, 1.0 - abs(distance));
    return value * value * (3.0 - 2.0 * value);
}

fn wrap_angle(angle: f32) -> f32 {
    return angle - 2.0 * PI * floor((angle + PI) / (2.0 * PI));
}

fn angular_lobe(angle: f32, half_width: f32) -> f32 {
    return smooth_window(wrap_angle(angle) / half_width);
}

fn readable_orbital_phase(radius: f32, phi: f32, phase: f32) -> f32 {
    let angular_speed = min(1.6, pow(12.0 / radius, 1.5));
    return phi + phase * angular_speed;
}

fn disk_appearance(base: f32, norm_scale: f32, r: f32, phi: f32) -> vec2<f32> {
    let normalized = clamp(base / max(norm_scale, 1e-12), 0.0, 1.0);
    if (normalized <= 0.0) {
        return vec2<f32>(0.0);
    }
    let toned = pow(normalized, params.gamma_c);
    let radius = clamp(r, rin, rout);
    let radial_position = (radius - rin) / (rout - rin);
    let radial_opacity = clamp(ring_mul(radius, phi), 0.0, 1.0);
    let readable_phi = readable_orbital_phase(radius, phi, params.phase);
    let inner_emphasis = 1.0 - radial_position;
    let inner_area = inner_emphasis * inner_emphasis;
    let ridge_width = 0.36 + 0.48 * inner_area;
    let wake_width = 0.95 + 0.30 * inner_emphasis;
    let angle = wrap_angle(readable_phi + 7.5 * radial_position - 0.45);
    let ridge = angular_lobe(angle, ridge_width);
    let wake = 0.48 * angular_lobe(angle - 0.62, wake_width);
    let spiral = max(ridge, wake);
    let highlight = 0.90 - 0.15 * radial_position;
    let emission = spiral * (0.72 * toned + highlight * (1.0 - toned));
    let appearance = vec2<f32>(emission, radial_opacity * spiral);

    return clamp(appearance, vec2<f32>(0.0), vec2<f32>(1.0));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN RAYTRACING KERNEL
// ═══════════════════════════════════════════════════════════════════════════
//
// Each GPU thread traces one ray. This is "embarrassingly parallel" -
// no communication between threads needed!
// ═══════════════════════════════════════════════════════════════════════════

@compute @workgroup_size(16, 16, 1)
fn trace_rays(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let sample_x = global_id.x;
    let sample_y = global_id.y;
    let sample_width = params.width * params.sample_columns;
    let sample_height = params.height * params.sample_rows;
    
    // Bounds check
    if (sample_x >= sample_width || sample_y >= sample_height) {
        return;
    }
    
    let idx = sample_y * sample_width + sample_x;
    
    let ray_data = init_ray(sample_x, sample_y);
    var x = ray_data[0];
    var v = ray_data[1];
    
    // Previous state for interpolation
    var th_prev = x[2];
    var x_prev = x;
    var v_prev = v;
    
    let h0 = 0.5;  // Base step size
    let rh = 2.0 * Mbh;  // Event horizon radius
    var rmin = x[1];
    
    var sample: Sample;
    sample.a = 0.0;
    sample.b = 0.0;
    sample.base = 0.0;
    sample.kind = 0u;
    sample.background_a = 0.0;
    sample.background_b = 0.0;
    sample.background_kind = 0u;
    sample._padding = 0u;
    
    // March the ray through spacetime
    for (var step = 0; step < 5000; step++) {
        // Adaptive step size - smaller steps near black hole for accuracy
        var h = h0;
        if (x[1] < 10.0) { h = 0.25 * h0; }
        if (x[1] < 6.0) { h = 0.125 * h0; }
        
        // RK4 step
        let result = rk4_step(x, v, h);
        x = result[0];
        v = result[1];
        
        // Track minimum radius (for background classification)
        if (x[1] < rmin) { rmin = x[1]; }
        
        // Check if ray fell into black hole
        if (x[1] <= 1.001 * rh) {
            if (sample.kind == 1u) {
                sample.background_kind = 3u;
            } else {
                sample.kind = 3u;
            }
            sample_map[idx] = sample;
            return;
        }
        
        // Check if ray escaped to infinity
        if (x[1] > 1.2 * params.robs && step > 10) {
            if (rmin < 3.0 * Mbh) {
                if (sample.kind == 1u) {
                    sample.background_kind = 3u;
                } else {
                    sample.kind = 3u;
                }
            } else {
                let sky_phi = (x[3] + 1000.0 * PI * 2.0) % (2.0 * PI);
                if (sample.kind == 1u) {
                    sample.background_kind = 2u;
                    sample.background_a = x[2];
                    sample.background_b = sky_phi;
                } else {
                    sample.kind = 2u;
                    sample.a = x[2];
                    sample.b = sky_phi;
                }
            }
            sample_map[idx] = sample;
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // DISK CROSSING DETECTION
        // ═══════════════════════════════════════════════════════════════════
        // The disk lies in the equatorial plane (θ = π/2).
        // We detect when the ray crosses this plane by checking sign change.
        // ═══════════════════════════════════════════════════════════════════
        
        if (sample.kind != 1u &&
            (th_prev - PI / 2.0) * (x[2] - PI / 2.0) <= 0.0) {
            // Linear interpolation to find exact crossing point
            let f = (PI / 2.0 - th_prev) / (x[2] - th_prev + 1e-15);
            let rhit = x_prev[1] + f * (x[1] - x_prev[1]);
            let phit = x_prev[3] + f * (x[3] - x_prev[3]);
            
            // Check if hit is within disk bounds
            if (rhit >= rin && rhit <= rout) {
                // Interpolate velocity at hit point
                let vh = v_prev + f * (v - v_prev);
                
                // ═══════════════════════════════════════════════════════════
                // RELATIVISTIC DOPPLER FACTOR
                // ═══════════════════════════════════════════════════════════
                // The disk material orbits the black hole. The observed
                // frequency differs from emitted frequency due to:
                //   1. Gravitational redshift (climbing out of potential well)
                //   2. Transverse Doppler (time dilation of moving emitter)
                //   3. Longitudinal Doppler (motion toward/away from observer)
                //
                // g = E_obs / E_emit = (pᵤ uᵒᵇˢᵘ) / (pᵤ uᵉᵐⁱᵗᵘ)
                //
                // where p is the photon 4-momentum and u is the 4-velocity.
                // ═══════════════════════════════════════════════════════════
                
                // Compute covariant momentum pᵤ = gᵤᵥ vᵛ
                let Ar_hit = A(rhit);
                let pmu_t = -Ar_hit * vh[0];
                let pmu_r = vh[1] / Ar_hit;
                let pmu_th = rhit * rhit * vh[2];
                let pmu_ph = rhit * rhit * vh[3];  // sin²(π/2) = 1
                
                // Observer's 4-velocity (static at infinity approximation)
                let ut_obs = 1.0 / sqrt(A(params.robs));
                let Eobs = -(pmu_t * ut_obs);
                
                // Disk material 4-velocity (circular Keplerian orbit)
                // For Schwarzschild, Ω = sqrt(M/r³) and the 4-velocity is:
                let denom = sqrt(1.0 - 3.0 * Mbh / rhit);
                let ut = 1.0 / denom;
                let uphi = sqrt(Mbh / (rhit * rhit * rhit)) / denom;
                let Eem = -(pmu_t * ut + pmu_ph * uphi);
                
                // Doppler factor (clamped for numerical stability)
                let Eobs_c = clamp(Eobs, -1e6, 1e6);
                var Eem_c = Eem;
                if (abs(Eem) < 1e-12) {
                    Eem_c = select(-1e-12, 1e-12, Eem >= 0.0);
                }
                var g = Eobs_c / Eem_c;
                if (!is_finite(g)) { g = 0.0; }
                
                let phi = (phit + 1000.0 * PI * 2.0) % (2.0 * PI);
                sample.kind = 1u;
                sample.a = rhit;
                sample.b = phi;
                sample.base = pow(rhit, -emiss_p) * pow(max(g, 0.0), 3.0) * ring_mul(rhit, phi);
                atomicMax(&normalization.max_bits, bitcast<u32>(sample.base));
            }
        }
        
        // Save state for next iteration
        th_prev = x[2];
        x_prev = x;
        v_prev = v;
    }
    
    if (rmin < 3.0 * Mbh) {
        if (sample.kind == 1u) {
            sample.background_kind = 3u;
        } else {
            sample.kind = 3u;
        }
    } else {
        let sky_phi = (x[3] + 1000.0 * PI * 2.0) % (2.0 * PI);
        if (sample.kind == 1u) {
            sample.background_kind = 2u;
            sample.background_a = x[2];
            sample.background_b = sky_phi;
        } else {
            sample.kind = 2u;
            sample.a = x[2];
            sample.b = sky_phi;
        }
    }
    sample_map[idx] = sample;
}

// ═══════════════════════════════════════════════════════════════════════════
// ASCII RENDERING KERNEL
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// CELESTIAL SPHERE HASH FOR STAR FIELD
// ═══════════════════════════════════════════════════════════════════════════
// Instead of hashing pixel coordinates (which don't move with camera),
// we hash the final ray direction (θ, φ) on the celestial sphere.
// This means:
//   1. Stars stay fixed on the sky as camera rotates ✓
//   2. Stars near black hole get gravitationally lensed ✓
//   3. Same stars visible from different angles ✓
// ═══════════════════════════════════════════════════════════════════════════

fn hash_sky(theta: f32, phi: f32) -> u32 {
    // Discretize the celestial sphere into cells
    // Higher resolution = more stars, but they stay consistent
    let theta_cell = i32(theta * 200.0);  // ~200 cells from pole to pole
    let phi_cell = i32(phi * 100.0);      // ~628 cells around equator
    
    // High-quality hash combining both coordinates
    var h = 2166136261u;  // FNV offset basis
    h ^= u32(theta_cell) * 374761393u;
    h *= 16777619u;  // FNV prime
    h ^= u32(phi_cell) * 668265263u;
    h *= 16777619u;
    h ^= h >> 16u;
    h *= 2246822507u;
    h ^= h >> 13u;
    h *= 3266489909u;
    h ^= h >> 16u;
    return h;
}

fn sky_value(theta: f32, phi: f32) -> f32 {
    let h = hash_sky(theta, phi);
    let density = h & 0xffffu;
    let twinkle_hash = hash_sky(theta + 17.0, phi + 31.0);
    let twinkle_phase = f32(twinkle_hash & 1023u) * (2.0 * PI / 1024.0);
    if (density < 4000u) {
        return 0.20;
    }
    if (density < 5500u) {
        return select(0.20, 0.50, sin(params.phase * 0.15 + twinkle_phase) > 0.5);
    }
    if (density < 6200u) {
        return select(0.50, 0.85, sin(params.phase * 0.20 + twinkle_phase) > 0.3);
    }
    return 0.0;
}

fn glyph_region(glyph: Glyph, region: u32, region_count: u32) -> f32 {
    if (region_count == 1u) {
        return glyph.coverage;
    }
    if (region_count == 4u) {
        return glyph.regions2x2[region];
    }
    return glyph.regions[region];
}

fn glyph_feature_scale(region: u32, region_count: u32, use_braille: bool) -> f32 {
    if (region_count == 1u) {
        return select(params.feature_scale, params.braille_feature_scale, use_braille);
    }
    let first = select(params.feature_scales_0, params.braille_feature_scales_0, use_braille);
    if (region < 4u) {
        return first[region];
    }
    let last = select(params.feature_scales_1, params.braille_feature_scales_1, use_braille);
    return last[region - 4u];
}

@compute @workgroup_size(16, 16, 1)
fn render_ascii(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let cell_x = global_id.x;
    let cell_y = global_id.y;
    if (cell_x >= params.width || cell_y >= params.height) {
        return;
    }

    let sample_width = params.width * params.sample_columns;
    let norm_scale = max(bitcast<f32>(atomicLoad(&normalization.max_bits)), 1e-12);
    var values = array<f32, 6>();
    var disk_peak = 0.0;
    var sky_peak = 0.0;

    for (var sample_y = 0u; sample_y < params.sample_rows; sample_y++) {
        for (var sample_x = 0u; sample_x < params.sample_columns; sample_x++) {
            let region = sample_y * params.sample_columns + sample_x;
            if (region >= 6u) {
                continue;
            }
            let map_x = cell_x * params.sample_columns + sample_x;
            let map_y = cell_y * params.sample_rows + sample_y;
            let sample = sample_map[map_y * sample_width + map_x];
            var brightness = 0.0;
            if (sample.kind == 1u) {
                let appearance = disk_appearance(
                    sample.base, norm_scale, sample.a, sample.b,
                );
                var background = 0.0;
                if (sample.background_kind == 2u) {
                    background = sky_value(sample.background_a, sample.background_b);
                }
                let visible_background = (1.0 - appearance.y) * background;
                brightness = min(1.0, appearance.x + visible_background);
                disk_peak = max(disk_peak, appearance.x);
                sky_peak = max(sky_peak, visible_background);
            } else if (sample.kind == 2u) {
                brightness = sky_value(sample.a, sample.b);
                sky_peak = max(sky_peak, brightness);
            }
            values[region] = brightness;
        }
    }

    var best_error = 1e30;
    var best_codepoint = 32u;
    let region_count = params.sample_columns * params.sample_rows;
    let use_braille = (params.glyph_mode == 2u || params.glyph_mode == 3u) &&
        sky_peak > 0.0 && sky_peak > disk_peak;
    let stars_mode = params.glyph_mode == 2u || params.glyph_mode == 3u;
    let ascii_candidate_count = select(params.glyph_count, params.glyph_count - 256u, stars_mode);
    let candidate_count = select(ascii_candidate_count, 256u, use_braille);
    for (var candidate = 0u; candidate < candidate_count; candidate++) {
        var glyph_index = candidate;
        if (use_braille && candidate > 0u) {
            glyph_index = ascii_candidate_count + candidate;
        }
        let glyph = glyphs[glyph_index];
        var error = 0.0;
        for (var region = 0u; region < region_count; region++) {
            let difference = values[region] * glyph_feature_scale(region, region_count, use_braille) -
                glyph_region(glyph, region, region_count);
            error += difference * difference;
        }
        if (error < best_error) {
            best_error = error;
            best_codepoint = glyph.codepoint;
        }
    }

    output_chars[cell_y * params.width + cell_x] = best_codepoint;
}

// Utility function
fn is_finite(x: f32) -> bool {
    return !(x != x) && x < 1e30 && x > -1e30;
}

// tanh approximation
fn tanh(x: f32) -> f32 {
    let e2x = exp(2.0 * clamp(x, -20.0, 20.0));
    return (e2x - 1.0) / (e2x + 1.0);
}
