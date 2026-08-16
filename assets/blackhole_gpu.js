/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  BLACK HOLE GPU RAYTRACER                                                ║
 * ║  WebGPU runtime for real-time geodesic raytracing                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * This module provides a drop-in replacement for the WASM-based black hole
 * renderer, but runs on the GPU for massive parallelism.
 * 
 * Key Concepts:
 * - Compute Shaders: GPU programs that run arbitrary parallel computations
 * - Workgroups: Batches of threads that execute together (16x16 = 256 threads)
 * - Buffers: GPU memory for passing data between CPU and GPU
 * - Bind Groups: Collections of resources (buffers, textures) for a shader
 */

import { codepointsToFrame } from "../src/art/blackhole_runtime.mjs";

export const SAMPLE_BYTES = 80;

// Check WebGPU support
export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * BlackHoleGPU - Main class for GPU-accelerated black hole rendering
 */
export function selectGlyphs(catalog, glyphSet) {
  if (glyphSet === "contour-stars") {
    const contourCodepoints = new Set(catalog.sets.contourAscii);
    return catalog.glyphs.filter(({ codepoint, family }) =>
      family === "braille" || contourCodepoints.has(codepoint));
  }
  return glyphSet === "ascii-braille" || glyphSet === "braille-stars"
    ? catalog.glyphs
    : catalog.glyphs.filter(({ family }) => family === "ascii");
}

export function packGlyphs(glyphs) {
  const bytesPerGlyph = 48;
  const data = new ArrayBuffer(glyphs.length * bytesPerGlyph);
  const view = new DataView(data);
  for (let glyphIndex = 0; glyphIndex < glyphs.length; glyphIndex += 1) {
    const glyph = glyphs[glyphIndex];
    const offset = glyphIndex * bytesPerGlyph;
    for (let region = 0; region < 6; region += 1) {
      view.setFloat32(offset + region * 4, glyph.regions[region], true);
    }
    for (let region = 0; region < 4; region += 1) {
      view.setFloat32(offset + 24 + region * 4, glyph.regions2x2[region], true);
    }
    view.setFloat32(offset + 40, glyph.coverage, true);
    view.setUint32(offset + 44, glyph.codepoint, true);
  }
  return data;
}

export class BlackHoleGPU {
  constructor() {
    this.device = null;
    this.adapter = null;
    this.tracePipeline = null;
    this.renderPipeline = null;
    this.paramsBuffer = null;
    this.hitMapBuffer = null;
    this.outputBuffer = null;
    this.readbackBuffer = null;
    this.glyphBuffer = null;
    this.normalizationBuffer = null;
    this.bindGroup = null;
    
    this.width = 80;
    this.height = 52;
    this.needsRetrace = true;
    this.sampleColumns = 2;
    this.sampleRows = 3;
    this.glyphs = [];
    this.featureScale = 1;
    this.brailleFeatureScale = 1;
    this.featureScales = [1, 1, 1, 1, 1, 1];
    this.brailleFeatureScales = [1, 1, 1, 1, 1, 1];
    this.glyphMode = 0;
    
    // Default parameters
    this.params = {
      robs: 80.0,
      inc_deg: 2.0,
      roll_deg: 0.0,
      phi_obs: 0.0,
      FOVx_deg: 60.0,
      gamma_c: 0.25,
      phase: 0.0,
      ring_count: 5.0,
      ring_fill: 0.60,
      ring_edge: 0.04,
      ring_floor: 0.0,
      ring_irregularity: 0.65,
    };
  }

