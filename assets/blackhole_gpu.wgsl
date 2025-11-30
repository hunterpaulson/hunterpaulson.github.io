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
    robs: f32,        // Observer distance from black hole
    theta_obs: f32,   // Observer inclination (from pole)
    phi_obs: f32,     // Observer azimuthal angle
    FOVx: f32,        // Horizontal field of view
    FOVy: f32,        // Vertical field of view
    roll_rad: f32,    // Camera roll
    phase: f32,       // Animation phase for disk rotation
    gamma_c: f32,     // Gamma correction
    _padding: vec2<f32>,
}

// Hit record for each pixel - what did the ray hit?
struct Hit {
    r: f32,           // Radius where disk was hit
    phi: f32,         // Azimuthal angle where disk was hit  
    g: f32,           // Relativistic Doppler factor (redshift/blueshift)
    emiss: f32,       // Emissivity at hit point
    hit: i32,         // 1 if hit disk, 0 otherwise
    bg_type: i32,     // 0=disk, 1=sky, 2=event_horizon, 3=inner_region
    theta_final: f32, // Final ray direction θ (for star field)
    phi_final: f32,   // Final ray direction φ (for star field)
}

@group(0) @binding(0) var<uniform> params: SceneParams;
@group(0) @binding(1) var<storage, read_write> hit_map: array<Hit>;
@group(0) @binding(2) var<storage, read_write> output_chars: array<u32>;

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

// Returns: (x0, v0, sky_theta, sky_phi)
// sky_theta/sky_phi = the direction on celestial sphere this pixel is looking at
fn init_ray_with_sky(px: u32, py: u32) -> array<vec4<f32>, 4> {
    // Screen coordinates to normalized device coordinates
    let u = (f32(px) + 0.5) / f32(params.width) - 0.5;
    let v = (f32(py) + 0.5) / f32(params.height) - 0.5;
    
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE SKY DIRECTION
    // ═══════════════════════════════════════════════════════════════════════
    // The camera looks toward the origin (black hole). We compute the
    // direction on the celestial sphere that this pixel corresponds to.
    //
    // The viewing direction (nr, nth, nph) in the camera's local frame
    // must be converted to global spherical coordinates (theta_sky, phi_sky).
    //
    // Since we're looking TOWARD the black hole and tracing rays BACKWARD,
    // the sky direction is approximately on the OPPOSITE side of the black hole.
    // ═══════════════════════════════════════════════════════════════════════
    
    // For a ray looking toward origin with angular offsets (nth, nph):
    // - nth > 0 means looking "up" in camera frame = toward smaller theta (north pole)
    // - nph > 0 means looking "right" in camera frame = toward larger phi
    //
    // The sky direction (for rays that don't bend much) is approximately
    // where the ray would end up on the far side of the sky.
    let view_theta_offset = atan(nth);  // Angular offset from straight ahead
    let view_phi_offset = atan(nph);
    
    // Sky is on the "far side" - we're looking through the black hole region
    // toward the opposite hemisphere of the celestial sphere
    var sky_theta = PI - params.theta_obs + view_theta_offset;
    var sky_phi = params.phi_obs + PI + view_phi_offset / max(sin(params.theta_obs), 0.1);
    
    // Normalize angles
    sky_theta = clamp(sky_theta, 0.001, PI - 0.001);
    sky_phi = (sky_phi + 100.0 * PI * 2.0) % (2.0 * PI);
    
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
    
    // Pack sky direction into vec4 (only first 2 components used)
    var sky: vec4<f32>;
    sky[0] = sky_theta;
    sky[1] = sky_phi;
    sky[2] = 0.0;
    sky[3] = 0.0;
    
    return array<vec4<f32>, 4>(x0, v0, sky, sky);  // Return 4 vec4s (last one is padding)
}

