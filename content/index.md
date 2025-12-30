---
title: computer scientist
lang: en
---

hello guild navigator, welcome to my light cone.

if you have made it here, feel free to take a look around and reach out.

<pre id="bh" aria-label="blackhole ascii">loading…</pre>
<pre id="bh-status" aria-label="renderer status" style="text-align:right;margin:0"></pre>
<label id="bh-vsync-label" style="display:block;margin:0.5em 0"><input type="checkbox" id="bh-vsync" checked /> vsync</label>
<!-- TODO: Uncomment for testing WASM
<label id="bh-webgpu-label" style="display:block;margin:0.5em 0"><input type="checkbox" id="bh-webgpu" checked /> webgpu</label>
-->
<pre id="bh-sliders" aria-label="blackhole controls">loading controls…</pre>
<script type="module">
/**
 * Black Hole Renderer - WebGPU with WASM Fallback
 * 
 * This script tries WebGPU first for real-time parameter updates,
 * falling back to WASM for broader browser support.
 */
(async function(){
  const pre = document.getElementById('bh');
  const slidersPre = document.getElementById('bh-sliders');
  const statusPre = document.getElementById('bh-status');
  if(!pre || !slidersPre){ return; }

  const width = 80;
  const height = 40;
  const fps = 30;
  
  // Animation speed (radians per second) - TIME-BASED, not frame-based!
  // One full rotation = 2π radians. At 0.15 rad/sec, full rotation takes ~42 seconds
  const DISK_ROTATION_SPEED = 1;  // radians per second
  
  let sliderColumns = width;
  let trackLen = sliderColumns;
  const defaultFov = 60;
  
  const sliderDefs = [
    { key: 'distance', label: 'distance', min: 11, max: 140, step: 1, unit: '', showValue: false },
    { key: 'incline', label: 'incline', min: -45, max: 45, step: 1, unit: '°' },
    { key: 'roll', label: 'roll', min: -90, max: 90, step: 1, unit: '°' },
  ];
  const sliderState = {
    distance: 39,
    incline: 10,
    roll: 0,
  };

  slidersPre.setAttribute('tabindex', '0');

  // Renderer state
  let renderer = null;  // WebGPU or WASM renderer
  let useGPU = false;
  let animationTimer = null;
  let animationStartTime = performance.now();  // For time-based animation
  let rebuildTimeout = null;
  let metrics = null;
  let lastSliderState = { ...sliderState };
  let frameCount = 0;
  let lastFpsTime = performance.now();
  let currentFps = 0;

  // Rolling 5-second window for min/max FPS
  const FPS_WINDOW_SIZE = 5;
  let fpsHistory = [];  // Circular buffer of last 5 FPS samples

  // Vsync state
  let vsyncEnabled = true;
  let isDragging = false;
  const vsyncCheckbox = document.getElementById('bh-vsync');

  // Renderer toggle (for testing - TODO: uncomment for testing WASM)
  // const webgpuCheckbox = document.getElementById('bh-webgpu');
  let gpuRunning = false;  // Track if GPU loop is running

  function updateStatus(msg) {
    if(statusPre){ statusPre.textContent = msg; }
  }

  function centerIfOverflow(){
    const overflow = pre.scrollWidth - pre.clientWidth;
    if(overflow > 0){ pre.scrollLeft = overflow / 2; }
  }

  function roundToStep(value, step){
    if(!step){ return value; }
    return Math.round(value / step) * step;
  }

  function buildTrack(def){
    const value = sliderState[def.key];
    const norm = Math.min(Math.max((value - def.min) / (def.max - def.min), 0), 1);
    const handlePos = Math.round(norm * (trackLen - 1));
    const left = '─'.repeat(handlePos);
    const right = '─'.repeat(trackLen - handlePos - 1);
    return `${left}█${right}`;
  }

  function formatValue(def){
    const decimals = def.step && def.step < 1 ? 1 : 0;
    const val = sliderState[def.key].toFixed(decimals);
    return `${val}${def.unit || ''}`;
  }

  function buildHeader(def){
    const label = `${def.label}:`;
    const showValue = def.showValue !== false;
    const value = showValue ? formatValue(def) : '';
    let spaces = sliderColumns - label.length - value.length;
    if(spaces < 1){ spaces = 1; }
    let line = label + ' '.repeat(spaces) + value;
    if(line.length > sliderColumns){
      line = line.slice(0, sliderColumns);
    } else if(line.length < sliderColumns){
      line = line.padEnd(sliderColumns, ' ');
    }
    return line;
  }

  function renderSliders(){
    recomputeSliderColumns();
    const lines = [];
    sliderDefs.forEach((def) => {
      lines.push(buildHeader(def));
      lines.push(buildTrack(def));
    });
    slidersPre.textContent = lines.join('\n');
  }

  function ensureMetrics(){
    if(metrics){ return metrics; }
    const probe = document.createElement('span');
    probe.textContent = '█';
    probe.style.visibility = 'hidden';
    probe.style.position = 'absolute';
    probe.style.whiteSpace = 'pre';
    slidersPre.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    slidersPre.removeChild(probe);
    metrics = {
      charWidth: rect.width || 8,
      lineHeight: rect.height || 16,
    };
    return metrics;
  }

  function recomputeSliderColumns(){
    const m = ensureMetrics();
    const charWidth = m.charWidth || 8;
    const rectWidth = slidersPre.getBoundingClientRect().width;
    const availablePx = rectWidth || slidersPre.clientWidth || (width * charWidth);
    const availableCols = Math.round(availablePx / charWidth);
    const cols = Math.max(20, Math.min(width, availableCols || width));
    if(cols !== sliderColumns){
      sliderColumns = cols;
      trackLen = sliderColumns;
    }
  }

  function sliderInfoFromPointer(evt){
    const m = ensureMetrics();
    const rect = slidersPre.getBoundingClientRect();
    const y = evt.clientY - rect.top;
    const totalRows = sliderDefs.length * 2;
    let row = Math.floor(y / m.lineHeight);
    row = Math.max(0, Math.min(totalRows - 1, row));
    const sliderIndex = Math.floor(row / 2);
    const def = sliderDefs[sliderIndex];
    const x = evt.clientX - rect.left;
    let col = Math.floor(x / m.charWidth);
    const trackInnerStart = 0;
    const trackInnerEnd = trackInnerStart + trackLen - 1;
    if(col < trackInnerStart) col = trackInnerStart;
    if(col > trackInnerEnd) col = trackInnerEnd;
    const handlePos = col - trackInnerStart;
    return { def, handlePos, row: sliderIndex };
  }

  function sliderChanged(){
    return sliderState.distance !== lastSliderState.distance ||
           sliderState.incline !== lastSliderState.incline ||
           sliderState.roll !== lastSliderState.roll;
  }

  function scheduleSceneUpdate(){
    if(useGPU){
      // With WebGPU, update immediately - it's fast!
      if(renderer && sliderChanged()){
        renderer.updateParams({
          robs: sliderState.distance,
          inc_deg: sliderState.incline,
          roll_deg: sliderState.roll,
        });
        lastSliderState = { ...sliderState };
      }
    } else {
      // With WASM, debounce to avoid janky rebuilds
      if(rebuildTimeout){ clearTimeout(rebuildTimeout); }
      rebuildTimeout = setTimeout(() => {
        rebuildTimeout = null;
        rebuildSceneWASM().catch((err) => {
          console.error('blackhole rebuild failed', err);
          pre.textContent = 'failed to render animation';
        });
      }, 150);
    }
  }

  let lastPointerId = null;
  slidersPre.addEventListener('pointerdown', (evt) => {
    evt.preventDefault();
    lastPointerId = evt.pointerId;
    isDragging = true;
    slidersPre.setPointerCapture(evt.pointerId);
    const info = sliderInfoFromPointer(evt);
    if(!info){ return; }
    const def = info.def;
    focusedSlider = info.row;
    const raw = def.min + (info.handlePos / (trackLen - 1)) * (def.max - def.min);
    sliderState[def.key] = Math.min(def.max, Math.max(def.min, roundToStep(raw, def.step)));
    renderSliders();
    scheduleSceneUpdate();
  });

  slidersPre.addEventListener('pointermove', (evt) => {
    if(lastPointerId === null || evt.pointerId !== lastPointerId){ return; }
    evt.preventDefault();
    const info = sliderInfoFromPointer(evt);
    if(!info){ return; }
    const def = info.def;
    const raw = def.min + (info.handlePos / (trackLen - 1)) * (def.max - def.min);
    const stepped = Math.min(def.max, Math.max(def.min, roundToStep(raw, def.step)));
    if(stepped === sliderState[def.key]){ return; }
    sliderState[def.key] = stepped;
    renderSliders();
    scheduleSceneUpdate();
  });

  ['pointerup','pointercancel','lostpointercapture'].forEach((type) => {
    slidersPre.addEventListener(type, (evt) => {
      if(lastPointerId !== null && evt.pointerId === lastPointerId){
        if(type !== 'lostpointercapture' && slidersPre.hasPointerCapture(evt.pointerId)){
          slidersPre.releasePointerCapture(evt.pointerId);
        }
        lastPointerId = null;
        isDragging = false;
        // If WASM and uncapped mode, restart loop to switch from vsync back to uncapped
        if(!useGPU && !vsyncEnabled){
          startWASMLoop();
        }
      }
    });
  });

  let focusedSlider = 0;
  slidersPre.addEventListener('keydown', (evt) => {
    if(evt.key === 'ArrowUp' || evt.key === 'ArrowDown'){
      const dir = evt.key === 'ArrowUp' ? -1 : 1;
      focusedSlider = Math.max(0, Math.min(sliderDefs.length - 1, focusedSlider + dir));
      evt.preventDefault();
      return;
    }
    if(evt.key === 'ArrowLeft' || evt.key === 'ArrowRight'){
      const def = sliderDefs[focusedSlider];
      const delta = (def.step || 1) * (evt.key === 'ArrowLeft' ? -1 : 1);
      const next = Math.min(def.max, Math.max(def.min, sliderState[def.key] + delta));
      if(next !== sliderState[def.key]){
        sliderState[def.key] = next;
        renderSliders();
        scheduleSceneUpdate();
      }
      evt.preventDefault();
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // WebGPU Renderer
  // ══════════════════════════════════════════════════════════════════════════

  async function initGPU(){
    const { BlackHoleGPU, isWebGPUSupported } = await import('./assets/blackhole_gpu.js');
    
    if(!isWebGPUSupported()){
      throw new Error('WebGPU not supported');
    }
    
    const gpu = new BlackHoleGPU();
    await gpu.init(
      width, height,
      sliderState.incline,
      defaultFov,
      sliderState.distance,
      sliderState.roll
    );
    
    return gpu;
  }

  async function runTickGPU(){
    try {
      // Time-based phase: consistent speed regardless of frame rate
      const elapsed = (performance.now() - animationStartTime) / 1000;  // seconds
      const phase = (elapsed * DISK_ROTATION_SPEED) % (Math.PI * 2);
      
      const frame = await renderer.generateFrame(phase);
      pre.textContent = frame;
      centerIfOverflow();
      
      // FPS tracking with rolling 5-second min/max
      frameCount++;
      const now = performance.now();
      if(now - lastFpsTime >= 1000){
        currentFps = Math.round(frameCount * 1000 / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;

        // Update rolling window
        fpsHistory.push(currentFps);
        if(fpsHistory.length > FPS_WINDOW_SIZE){
          fpsHistory.shift();
        }

        // Calculate min/max from window
        const minFps = Math.min(...fpsHistory);
        const maxFps = Math.max(...fpsHistory);
        updateStatus(`[webgpu] fps: ${currentFps} (↓${minFps} ↑${maxFps})`);
      }
    } catch(err) {
      console.error('GPU frame failed', err);
      stopAnimation();
    }
  }

  // Schedule next frame based on vsync mode and drag state
  function scheduleNextFrame(loopFn){
    // Use vsync (rAF) when: vsync enabled OR user is dragging sliders
    if(vsyncEnabled || isDragging){
      requestAnimationFrame(loopFn);
    } else {
      setTimeout(loopFn, 0);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WASM Fallback Renderer
  // ══════════════════════════════════════════════════════════════════════════

  let wasmModule = null;
  let wasmInit = null;
  let wasmGenerate = null;
  let wasmDestroy = null;
  let wasmLoaded = false;

  async function loadWASM(){
    // Only load once - subsequent calls reuse the module
    if(wasmLoaded){ return wasmModule; }
    
    const mod = await import('./assets/blackhole_wasm.js');
    const factory = mod.default || mod;
    const instance = await factory();
    wasmModule = instance;
    wasmInit = wasmModule.cwrap('bh_wasm_init', 'number', ['number','number','number','number','number','number']);
    wasmGenerate = wasmModule.cwrap('bh_wasm_generate_frame', 'number', ['number']);
    wasmDestroy = wasmModule.cwrap('bh_wasm_destroy', 'void', []);
    wasmLoaded = true;
    return wasmModule;
  }

  function runTickWASM(){
    // Time-based phase: consistent speed regardless of frame rate
    const elapsed = (performance.now() - animationStartTime) / 1000;  // seconds
    const phase = (elapsed * DISK_ROTATION_SPEED) % (Math.PI * 2);

    const ptr = wasmGenerate(phase);
    if(!ptr){ throw new Error('bh_wasm_generate_frame returned null'); }
    pre.textContent = wasmModule.UTF8ToString(ptr);
    centerIfOverflow();

    // FPS tracking with rolling 5-second min/max
    frameCount++;
    const now = performance.now();
    if(now - lastFpsTime >= 1000){
      currentFps = Math.round(frameCount * 1000 / (now - lastFpsTime));
      frameCount = 0;
      lastFpsTime = now;

      // Update rolling window
      fpsHistory.push(currentFps);
      if(fpsHistory.length > FPS_WINDOW_SIZE){
        fpsHistory.shift();
      }

      // Calculate min/max from window
      const minFps = Math.min(...fpsHistory);
      const maxFps = Math.max(...fpsHistory);
      updateStatus(`[wasm] fps: ${currentFps} (↓${minFps} ↑${maxFps})`);
    }
  }

  async function rebuildSceneWASM(){
    // Save scroll position before any DOM changes
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    await loadWASM();
    stopAnimation();
    if(wasmDestroy){
      try{ wasmDestroy(); }catch(_){}
    }
    const status = wasmInit(
      width,
      height,
      sliderState.incline,
      defaultFov,
      sliderState.distance,
      sliderState.roll
    );
    if(status !== 0){
      throw new Error(`bh_wasm_init failed (${status})`);
    }
    lastSliderState = { ...sliderState };
    animationStartTime = performance.now();  // Reset animation

    // DON'T reset FPS counter - let rebuild time show as low FPS
    // This accurately reflects the stall during recomputation

    runTickWASM();

    // Restore scroll position after first frame renders
    window.scrollTo(scrollX, scrollY);

    startWASMLoop();
  }

  function startWASMLoop(){
    stopAnimation();

    if(vsyncEnabled || isDragging){
      // Vsync mode: fixed interval at target fps
      animationTimer = setInterval(() => {
        try{
          runTickWASM();
        }catch(err){
          console.error('animation tick failed', err);
          stopAnimation();
        }
      }, 1000 / fps);
    } else {
      // Uncapped mode: recursive setTimeout(0)
      let running = true;
      animationTimer = { stop: () => { running = false; } };

      function wasmLoop(){
        if(!running) return;
        try{
          runTickWASM();
          // Check if we should switch back to vsync mid-loop
          if(vsyncEnabled || isDragging){
            startWASMLoop();  // Restart with interval
            return;
          }
          setTimeout(wasmLoop, 0);
        }catch(err){
          console.error('animation tick failed', err);
          running = false;
        }
      }
      wasmLoop();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Main Initialization
  // ══════════════════════════════════════════════════════════════════════════

  function stopAnimation(){
    if(animationTimer){
      if(typeof animationTimer.stop === 'function'){
        animationTimer.stop();  // Custom stop for setTimeout loop
      } else {
        clearInterval(animationTimer);
      }
      animationTimer = null;
    }
  }

  window.addEventListener('resize', () => {
    recomputeSliderColumns();
    renderSliders();
    centerIfOverflow();
  });

  renderSliders();

  // Vsync toggle handler (shared)
  vsyncCheckbox.addEventListener('change', () => {
    vsyncEnabled = vsyncCheckbox.checked;
    fpsHistory = [];
    // If WASM mode, restart the loop
    if(!useGPU){
      startWASMLoop();
    }
  });

  // Start GPU renderer
  async function startGPU(){
    try {
      pre.textContent = 'initializing gpu…';
      updateStatus('[webgpu] initializing...');
      renderer = await initGPU();
      useGPU = true;
      gpuRunning = true;
      lastSliderState = { ...sliderState };
      fpsHistory = [];

      async function gpuLoop(){
        if(!gpuRunning) return;
        await runTickGPU();
        scheduleNextFrame(gpuLoop);
      }
      gpuLoop();
      return true;
    } catch(err) {
      console.warn('WebGPU not available:', err.message);
      return false;
    }
  }

  // Start WASM renderer
  async function startWASM(){
    try {
      updateStatus('[wasm] initializing...');
      useGPU = false;
      gpuRunning = false;
      fpsHistory = [];
      await rebuildSceneWASM();
      return true;
    } catch(wasmErr) {
      console.error('failed to initialize wasm blackhole', wasmErr);
      pre.textContent = 'failed to load animation';
      slidersPre.textContent = 'sliders unavailable';
      updateStatus('error: ' + wasmErr.message);
      return false;
    }
  }

  // Stop current renderer
  function stopCurrentRenderer(){
    gpuRunning = false;
    stopAnimation();
    if(renderer){
      try{ renderer.destroy(); }catch(_){}
      renderer = null;
    }
    if(wasmDestroy){
      try{ wasmDestroy(); }catch(_){}
    }
  }

  // WebGPU/WASM toggle handler (for testing - TODO: uncomment for testing WASM)
  // webgpuCheckbox.addEventListener('change', async () => {
  //   stopCurrentRenderer();
  //   if(webgpuCheckbox.checked){
  //     const success = await startGPU();
  //     if(!success){
  //       webgpuCheckbox.checked = false;
  //       await startWASM();
  //     }
  //   } else {
  //     await startWASM();
  //   }
  // });

  // Initial startup - try WebGPU first
  const gpuSuccess = await startGPU();
  if(!gpuSuccess){
    // webgpuCheckbox.checked = false;  // TODO: uncomment for testing WASM
    await startWASM();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopCurrentRenderer();
  }, { once: true });
})();
</script>
