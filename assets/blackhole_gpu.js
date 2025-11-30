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

// Check WebGPU support
export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * BlackHoleGPU - Main class for GPU-accelerated black hole rendering
 */
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
    this.bindGroup = null;
    
    this.width = 80;
    this.height = 52;
    this.needsRetrace = true;
    
    // Default parameters
    this.params = {
      robs: 39.0,
      inc_deg: 10.0,
      roll_deg: 0.0,
      phi_obs: 0.0,
      FOVx_deg: 60.0,
      gamma_c: 0.30,
      phase: 0.0,
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
  async init(width, height, inc_deg, fovx_deg, robs, roll_deg) {
    if (!isWebGPUSupported()) {
      throw new Error('WebGPU is not supported in this browser');
    }

    this.width = width;
    this.height = height;
    this.params.inc_deg = inc_deg;
    this.params.FOVx_deg = fovx_deg;
    this.params.robs = robs;
    this.params.roll_deg = roll_deg;

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

    // Pipeline for ASCII rendering (converts hit data to characters)
    // Uses bindings 0 (params), 1 (hit_map), and 2 (output_chars)
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

    // Uniform buffer for scene parameters (48 bytes, aligned to 16)
    // Layout: width(4) + height(4) + robs(4) + theta_obs(4) + 
    //         phi_obs(4) + FOVx(4) + FOVy(4) + roll_rad(4) +
    //         phase(4) + gamma_c(4) + padding(8) = 48 bytes
    this.paramsBuffer = this.device.createBuffer({
      label: 'Scene Parameters',
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Storage buffer for hit map (32 bytes per pixel)
    // Layout: r(4) + phi(4) + g(4) + emiss(4) + hit(4) + bg_type(4) + pad(8) = 32
    this.hitMapBuffer = this.device.createBuffer({
      label: 'Hit Map',
      size: pixelCount * 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
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
    // - trace_rays uses: params (0), hit_map (1) 
    // - render_ascii uses: params (0), hit_map (1), output_chars (2)
    
    // Bind group for trace pipeline (only bindings 0 and 1)
    this.traceBindGroup = this.device.createBindGroup({
      label: 'Trace Bind Group',
      layout: this.tracePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: { buffer: this.hitMapBuffer } },
      ],
    });

    // Bind group for render pipeline (all 3 bindings)
    this.renderBindGroup = this.device.createBindGroup({
      label: 'Render Bind Group',
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: { buffer: this.hitMapBuffer } },
        { binding: 2, resource: { buffer: this.outputBuffer } },
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
        'roll_deg' in overrides || 'FOVx_deg' in overrides) {
      this.needsRetrace = true;
    }

    // Convert degrees to radians and compute derived values
    const theta_obs = Math.PI / 2.0 - (this.params.inc_deg * Math.PI / 180.0);
    const FOVx = this.params.FOVx_deg * Math.PI / 180.0;
    const FOVy = FOVx * (this.height / this.width);
    const roll_rad = this.params.roll_deg * Math.PI / 180.0;

    // Pack parameters into ArrayBuffer
    // Must match the struct layout in WGSL exactly!
    const data = new ArrayBuffer(48);
    const view = new DataView(data);
    
    view.setUint32(0, this.width, true);          // width
    view.setUint32(4, this.height, true);         // height
    view.setFloat32(8, this.params.robs, true);   // robs
    view.setFloat32(12, theta_obs, true);         // theta_obs
    view.setFloat32(16, this.params.phi_obs, true); // phi_obs
    view.setFloat32(20, FOVx, true);              // FOVx
    view.setFloat32(24, FOVy, true);              // FOVy
    view.setFloat32(28, roll_rad, true);          // roll_rad
    view.setFloat32(32, this.params.phase, true); // phase
    view.setFloat32(36, this.params.gamma_c, true); // gamma_c
    // 40-47: padding

    // Upload to GPU
    // writeBuffer is synchronous - data is copied immediately
    this.device.queue.writeBuffer(this.paramsBuffer, 0, data);
  }

  /**
   * Run the raytracing compute shader
   * 
   * This traces ALL rays in parallel. With 80x52 = 4160 pixels and
   * 16x16 = 256 threads per workgroup, we dispatch 5x4 = 20 workgroups.
   */
  async traceRays() {
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
    const workgroupsX = Math.ceil(this.width / 16);
    const workgroupsY = Math.ceil(this.height / 16);
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
   * GPU->CPU data transfer is slow, so this is the bottleneck.
   * We minimize it by only transferring the final characters (1 byte per pixel)
   * rather than the full hit data (32 bytes per pixel).
   */
  async readFrame() {
    // Wait for GPU work to complete
    await this.device.queue.onSubmittedWorkDone();

    // Map buffer for reading
    // This makes the GPU memory accessible to JavaScript
    await this.readbackBuffer.mapAsync(GPUMapMode.READ);
    
    // Get a view of the mapped memory
    const data = new Uint32Array(this.readbackBuffer.getMappedRange());
    
    // Convert to string
    let output = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const charCode = data[y * this.width + x];
        output += String.fromCharCode(charCode);
      }
      if (y < this.height - 1) {
        output += '\n';
      }
    }
    
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
    this.device = null;
    this.adapter = null;
  }

  // Getter for dimensions (compatibility with WASM API)
  getWidth() { return this.width; }
  getHeight() { return this.height; }
}

// Factory function for easy instantiation
export async function createBlackHoleGPU(width, height, inc_deg, fovx_deg, robs, roll_deg) {
  const bh = new BlackHoleGPU();
  await bh.init(width, height, inc_deg, fovx_deg, robs, roll_deg);
  return bh;
}

// Default export
export default { isWebGPUSupported, BlackHoleGPU, createBlackHoleGPU };