// Original function for backward compatibility
fn init_ray(px: u32, py: u32) -> array<vec4<f32>, 2> {
    let result = init_ray_with_sky(px, py);
    return array<vec4<f32>, 2>(result[0], result[1]);
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCRETION DISK APPEARANCE
// ═══════════════════════════════════════════════════════════════════════════

fn ring_mul(r: f32) -> f32 {
    let clamped = clamp(r, rin, rout);
    let s = (clamped - rin) / (rout - rin);
    let Nbands = 8.0;
    let fill_frac = 0.30;
    let edge_soft = 0.02;
    let band_floor = 0.12;
    let peak = 1.45;
    let pos = Nbands * s;
    let f = pos - floor(pos);
    let w = edge_soft + 1e-6;
    let t = 0.5 + 0.5 * tanh((fill_frac - f) / w);
    return band_floor + (peak - band_floor) * t;
}

fn hotspots_mul(r: f32, phi: f32, phase: f32) -> f32 {
    let amp = 3.0;
    let rc = 0.5 * rout;
    let Rh = 0.5 * rout;
    let edge = 0.1 * rout;
    let x_pos = r * cos(phi);
    let y_pos = r * sin(phi);
    let ang = -phase;
    let cx = rc * cos(ang);
    let cy = rc * sin(ang);
    let dx = x_pos - cx;
    let dy = y_pos - cy;
    let d = sqrt(dx * dx + dy * dy);
    let t = 0.5 + 0.5 * tanh((Rh - d) / (edge + 1e-9));
    return 1.0 + amp * t;
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
    let px = global_id.x;
    let py = global_id.y;
    
    // Bounds check
    if (px >= params.width || py >= params.height) {
        return;
    }
    
    let idx = py * params.width + px;
    
    // Initialize ray with sky direction
    let ray_data = init_ray_with_sky(px, py);
    var x = ray_data[0];
    var v = ray_data[1];
    let sky_dir = ray_data[2];  // Pre-computed sky direction for this pixel
    
    // Previous state for interpolation
    var th_prev = x[2];
    var x_prev = x;
    var v_prev = v;
    
    let h0 = 0.5;  // Base step size
    let rh = 2.0 * Mbh;  // Event horizon radius
    var rmin = x[1];
    
    var H: Hit;
    H.hit = 0;
    H.bg_type = 0;
    H.r = 0.0;
    H.phi = 0.0;
    H.g = 0.0;
    H.emiss = 0.0;
    H.theta_final = 0.0;
    H.phi_final = 0.0;
    
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
            H.bg_type = 2;  // Event horizon
            hit_map[idx] = H;
            return;
        }
        
        // Check if ray escaped to infinity
        if (x[1] > 1.2 * params.robs && step > 10) {
            // ═══════════════════════════════════════════════════════════════════
            // SKY DIRECTION FOR STAR FIELD
            // ═══════════════════════════════════════════════════════════════════
            // Use the pre-computed sky direction based on camera viewing angle.
            // This ensures stars move when the camera rotates!
            //
            // For gravitational lensing near the black hole, we could add
            // corrections based on how much the ray was bent (rmin), but for
            // now we use the "flat space" approximation for simplicity.
            // ═══════════════════════════════════════════════════════════════════
            
            H.theta_final = sky_dir[0];
            H.phi_final = sky_dir[1];
            
            if (rmin < 3.0 * Mbh) {
                H.bg_type = 2;  // Passed very close - event horizon background
            } else if (rmin < rin) {
                H.bg_type = 3;  // Passed through inner region
            } else {
                H.bg_type = 1;  // Normal sky
            }
            hit_map[idx] = H;
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // DISK CROSSING DETECTION
        // ═══════════════════════════════════════════════════════════════════
        // The disk lies in the equatorial plane (θ = π/2).
        // We detect when the ray crosses this plane by checking sign change.
        // ═══════════════════════════════════════════════════════════════════
        
        if ((th_prev - PI / 2.0) * (x[2] - PI / 2.0) <= 0.0) {
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
                
                H.hit = 1;
                H.bg_type = 0;
                H.r = rhit;
                H.phi = (phit + 1000.0 * PI * 2.0) % (2.0 * PI);
                H.g = max(g, 0.0);
                H.emiss = pow(rhit, -emiss_p);
                hit_map[idx] = H;
                return;
            }
        }
        
        // Save state for next iteration
        th_prev = x[2];
        x_prev = x;
        v_prev = v;
    }
    
    // Ray didn't hit anything within step limit
    // Use pre-computed sky direction
    H.theta_final = sky_dir[0];
    H.phi_final = sky_dir[1];
    
    if (rmin < 3.0 * Mbh) {
        H.bg_type = 2;
    } else if (rmin < rin) {
        H.bg_type = 3;
    } else {
        H.bg_type = 1;
    }
    hit_map[idx] = H;
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