  /**
   * Initialize WebGPU
   * 
   * WebGPU initialization flow:
   * 1. Request adapter (physical GPU)
   * 2. Request device (logical GPU connection)
   * 3. Load and compile shaders
   * 4. Create compute pipelines
   * 5. Allocate GPU buffers
   */
  async init(
    width,
    height,
    inc_deg,
    fovx_deg,
    robs,
    roll_deg,
    glyphSet = "braille-stars",
    sampleCount = 6,
    ringProfile = {},
  ) {
    if (!isWebGPUSupported()) {
      throw new Error('WebGPU is not supported in this browser');
    }

    this.width = width;
    this.height = height;
    this.params.inc_deg = inc_deg;
    this.params.FOVx_deg = fovx_deg;
    this.params.robs = robs;
    this.params.roll_deg = roll_deg;
    Object.assign(this.params, ringProfile);
    this.sampleColumns = sampleCount === 1 ? 1 : 2;
    this.sampleRows = sampleCount === 1 ? 1 : (sampleCount === 4 ? 2 : 3);

    const glyphCatalogUrl = new URL('./blackhole_glyphs.json', import.meta.url);
    const glyphCatalog = await fetch(glyphCatalogUrl).then((response) => {
      if (!response.ok) {
        throw new Error(`failed to load glyph catalog (${response.status})`);
      }
      return response.json();
    });
    this.glyphs = selectGlyphs(glyphCatalog, glyphSet);
    const featureKey = sampleCount === 1
      ? "scalar"
      : sampleCount === 4 ? "regions2x2" : "regions2x3";
    this.featureScale = glyphSet === "ascii-braille"
      ? glyphCatalog.maxFeature.asciiBraille[featureKey]
      : glyphCatalog.maxFeature.ascii[featureKey];
    this.brailleFeatureScale = glyphCatalog.maxFeature.braille[featureKey];
    const featureFamily = glyphSet === "ascii-braille" ? "asciiBraille" : "ascii";
    const regionScales = (family) => sampleCount === 1
      ? Array(6).fill(glyphCatalog.maxFeature[family].scalar)
      : sampleCount === 4
        ? [...glyphCatalog.maxFeatureByRegion[family].regions2x2, 0, 0]
        : glyphCatalog.maxFeatureByRegion[family].regions2x3;
    this.featureScales = regionScales(featureFamily);
    this.brailleFeatureScales = regionScales("braille");
    this.glyphMode = glyphSet === "ascii-braille"
      ? 1
      : glyphSet === "braille-stars" ? 2
      : glyphSet === "contour-stars" ? 3 : 0;

    // Step 1: Get GPU adapter
    // The adapter represents a physical GPU in the system
    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'  // Request discrete GPU if available
    });
    
    if (!this.adapter) {
      throw new Error('Failed to get GPU adapter');
    }

    // Step 2: Get logical device
    // The device is our connection to the GPU - we use it for all operations
    this.device = await this.adapter.requestDevice({
      requiredLimits: {
        maxComputeWorkgroupSizeX: 16,
        maxComputeWorkgroupSizeY: 16,
      }
    });

    // Handle device loss (e.g., GPU reset, driver crash)
    this.device.lost.then((info) => {
      console.error('WebGPU device was lost:', info.message);
    });

    // Step 3: Load shader code
    const shaderUrl = new URL('./blackhole_gpu.wgsl', import.meta.url);
    const shaderCode = await fetch(shaderUrl).then(r => r.text());
    
    // Create shader module
    // WebGPU compiles WGSL (WebGPU Shading Language) to native GPU code
    const shaderModule = this.device.createShaderModule({
      label: 'Black Hole Raytracer',
      code: shaderCode,
    });

    // Check for compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    for (const message of compilationInfo.messages) {
      if (message.type === 'error') {
        throw new Error(`Shader compilation error: ${message.message}`);
      }
      console.warn('Shader warning:', message.message);
    }

    // Step 4: Create compute pipelines with auto layout
    // WebGPU will automatically create bind group layouts based on shader usage
    // We use 'auto' layout and then get the bind group layout from each pipeline
    
    // Pipeline for raytracing (traces all rays through spacetime)
    // Uses bindings 0 (params) and 1 (hit_map)
    this.tracePipeline = this.device.createComputePipeline({
      label: 'Trace Rays Pipeline',
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'trace_rays',
      },
    });

    // Pipeline for glyph rendering (converts samples to codepoints).
    this.renderPipeline = this.device.createComputePipeline({
      label: 'Render ASCII Pipeline',
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'render_ascii',
      },
    });

    // Step 5: Create GPU buffers
    await this._createBuffers();

    this.needsRetrace = true;
    return 0;  // Success
  }

  /**
   * Create GPU buffers for passing data
   * 
   * Buffer types:
   * - UNIFORM: Small, read-only data that's the same for all threads
   * - STORAGE: Larger data that can be read/written by compute shaders
   * - MAP_READ: Can be read back to CPU (for getting results)
   */
  async _createBuffers() {
    const pixelCount = this.width * this.height;
    const sampleCount = pixelCount * this.sampleColumns * this.sampleRows;

    // Uniform buffer for logical dimensions, sample lattice, scene, and glyph set.
    this.paramsBuffer = this.device.createBuffer({
      label: 'Scene Parameters',
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Each sub-cell ray stores its ordered disk crossings and terminal sky/horizon.
    this.hitMapBuffer = this.device.createBuffer({
      label: 'Sample Map',
      size: sampleCount * SAMPLE_BYTES,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    this.glyphBuffer = this.device.createBuffer({
      label: 'Glyph Features',
      size: this.glyphs.length * 48,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.glyphBuffer, 0, packGlyphs(this.glyphs));

    this.normalizationBuffer = this.device.createBuffer({
      label: 'Disk Normalization',
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Storage buffer for output characters (4 bytes per pixel for u32)
    this.outputBuffer = this.device.createBuffer({
      label: 'ASCII Output',
      size: pixelCount * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Staging buffer for reading results back to CPU
    // MAP_READ buffers can't be used directly in shaders, so we copy to them
    this.readbackBuffer = this.device.createBuffer({
      label: 'Readback Buffer',
      size: pixelCount * 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Each pipeline with 'auto' layout infers its bind group layout from 
    // which bindings the entry point ACTUALLY USES.
    // The trace pipeline also updates the positive-f32 maximum atomically.
    
    // Bind group for trace pipeline (only bindings 0 and 1)
    this.traceBindGroup = this.device.createBindGroup({
      label: 'Trace Bind Group',
      layout: this.tracePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: { buffer: this.hitMapBuffer } },
        { binding: 4, resource: { buffer: this.normalizationBuffer } },
      ],
    });

    // Bind group for the render pipeline.
    this.renderBindGroup = this.device.createBindGroup({
      label: 'Render Bind Group',
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: { buffer: this.hitMapBuffer } },
        { binding: 2, resource: { buffer: this.outputBuffer } },
        { binding: 3, resource: { buffer: this.glyphBuffer } },
        { binding: 4, resource: { buffer: this.normalizationBuffer } },
      ],
    });
  }

  /**
   * Update scene parameters and upload to GPU
   */
  updateParams(overrides = {}) {
    Object.assign(this.params, overrides);

    // Check if we need to retrace (geometry changed)
    if ('robs' in overrides || 'inc_deg' in overrides ||
        'roll_deg' in overrides || 'FOVx_deg' in overrides ||
        'ring_count' in overrides || 'ring_fill' in overrides ||
        'ring_edge' in overrides || 'ring_floor' in overrides ||
        'ring_irregularity' in overrides) {
      this.needsRetrace = true;
    }

    // Convert degrees to radians and compute derived values
    const theta_obs = Math.PI / 2.0 - (this.params.inc_deg * Math.PI / 180.0);
    const FOVx = this.params.FOVx_deg * Math.PI / 180.0;
    const FOVy = FOVx * (this.height / this.width);
    const roll_rad = this.params.roll_deg * Math.PI / 180.0;

    // Pack parameters into ArrayBuffer
    // Must match the struct layout in WGSL exactly!
    const data = new ArrayBuffer(144);
    const view = new DataView(data);
    
    view.setUint32(0, this.width, true);          // width
    view.setUint32(4, this.height, true);         // height
    view.setUint32(8, this.sampleColumns, true);
    view.setUint32(12, this.sampleRows, true);
    view.setFloat32(16, this.params.robs, true);
    view.setFloat32(20, theta_obs, true);
    view.setFloat32(24, this.params.phi_obs, true);
    view.setFloat32(28, FOVx, true);
    view.setFloat32(32, FOVy, true);
    view.setFloat32(36, roll_rad, true);
    view.setFloat32(40, this.params.phase, true);
    view.setFloat32(44, this.params.gamma_c, true);
    view.setUint32(48, this.glyphs.length, true);
    view.setFloat32(52, this.featureScale, true);
    view.setUint32(56, this.glyphMode, true);
    view.setFloat32(60, this.brailleFeatureScale, true);
    view.setFloat32(64, this.params.ring_count, true);
    view.setFloat32(68, this.params.ring_fill, true);
    view.setFloat32(72, this.params.ring_edge, true);
    view.setFloat32(76, this.params.ring_floor, true);
    for (let region = 0; region < 4; region += 1) {
      view.setFloat32(80 + region * 4, this.featureScales[region], true);
      view.setFloat32(112 + region * 4, this.brailleFeatureScales[region], true);
    }
    for (let region = 4; region < 6; region += 1) {
      view.setFloat32(96 + (region - 4) * 4, this.featureScales[region], true);
      view.setFloat32(128 + (region - 4) * 4, this.brailleFeatureScales[region], true);
    }
    view.setFloat32(136, this.params.ring_irregularity, true);

    // Upload to GPU
    // writeBuffer is synchronous - data is copied immediately
    this.device.queue.writeBuffer(this.paramsBuffer, 0, data);
  }

  /**
   * Run the raytracing compute shader
   * 
   * This traces every sub-cell ray in parallel on a 16x16 workgroup grid.
   */
  async traceRays() {
    this.device.queue.writeBuffer(this.normalizationBuffer, 0, new Uint32Array([0]));
    // Command encoder records GPU commands for later execution
    const encoder = this.device.createCommandEncoder({
      label: 'Trace Command Encoder',
    });

    // Begin compute pass
    const pass = encoder.beginComputePass({
      label: 'Trace Compute Pass',
    });

    pass.setPipeline(this.tracePipeline);
    pass.setBindGroup(0, this.traceBindGroup);
    
    // Dispatch workgroups
    // Each workgroup is 16x16 threads, so we need ceil(width/16) x ceil(height/16)
    const workgroupsX = Math.ceil((this.width * this.sampleColumns) / 16);
    const workgroupsY = Math.ceil((this.height * this.sampleRows) / 16);
    pass.dispatchWorkgroups(workgroupsX, workgroupsY, 1);
    
    pass.end();

    // Submit commands to GPU
    // This is asynchronous - commands are queued for execution
    this.device.queue.submit([encoder.finish()]);

    // Wait for GPU to finish
    await this.device.queue.onSubmittedWorkDone();
    
    this.needsRetrace = false;
  }

  /**
   * Render hit map to ASCII characters
   */
  async renderASCII() {
    const encoder = this.device.createCommandEncoder({
      label: 'Render Command Encoder',
    });

    const pass = encoder.beginComputePass({
      label: 'Render Compute Pass',
    });

    pass.setPipeline(this.renderPipeline);
    pass.setBindGroup(0, this.renderBindGroup);
    
    const workgroupsX = Math.ceil(this.width / 16);
    const workgroupsY = Math.ceil(this.height / 16);
    pass.dispatchWorkgroups(workgroupsX, workgroupsY, 1);
    
    pass.end();

    // Copy output to readback buffer for CPU access
    encoder.copyBufferToBuffer(
      this.outputBuffer, 0,
      this.readbackBuffer, 0,
      this.width * this.height * 4
    );

    this.device.queue.submit([encoder.finish()]);
  }

  /**
   * Read the rendered ASCII frame back to CPU
   * 
   * We transfer one u32 codepoint per cell. Keeping four bytes avoids packed
   * storage writes and supports Unicode Braille without a second lookup. The
   * mapAsync call is also the synchronization boundary for each frame.
   */
  async readFrame() {
    // Wait for GPU work to complete
    await this.device.queue.onSubmittedWorkDone();

    // Map buffer for reading
    // This makes the GPU memory accessible to JavaScript
    await this.readbackBuffer.mapAsync(GPUMapMode.READ);
    
    // Get a view of the mapped memory
    const data = new Uint32Array(this.readbackBuffer.getMappedRange());
    
    const output = codepointsToFrame(data, this.width, this.height);
    
    // Unmap buffer (required before next GPU operation)
    this.readbackBuffer.unmap();
    
    return output;
  }

  /**
   * Generate a complete frame
   * 
   * This is the main entry point, called every animation frame.
   */
  async generateFrame(phase) {
    this.updateParams({ phase });
    
    // Only retrace if geometry changed
    if (this.needsRetrace) {
      await this.traceRays();
    }
    
    await this.renderASCII();
    return await this.readFrame();
  }

  /**
   * Update scene parameters (for slider changes)
   */
  async updateScene(inc_deg, robs, roll_deg) {
    this.updateParams({ inc_deg, robs, roll_deg });
  }

  /**
   * Cleanup GPU resources
   */
  destroy() {
    if (this.paramsBuffer) this.paramsBuffer.destroy();
    if (this.hitMapBuffer) this.hitMapBuffer.destroy();
    if (this.outputBuffer) this.outputBuffer.destroy();
    if (this.readbackBuffer) this.readbackBuffer.destroy();
    if (this.glyphBuffer) this.glyphBuffer.destroy();
    if (this.normalizationBuffer) this.normalizationBuffer.destroy();
    this.device = null;
    this.adapter = null;
  }

  // Getter for dimensions (compatibility with WASM API)
  getWidth() { return this.width; }
  getHeight() { return this.height; }
}

// Factory function for easy instantiation
export async function createBlackHoleGPU(
  width,
  height,
  inc_deg,
  fovx_deg,
  robs,
  roll_deg,
  glyphSet,
  sampleCount,
  ringProfile,
) {
  const bh = new BlackHoleGPU();
  await bh.init(
    width,
    height,
    inc_deg,
    fovx_deg,
    robs,
    roll_deg,
    glyphSet,
    sampleCount,
    ringProfile,
  );
  return bh;
}

// Default export
export default { isWebGPUSupported, BlackHoleGPU, createBlackHoleGPU };
