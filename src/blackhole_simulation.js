export async function initBlackholeSimulation({
  frameId = "bh",
  statusId = "bh-status",
  slidersId = "bh-sliders",
  vsyncCheckboxId = "bh-vsync",
} = {}) {
  const frameElement = document.getElementById(frameId);
  const slidersElement = document.getElementById(slidersId);
  const statusElement = document.getElementById(statusId);
  const vsyncCheckbox = document.getElementById(vsyncCheckboxId);

  if (!frameElement || !slidersElement) {
    return () => {};
  }

  const width = 80;
  const height = 40;
  const targetFps = 30;
  const defaultFov = 60;
  const diskRotationSpeed = 1;

  let sliderColumns = width;
  let trackLength = sliderColumns;

  const sliderDefinitions = [
    { key: "distance", label: "distance", min: 11, max: 140, step: 1, unit: "", showValue: false },
    { key: "incline", label: "incline", min: -45, max: 45, step: 1, unit: "°" },
    { key: "roll", label: "roll", min: -90, max: 90, step: 1, unit: "°" },
  ];

  const sliderState = {
    distance: 39,
    incline: 10,
    roll: 0,
  };

  slidersElement.setAttribute("tabindex", "0");

  let renderer = null;
  let useGpu = false;
  let gpuRunning = false;
  let animationTimer = null;
  let animationStartTime = performance.now();
  let rebuildTimeout = null;

  let metrics = null;
  let lastSliderState = { ...sliderState };
  let focusedSlider = 0;
  let lastPointerId = null;

  let frameCount = 0;
  let lastFpsTimestamp = performance.now();
  const fpsWindowSize = 5;
  let fpsHistory = [];

  let vsyncEnabled = vsyncCheckbox ? vsyncCheckbox.checked : true;
  let isDragging = false;
  let cleanedUp = false;

  let wasmModule = null;
  let wasmInit = null;
  let wasmGenerateFrame = null;
  let wasmDestroy = null;
  let wasmLoaded = false;

  function updateStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function centerIfOverflow() {
    const overflow = frameElement.scrollWidth - frameElement.clientWidth;
    if (overflow > 0) {
      frameElement.scrollLeft = overflow / 2;
    }
  }

  function roundToStep(value, step) {
    if (!step) {
      return value;
    }

    return Math.round(value / step) * step;
  }

  function ensureMetrics() {
    if (metrics) {
      return metrics;
    }

    const probe = document.createElement("span");
    probe.textContent = "█";
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    probe.style.whiteSpace = "pre";
    slidersElement.appendChild(probe);

    const rect = probe.getBoundingClientRect();
    slidersElement.removeChild(probe);

    metrics = {
      charWidth: rect.width || 8,
      lineHeight: rect.height || 16,
    };

    return metrics;
  }

  function recomputeSliderColumns() {
    const { charWidth } = ensureMetrics();
    const rectWidth = slidersElement.getBoundingClientRect().width;
    const availablePixels = rectWidth || slidersElement.clientWidth || (width * charWidth);
    const availableColumns = Math.round(availablePixels / charWidth);
    const nextColumns = Math.max(20, Math.min(width, availableColumns || width));

    if (nextColumns !== sliderColumns) {
      sliderColumns = nextColumns;
      trackLength = sliderColumns;
    }
  }

  function buildTrack(definition) {
    const value = sliderState[definition.key];
    const normalized = Math.min(Math.max((value - definition.min) / (definition.max - definition.min), 0), 1);
    const handlePosition = Math.round(normalized * (trackLength - 1));
    const left = "─".repeat(handlePosition);
    const right = "─".repeat(trackLength - handlePosition - 1);
    return `${left}█${right}`;
  }

  function formatSliderValue(definition) {
    const decimals = definition.step && definition.step < 1 ? 1 : 0;
    const value = sliderState[definition.key].toFixed(decimals);
    return `${value}${definition.unit || ""}`;
  }

  function buildHeader(definition) {
    const label = `${definition.label}:`;
    const value = definition.showValue === false ? "" : formatSliderValue(definition);
    let spaces = sliderColumns - label.length - value.length;

    if (spaces < 1) {
      spaces = 1;
    }

    let line = `${label}${" ".repeat(spaces)}${value}`;

    if (line.length > sliderColumns) {
      line = line.slice(0, sliderColumns);
    } else if (line.length < sliderColumns) {
      line = line.padEnd(sliderColumns, " ");
    }

    return line;
  }

  function renderSliders() {
    recomputeSliderColumns();
    const lines = [];

    for (const definition of sliderDefinitions) {
      lines.push(buildHeader(definition));
      lines.push(buildTrack(definition));
    }

    slidersElement.textContent = lines.join("\n");
  }

  function sliderInfoFromPointer(event) {
    const { charWidth, lineHeight } = ensureMetrics();
    const rect = slidersElement.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const totalRows = sliderDefinitions.length * 2;
    let row = Math.floor(y / lineHeight);
    row = Math.max(0, Math.min(totalRows - 1, row));

    const sliderIndex = Math.floor(row / 2);
    const definition = sliderDefinitions[sliderIndex];
    const x = event.clientX - rect.left;
    let column = Math.floor(x / charWidth);

    if (column < 0) {
      column = 0;
    }
    if (column > trackLength - 1) {
      column = trackLength - 1;
    }

    return {
      definition,
      sliderIndex,
      handlePosition: column,
    };
  }

  function sliderValuesChanged() {
    return (
      sliderState.distance !== lastSliderState.distance ||
      sliderState.incline !== lastSliderState.incline ||
      sliderState.roll !== lastSliderState.roll
    );
  }

  function resetFpsTracking() {
    frameCount = 0;
    lastFpsTimestamp = performance.now();
    fpsHistory = [];
  }

  function recordFps(label) {
    frameCount += 1;
    const now = performance.now();

    if (now - lastFpsTimestamp < 1000) {
      return;
    }

    const currentFps = Math.round((frameCount * 1000) / (now - lastFpsTimestamp));
    frameCount = 0;
    lastFpsTimestamp = now;

    fpsHistory.push(currentFps);
    if (fpsHistory.length > fpsWindowSize) {
      fpsHistory.shift();
    }

    const minFps = Math.min(...fpsHistory);
    const maxFps = Math.max(...fpsHistory);
    updateStatus(`[${label}] fps: ${currentFps} (↓${minFps} ↑${maxFps})`);
  }

  async function initGpuRenderer() {
    const { BlackHoleGPU, isWebGPUSupported } = await import("/assets/blackhole_gpu.js");

    if (!isWebGPUSupported()) {
      throw new Error("WebGPU not supported");
    }

    const gpuRenderer = new BlackHoleGPU();
    await gpuRenderer.init(
      width,
      height,
      sliderState.incline,
      defaultFov,
      sliderState.distance,
      sliderState.roll,
    );

    return gpuRenderer;
  }

  async function runGpuTick() {
    const elapsedSeconds = (performance.now() - animationStartTime) / 1000;
    const phase = (elapsedSeconds * diskRotationSpeed) % (Math.PI * 2);
    const frame = await renderer.generateFrame(phase);

    frameElement.textContent = frame;
    centerIfOverflow();
    recordFps("webgpu");
  }

  function scheduleNextFrame(loopFunction) {
    if (vsyncEnabled || isDragging) {
      requestAnimationFrame(loopFunction);
      return;
    }

    setTimeout(loopFunction, 0);
  }

  async function loadWasmRenderer() {
    if (wasmLoaded) {
      return;
    }

    const moduleImport = await import("/assets/blackhole_wasm.js");
    const factory = moduleImport.default || moduleImport;
    wasmModule = await factory();

    wasmInit = wasmModule.cwrap(
      "bh_wasm_init",
      "number",
      ["number", "number", "number", "number", "number", "number"],
    );
    wasmGenerateFrame = wasmModule.cwrap("bh_wasm_generate_frame", "number", ["number"]);
    wasmDestroy = wasmModule.cwrap("bh_wasm_destroy", "void", []);
    wasmLoaded = true;
  }

  function runWasmTick() {
    const elapsedSeconds = (performance.now() - animationStartTime) / 1000;
    const phase = (elapsedSeconds * diskRotationSpeed) % (Math.PI * 2);
    const framePointer = wasmGenerateFrame(phase);

    if (!framePointer) {
      throw new Error("bh_wasm_generate_frame returned null");
    }

    frameElement.textContent = wasmModule.UTF8ToString(framePointer);
    centerIfOverflow();
    recordFps("wasm");
  }

  function stopAnimation() {
    if (!animationTimer) {
      return;
    }

    if (typeof animationTimer.stop === "function") {
      animationTimer.stop();
    } else {
      clearInterval(animationTimer);
    }

    animationTimer = null;
  }

  function stopCurrentRenderer() {
    gpuRunning = false;
    stopAnimation();

    if (renderer) {
      try {
        renderer.destroy();
      } catch (_error) {
      }
      renderer = null;
    }

    if (wasmDestroy) {
      try {
        wasmDestroy();
      } catch (_error) {
      }
    }
  }

  async function rebuildSceneWasm() {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    await loadWasmRenderer();
    stopAnimation();

    if (wasmDestroy) {
      try {
        wasmDestroy();
      } catch (_error) {
      }
    }

    const initStatus = wasmInit(
      width,
      height,
      sliderState.incline,
      defaultFov,
      sliderState.distance,
      sliderState.roll,
    );

    if (initStatus !== 0) {
      throw new Error(`bh_wasm_init failed (${initStatus})`);
    }

    lastSliderState = { ...sliderState };
    animationStartTime = performance.now();
    runWasmTick();
    window.scrollTo(scrollX, scrollY);
    startWasmLoop();
  }

  function startWasmLoop() {
    stopAnimation();

    if (vsyncEnabled || isDragging) {
      animationTimer = setInterval(() => {
        try {
          runWasmTick();
        } catch (error) {
          console.error("animation tick failed", error);
          stopAnimation();
        }
      }, 1000 / targetFps);
      return;
    }

    let running = true;
    animationTimer = {
      stop() {
        running = false;
      },
    };

    function wasmLoop() {
      if (!running) {
        return;
      }

      try {
        runWasmTick();
        if (vsyncEnabled || isDragging) {
          startWasmLoop();
          return;
        }
        setTimeout(wasmLoop, 0);
      } catch (error) {
        console.error("animation tick failed", error);
        running = false;
      }
    }

    wasmLoop();
  }

  function scheduleSceneUpdate() {
    if (useGpu) {
      if (renderer && sliderValuesChanged()) {
        renderer.updateParams({
          robs: sliderState.distance,
          inc_deg: sliderState.incline,
          roll_deg: sliderState.roll,
        });
        lastSliderState = { ...sliderState };
      }
      return;
    }

    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
    }

    rebuildTimeout = setTimeout(() => {
      rebuildTimeout = null;
      rebuildSceneWasm().catch((error) => {
        console.error("blackhole rebuild failed", error);
        frameElement.textContent = "failed to render animation";
      });
    }, 150);
  }

  function onPointerDown(event) {
    event.preventDefault();
    lastPointerId = event.pointerId;
    isDragging = true;
    slidersElement.setPointerCapture(event.pointerId);

    const info = sliderInfoFromPointer(event);
    focusedSlider = info.sliderIndex;

    const rawValue = info.definition.min + (info.handlePosition / (trackLength - 1)) * (info.definition.max - info.definition.min);
    sliderState[info.definition.key] = Math.min(
      info.definition.max,
      Math.max(info.definition.min, roundToStep(rawValue, info.definition.step)),
    );

    renderSliders();
    scheduleSceneUpdate();
  }

  function onPointerMove(event) {
    if (lastPointerId === null || event.pointerId !== lastPointerId) {
      return;
    }

    event.preventDefault();

    const info = sliderInfoFromPointer(event);
    const rawValue = info.definition.min + (info.handlePosition / (trackLength - 1)) * (info.definition.max - info.definition.min);
    const nextValue = Math.min(
      info.definition.max,
      Math.max(info.definition.min, roundToStep(rawValue, info.definition.step)),
    );

    if (nextValue === sliderState[info.definition.key]) {
      return;
    }

    sliderState[info.definition.key] = nextValue;
    renderSliders();
    scheduleSceneUpdate();
  }

  function onPointerEnd(event) {
    if (lastPointerId === null || event.pointerId !== lastPointerId) {
      return;
    }

    if (event.type !== "lostpointercapture" && slidersElement.hasPointerCapture(event.pointerId)) {
      slidersElement.releasePointerCapture(event.pointerId);
    }

    lastPointerId = null;
    isDragging = false;

    if (!useGpu && !vsyncEnabled) {
      startWasmLoop();
    }
  }

  function onSliderKeyDown(event) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const direction = event.key === "ArrowUp" ? -1 : 1;
      focusedSlider = Math.max(0, Math.min(sliderDefinitions.length - 1, focusedSlider + direction));
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const definition = sliderDefinitions[focusedSlider];
      const delta = (definition.step || 1) * (event.key === "ArrowLeft" ? -1 : 1);
      const nextValue = Math.min(definition.max, Math.max(definition.min, sliderState[definition.key] + delta));

      if (nextValue !== sliderState[definition.key]) {
        sliderState[definition.key] = nextValue;
        renderSliders();
        scheduleSceneUpdate();
      }

      event.preventDefault();
    }
  }

  function onResize() {
    recomputeSliderColumns();
    renderSliders();
    centerIfOverflow();
  }

  function onVsyncChange() {
    if (!vsyncCheckbox) {
      return;
    }

    vsyncEnabled = vsyncCheckbox.checked;
    fpsHistory = [];

    if (!useGpu) {
      startWasmLoop();
    }
  }

  async function startGpuRenderer() {
    try {
      frameElement.textContent = "initializing gpu...";
      updateStatus("[webgpu] initializing...");
      renderer = await initGpuRenderer();
      useGpu = true;
      gpuRunning = true;
      lastSliderState = { ...sliderState };
      resetFpsTracking();
      animationStartTime = performance.now();

      async function gpuLoop() {
        if (!gpuRunning) {
          return;
        }

        try {
          await runGpuTick();
        } catch (error) {
          console.error("GPU frame failed", error);
          stopCurrentRenderer();
          return;
        }

        scheduleNextFrame(gpuLoop);
      }

      gpuLoop();
      return true;
    } catch (error) {
      console.warn("WebGPU not available:", error.message);
      return false;
    }
  }

  async function startWasmRenderer() {
    try {
      updateStatus("[wasm] initializing...");
      useGpu = false;
      gpuRunning = false;
      resetFpsTracking();
      await rebuildSceneWasm();
      return true;
    } catch (error) {
      console.error("failed to initialize wasm blackhole", error);
      frameElement.textContent = "failed to load animation";
      slidersElement.textContent = "sliders unavailable";
      updateStatus(`error: ${error.message}`);
      return false;
    }
  }

  function cleanup() {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;

    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
      rebuildTimeout = null;
    }

    stopCurrentRenderer();

    window.removeEventListener("resize", onResize);
    window.removeEventListener("beforeunload", cleanup);
    slidersElement.removeEventListener("pointerdown", onPointerDown);
    slidersElement.removeEventListener("pointermove", onPointerMove);
    slidersElement.removeEventListener("pointerup", onPointerEnd);
    slidersElement.removeEventListener("pointercancel", onPointerEnd);
    slidersElement.removeEventListener("lostpointercapture", onPointerEnd);
    slidersElement.removeEventListener("keydown", onSliderKeyDown);

    if (vsyncCheckbox) {
      vsyncCheckbox.removeEventListener("change", onVsyncChange);
    }
  }

  slidersElement.addEventListener("pointerdown", onPointerDown);
  slidersElement.addEventListener("pointermove", onPointerMove);
  slidersElement.addEventListener("pointerup", onPointerEnd);
  slidersElement.addEventListener("pointercancel", onPointerEnd);
  slidersElement.addEventListener("lostpointercapture", onPointerEnd);
  slidersElement.addEventListener("keydown", onSliderKeyDown);
  window.addEventListener("resize", onResize);

  if (vsyncCheckbox) {
    vsyncCheckbox.addEventListener("change", onVsyncChange);
  }

  window.addEventListener("beforeunload", cleanup, { once: true });

  renderSliders();
  centerIfOverflow();

  const gpuSuccess = await startGpuRenderer();
  if (!gpuSuccess) {
    await startWasmRenderer();
  }

  return cleanup;
}