// Original pixel hash (kept for compatibility)
fn hash(x: i32, y: i32) -> u32 {
    var h = 1469598103u;
    h ^= u32(x) * 374761393u + u32(y) * 668265263u;
    h *= 16777619u;
    return h;
}

@compute @workgroup_size(16, 16, 1)
fn render_ascii(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let px = global_id.x;
    let py = global_id.y;
    
    if (px >= params.width || py >= params.height) {
        return;
    }
    
    let idx = py * params.width + px;
    let hit = hit_map[idx];
    
    // ASCII luminance ramp: " `,-:'_;~/\\^\"<>!=()?{}|[]#%$&@"
    // We'll encode this as indices 0-29
    let ramp_len = 30u;
    
    var char_code: u32 = 32u;  // space
    
    if (hit.hit == 1) {
        // Disk pixel - compute brightness
        let g3 = pow(hit.g, 3.0);
        let base = hit.emiss * g3 * ring_mul(hit.r);
        let val = base * hotspots_mul(hit.r, hit.phi, params.phase);
        
        // Normalize and apply gamma
        let v = clamp(val * 2.0, 0.0, 1.0);  // normalization factor
        let q = pow(v, params.gamma_c);
        let idx_ramp = u32(q * f32(ramp_len - 1u));
        
        // Map to ASCII character
        // " `,-:'_;~/\\^\"<>!=()?{}|[]#%$&@"
        let ramp = array<u32, 30>(
            32u, 96u, 44u, 45u, 58u, 39u, 95u, 59u, 126u, 47u,
            92u, 94u, 34u, 60u, 62u, 33u, 61u, 40u, 41u, 63u,
            123u, 125u, 124u, 91u, 93u, 35u, 37u, 36u, 38u, 64u
        );
        char_code = ramp[min(idx_ramp, 29u)];
    } else if (hit.bg_type == 2 || hit.bg_type == 3) {
        // Event horizon or inner region - black
        char_code = 32u;  // space
    } else {
        // ═══════════════════════════════════════════════════════════════════
        // SKY BACKGROUND - GRAVITATIONALLY LENSED STAR FIELD
        // ═══════════════════════════════════════════════════════════════════
        // Stars are generated based on the ray's final direction (θ, φ),
        // NOT the pixel position. This means:
        //   - Stars move when you change incline/roll
        //   - Stars near the black hole appear distorted/displaced
        //   - The Einstein ring effect is visible!
        // ═══════════════════════════════════════════════════════════════════
        
        let h = hash_sky(hit.theta_final, hit.phi_final);
        let r = h & 0xffffu;
        
        // Use a secondary hash for star properties (brightness, twinkle phase)
        let h2 = h >> 16u;
        
        // ═══════════════════════════════════════════════════════════════════
        // STAR DENSITY AND TWINKLE SETTINGS
        // ═══════════════════════════════════════════════════════════════════
        // Thresholds control star density (lower = fewer stars):
        //   - r ranges from 0 to 65535 (16-bit hash)
        //   - Each threshold defines cumulative probability
        // Twinkle speed multipliers (lower = slower twinkle):
        //   - These multiply the animation phase
        //   - At phase speed 0.15 rad/s, multiplier 0.15 = ~42 sec twinkle cycle
        // ═══════════════════════════════════════════════════════════════════
        
        if (r < 4000u) {
            // Dim stars (~6% of sky) - small dots, no twinkle
            char_code = 46u;  // '.'
        } else if (r < 5500u) {
            // Medium stars (~2.3% of sky) - slow gentle twinkle
            let twinkle_phase = f32(h2 & 1023u) * (2.0 * PI / 1024.0);
            let tw = sin(params.phase * 0.15 + twinkle_phase);  // Very slow twinkle
            char_code = select(46u, 43u, tw > 0.5);  // '.' or '+'
        } else if (r < 6200u) {
            // Bright stars (~1.1% of sky) - slightly faster twinkle
            let twinkle_phase = f32(h2 & 1023u) * (2.0 * PI / 1024.0);
            let tw = sin(params.phase * 0.20 + twinkle_phase);  // Slow twinkle
            char_code = select(43u, 42u, tw > 0.3);  // '+' or '*'
        } else if (r < 6400u) {
            // Very bright stars (~0.3% of sky) - always *
            char_code = 42u;  // '*'
        } else {
            // Empty sky (~90% of sky)
            char_code = 32u;  // space
        }
    }
    
    output_chars[idx] = char_code;
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

