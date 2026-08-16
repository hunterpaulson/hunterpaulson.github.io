import { registerMediaExport } from "./blog/shared/media_export.mjs";
import { attachViewportAnimationLifecycle } from "./blog/shared/viewport_animation_lifecycle.mjs";
import {
  BLACKHOLE_WASM_INIT_PARAMETER_TYPES,
  blackholeWasmInitArguments,
  codepointsToFrame,
  destroyRendererAfter,
  formatRendererStatus,
  resolveBlackholeKeyboardAction,
  resolveBlackholeOptions,
  resolveSliderPointerIndex,
  scheduleLiveFrame,
} from "./art/blackhole_runtime.mjs";
import {
  MATTER_HEIGHT,
  MATTER_MAX_BRUSH_SIZE,
  MATTER_WIDTH,
  brushSizeFromInput,
  createSpiralMatterField,
  matterCellFromPointer,
  matterFieldToText,
  paintMatterLine,
} from "./art/blackhole_matter.mjs";

export async function initBlackholeSimulation({
  frameId = "bh",
  statusId = "bh-status",
  slidersId = "bh-sliders",
  vsyncCheckboxId = "bh-vsync",
  backend,
  glyphSet,
  sampleCount,
  ringProfile,
} = {}) {
  const frameElement = document.getElementById(frameId);
  const slidersElement = document.getElementById(slidersId);
  const statusElement = document.getElementById(statusId);
  const vsyncCheckbox = document.getElementById(vsyncCheckboxId);

  if (!frameElement || !slidersElement) {
    return () => {};
  }

  const width = MATTER_WIDTH;
  const height = MATTER_HEIGHT;
  const mediaExportFps = 30;
  const defaultFov = 60;
  const diskRotationSpeed = 1;
  const resolvedOptions = resolveBlackholeOptions({
    search: window.location.search,
    backend,
    glyphSet,
    sampleCount,
    ringProfile,
  });
  const mediaExport = registerMediaExport({
    fps: mediaExportFps,
    loopDurationMs: ((Math.PI * 2) / diskRotationSpeed) * 1000,
  });

  let sliderColumns = width;
  let trackLength = sliderColumns;

  const sliderDefinitions = [
    { key: "distance", label: "distance", min: 11, max: 140, step: 1, unit: "", showValue: false },
    { key: "incline", label: "incline", min: -45, max: 45, step: 1, unit: "°" },
    { key: "roll", label: "roll", min: -90, max: 90, step: 1, unit: "°" },
  ];

  const sliderState = {
    distance: 80,
    incline: 2,
    roll: 0,
  };

  slidersElement.setAttribute("tabindex", "0");

  let renderer = null;
  let useGpu = false;
  let gpuRunning = false;
  let gpuLoopGeneration = 0;
  let gpuTickPromise = null;
  let animationTimer = null;
  let phaseAtLastStateChange = 0;
  let phaseStateChangedAt = performance.now();
  let simulationPlaying = true;
  let rebuildTimeout = null;

  let metrics = null;
  let lastSliderState = { ...sliderState };
  let focusedSlider = 0;
  let lastPointerId = null;
  let activeSliderIndex = null;

  let frameCount = 0;
  let lastFpsTimestamp = performance.now();
  const fpsWindowSize = 5;
  let fpsHistory = [];

  let vsyncEnabled = vsyncCheckbox ? vsyncCheckbox.checked : true;
  let isDragging = false;
  let cleanedUp = false;
  let frameNeedsCentering = true;

  let wasmModule = null;
  let wasmInit = null;
  let wasmGenerateFrame = null;
  let wasmDestroy = null;
  let wasmMatterPointer = null;
  let wasmLoaded = false;
  let detachViewportLifecycle = null;
  let simulationControlsElement = null;
  let playPauseButton = null;
  let restartSimButton = null;
  let drawingControlsElement = null;
  let matterPadElement = null;
  let clearDrawingButton = null;
  let undoDrawingButton = null;
  let redoDrawingButton = null;
  let brushSizeInput = null;
  let drawingPointerId = null;
  let lastDrawingCell = null;
  let brushSize = 1;
  const draftMatter = createSpiralMatterField({ width, height });
  const activeMatter = new Float32Array(draftMatter);
  const drawingUndoStack = [];
  const drawingRedoStack = [];
  const drawingHistoryLimit = 32;

  function updateStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function currentSimulationPhase(now = performance.now()) {
    if (!simulationPlaying) {
      return phaseAtLastStateChange;
    }
    return phaseAtLastStateChange +
      ((now - phaseStateChangedAt) / 1000) * diskRotationSpeed;
  }

  function resetSimulationPhase() {
    phaseAtLastStateChange = 0;
    phaseStateChangedAt = performance.now();
  }

  function updatePlayPauseButton() {
    if (!playPauseButton) {
      return;
    }
    setControlLabel(
      playPauseButton,
      simulationPlaying ? "pause" : "play",
      "p",
    );
    playPauseButton.setAttribute("aria-pressed", String(!simulationPlaying));
  }

  function setControlLabel(control, text, shortcut = null) {
    const label = document.createElement("span");
    label.className = "blackhole-button-label";
    const shortcutIndex = shortcut
      ? text.toLowerCase().indexOf(shortcut.toLowerCase())
      : -1;

    if (shortcutIndex < 0) {
      label.textContent = text;
    } else {
      label.append(text.slice(0, shortcutIndex));
      const key = document.createElement("span");
      key.className = "blackhole-shortcut-key";
      key.textContent = text[shortcutIndex];
      label.append(key, text.slice(shortcutIndex + 1));
    }
    control.replaceChildren(label);
  }

  function centerIfOverflow() {
    const overflow = frameElement.scrollWidth - frameElement.clientWidth;
    if (overflow > 0) {
      frameElement.scrollLeft = overflow / 2;
    }
  }

  function centerRenderedFrameOnce() {
    if (!frameNeedsCentering) {
      return;
    }
    centerIfOverflow();
    frameNeedsCentering = false;
  }

  async function loadRendererFonts() {
    if (!document.fonts?.load) {
      return;
    }
    const loads = [document.fonts.load('500 1rem "Blackhole JetBrains Mono"', "M")];
    if (resolvedOptions.glyphSet !== "ascii") {
      loads.push(document.fonts.load('400 1rem "Blackhole Braille"', "⣿"));
    }
    await Promise.all(loads);
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
    const sliderIndex = resolveSliderPointerIndex({
      clientY: event.clientY,
      sliderTop: rect.top,
      lineHeight,
      sliderCount: sliderDefinitions.length,
      pointerId: event.pointerId,
      activePointerId: lastPointerId,
      activeSliderIndex,
    });
    if (sliderIndex === null) {
      return null;
    }

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

  function recordFps(backendName) {
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
    updateStatus(formatRendererStatus(backendName, currentFps, minFps, maxFps));
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
      resolvedOptions.glyphSet,
      resolvedOptions.sampleCount,
      resolvedOptions.ringProfile,
      activeMatter,
    );

    return gpuRenderer;
  }

  async function runGpuTick() {
    const activeRenderer = renderer;
    if (!activeRenderer) {
      return;
    }
    const phase = currentSimulationPhase();
    const frame = await activeRenderer.generateFrame(phase);

    if (cleanedUp || renderer !== activeRenderer) {
      return;
    }

    frameElement.textContent = frame;
    centerRenderedFrameOnce();
    recordFps("webgpu");
    if (!mediaExport.controller.ready) {
      mediaExport.setReady({ renderer: "webgpu" });
    }
  }

  function scheduleNextFrame(loopFunction) {
    scheduleLiveFrame(loopFunction, {
      vsync: vsyncEnabled || isDragging,
      requestAnimationFrame: window.requestAnimationFrame.bind(window),
      setTimeout: window.setTimeout.bind(window),
    });
  }

  function startGpuLoop() {
    if (!renderer || gpuRunning) {
      return;
    }

    gpuRunning = true;
    gpuLoopGeneration += 1;
    const currentGeneration = gpuLoopGeneration;

    async function gpuLoop() {
      if (!gpuRunning || currentGeneration !== gpuLoopGeneration) {
        return;
      }

      try {
        gpuTickPromise = runGpuTick();
        await gpuTickPromise;
      } catch (error) {
        console.error("GPU frame failed", error);
        stopCurrentRenderer();
        return;
      } finally {
        gpuTickPromise = null;
      }

      if (!gpuRunning || currentGeneration !== gpuLoopGeneration) {
        return;
      }

      scheduleNextFrame(gpuLoop);
    }

    gpuLoop();
  }

  function stopGpuLoop() {
    gpuRunning = false;
    gpuLoopGeneration += 1;
  }

  function pauseCurrentRenderer() {
    stopGpuLoop();
    stopAnimation();
  }

  function resumeCurrentRenderer() {
    if (cleanedUp || !simulationPlaying) {
      return;
    }

    if (useGpu && renderer) {
      startGpuLoop();
      return;
    }

    if (!useGpu && wasmLoaded && wasmGenerateFrame) {
      startWasmLoop();
    }
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
      BLACKHOLE_WASM_INIT_PARAMETER_TYPES,
    );
    wasmGenerateFrame = wasmModule.cwrap("bh_wasm_generate_frame", "number", ["number"]);
    wasmDestroy = wasmModule.cwrap("bh_wasm_destroy", "void", []);
    wasmMatterPointer = wasmModule.cwrap("bh_wasm_matter_ptr", "number", []);
    wasmLoaded = true;
  }

  function writeActiveMatterToWasm() {
    const pointer = wasmMatterPointer?.();
    if (!pointer) {
      throw new Error("bh_wasm_matter_ptr returned null");
    }
    const heap = new Float32Array(wasmModule.HEAPU32.buffer);
    heap.set(activeMatter, pointer >>> 2);
  }

  function runWasmTick() {
    const phase = currentSimulationPhase();
    const framePointer = wasmGenerateFrame(phase);

    if (!framePointer) {
      throw new Error("bh_wasm_generate_frame returned null");
    }

    const codepoints = wasmModule.HEAPU32.subarray(
      framePointer >>> 2,
      (framePointer >>> 2) + width * height,
    );
    frameElement.textContent = codepointsToFrame(codepoints, width, height);
    centerRenderedFrameOnce();
    recordFps("wasm");
    if (!mediaExport.controller.ready) {
      mediaExport.setReady({ renderer: "wasm" });
    }
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
    pauseCurrentRenderer();

    if (renderer) {
      const rendererToDestroy = renderer;
      renderer = null;
      destroyRendererAfter(rendererToDestroy, gpuTickPromise).catch(() => {});
    }

    if (wasmDestroy) {
      try {
        wasmDestroy();
      } catch (_error) {
      }
    }
  }

  async function rebuildSceneWasm({ restartMotion = false } = {}) {
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

    const initStatus = wasmInit(...blackholeWasmInitArguments({
      width,
      height,
      incline: sliderState.incline,
      fov: defaultFov,
      distance: sliderState.distance,
      roll: sliderState.roll,
      glyphSet: resolvedOptions.glyphSet,
      sampleCount: resolvedOptions.sampleCount,
      ringProfile: resolvedOptions.ringProfile,
    }));

    if (initStatus !== 0) {
      throw new Error(`bh_wasm_init failed (${initStatus})`);
    }
    writeActiveMatterToWasm();

    lastSliderState = { ...sliderState };
    if (restartMotion) {
      resetSimulationPhase();
    }
    runWasmTick();
    window.scrollTo(scrollX, scrollY);
    if (simulationPlaying) {
      startWasmLoop();
    }
  }

  function startWasmLoop() {
    stopAnimation();
    if (!simulationPlaying) {
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
        scheduleNextFrame(wasmLoop);
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
        if (!simulationPlaying) {
          runGpuTick().catch((error) => {
            console.error("GPU still frame failed", error);
          });
        }
      }
      return;
    }

    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
    }

    rebuildTimeout = setTimeout(() => {
      rebuildTimeout = null;
      rebuildSceneWasm().catch((error) => {
        mediaExport.update({ error: error.message });
        console.error("blackhole rebuild failed", error);
        frameElement.textContent = "failed to render animation";
      });
    }, 150);
  }

  function onPointerDown(event) {
    const info = sliderInfoFromPointer(event);
    if (!info) {
      return;
    }

    event.preventDefault();
    lastPointerId = event.pointerId;
    activeSliderIndex = info.sliderIndex;
    isDragging = true;
    slidersElement.setPointerCapture(event.pointerId);
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
    if (!info) {
      return;
    }

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
    activeSliderIndex = null;
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

  function toggleSimulationPlayback() {
    const now = performance.now();
    if (simulationPlaying) {
      phaseAtLastStateChange = currentSimulationPhase(now);
      simulationPlaying = false;
      pauseCurrentRenderer();
    } else {
      phaseStateChangedAt = now;
      simulationPlaying = true;
      resetFpsTracking();
      resumeCurrentRenderer();
    }
    updatePlayPauseButton();
  }

  async function restartSim() {
    activeMatter.set(draftMatter);
    resetSimulationPhase();
    try {
      if (useGpu && renderer) {
        renderer.setMatterField(activeMatter);
        if (!simulationPlaying) {
          await runGpuTick();
        }
      } else if (wasmLoaded && wasmMatterPointer) {
        writeActiveMatterToWasm();
        if (!simulationPlaying) {
          runWasmTick();
        }
      }
    } catch (error) {
      console.error("failed to restart blackhole simulation", error);
    }
  }

  function renderDrawingPad() {
    if (matterPadElement) {
      matterPadElement.textContent = matterFieldToText(draftMatter, width, height);
    }
  }

  function drawingCellFromPointer(event) {
    const rect = matterPadElement.getBoundingClientRect();
    return matterCellFromPointer({
      clientX: event.clientX,
      clientY: event.clientY,
      left: rect.left - matterPadElement.scrollLeft,
      top: rect.top,
      charWidth: matterPadElement.scrollWidth / width,
      lineHeight: matterPadElement.scrollHeight / height,
      width,
      height,
    });
  }

  function onDrawingPointerDown(event) {
    if (event.button !== 0 || drawingPointerId !== null) {
      return;
    }
    event.preventDefault();
    matterPadElement.focus({ preventScroll: true });
    rememberDrawingBeforeEdit();
    drawingPointerId = event.pointerId;
    lastDrawingCell = drawingCellFromPointer(event);
    matterPadElement.setPointerCapture(event.pointerId);
    paintMatterLine(
      draftMatter,
      width,
      height,
      lastDrawingCell,
      lastDrawingCell,
      1,
      brushSize,
    );
    renderDrawingPad();
  }

  function onDrawingPointerMove(event) {
    if (event.pointerId !== drawingPointerId || !lastDrawingCell) {
      return;
    }
    event.preventDefault();
    const nextCell = drawingCellFromPointer(event);
    paintMatterLine(
      draftMatter,
      width,
      height,
      lastDrawingCell,
      nextCell,
      1,
      brushSize,
    );
    lastDrawingCell = nextCell;
    renderDrawingPad();
  }

  function onDrawingPointerEnd(event) {
    if (event.pointerId !== drawingPointerId) {
      return;
    }
    if (event.type !== "lostpointercapture" &&
        matterPadElement.hasPointerCapture(event.pointerId)) {
      matterPadElement.releasePointerCapture(event.pointerId);
    }
    drawingPointerId = null;
    lastDrawingCell = null;
  }

  function updateDrawingHistoryButtons() {
    if (undoDrawingButton) {
      undoDrawingButton.disabled = drawingUndoStack.length === 0;
    }
    if (redoDrawingButton) {
      redoDrawingButton.disabled = drawingRedoStack.length === 0;
    }
  }

  function rememberDrawingBeforeEdit() {
    drawingUndoStack.push(new Float32Array(draftMatter));
    if (drawingUndoStack.length > drawingHistoryLimit) {
      drawingUndoStack.shift();
    }
    drawingRedoStack.length = 0;
    updateDrawingHistoryButtons();
  }

  function undoDrawing() {
    const previous = drawingUndoStack.pop();
    if (!previous) {
      return;
    }
    drawingRedoStack.push(new Float32Array(draftMatter));
    draftMatter.set(previous);
    renderDrawingPad();
    updateDrawingHistoryButtons();
  }

  function redoDrawing() {
    const next = drawingRedoStack.pop();
    if (!next) {
      return;
    }
    drawingUndoStack.push(new Float32Array(draftMatter));
    draftMatter.set(next);
    renderDrawingPad();
    updateDrawingHistoryButtons();
  }

  function clearDrawing() {
    if (!draftMatter.some((density) => density !== 0)) {
      return;
    }
    rememberDrawingBeforeEdit();
    draftMatter.fill(0);
    renderDrawingPad();
  }

  function handleSimulationShortcut(event) {
    if (event.defaultPrevented) {
      return false;
    }

    const target = event.target;
    const inputType = target instanceof HTMLInputElement
      ? target.type.toLowerCase()
      : "";
    const inputCapturesShortcut = target instanceof HTMLInputElement &&
      (inputType === "number"
        ? event.metaKey || event.ctrlKey
        : !["button", "checkbox", "radio", "range", "reset", "submit"].includes(inputType));
    const editable = target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      inputCapturesShortcut ||
      (target instanceof HTMLElement && target.isContentEditable);
    const action = resolveBlackholeKeyboardAction({
      key: event.key,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      repeat: event.repeat,
      editable,
    });
    if (!action) {
      return false;
    }

    event.preventDefault();
    if (action === "undo") {
      undoDrawing();
    } else if (action === "redo") {
      redoDrawing();
    } else if (action === "toggle-playback") {
      toggleSimulationPlayback();
    } else if (action === "restart") {
      void restartSim();
    } else if (action === "clear") {
      clearDrawing();
    } else if (action === "focus-brush") {
      brushSizeInput.focus();
      brushSizeInput.select();
    }
    return true;
  }

  function onBrushSizeChange() {
    brushSize = brushSizeFromInput(brushSizeInput.value, brushSize);
  }

  function commitBrushSizeChange() {
    brushSize = brushSizeFromInput(brushSizeInput.value, brushSize);
    brushSizeInput.value = String(brushSize);
  }

  function installSimulationControls() {
    simulationControlsElement = document.createElement("p");
    simulationControlsElement.className = "blackhole-sim-controls";

    restartSimButton = document.createElement("button");
    restartSimButton.type = "button";
    setControlLabel(restartSimButton, "restart sim", "r");
    restartSimButton.title = "Restart from the drawing without changing the camera (R)";
    restartSimButton.setAttribute("aria-keyshortcuts", "R");
    restartSimButton.setAttribute("aria-controls", frameId);
    restartSimButton.addEventListener("click", restartSim);
    simulationControlsElement.appendChild(restartSimButton);

    playPauseButton = document.createElement("button");
    playPauseButton.type = "button";
    playPauseButton.className = "blackhole-play-toggle";
    playPauseButton.title = "Pause or resume the orbital simulation (P)";
    playPauseButton.setAttribute("aria-keyshortcuts", "P");
    playPauseButton.setAttribute("aria-controls", frameId);
    playPauseButton.addEventListener("click", toggleSimulationPlayback);
    simulationControlsElement.appendChild(playPauseButton);

    drawingControlsElement = document.createElement("section");
    drawingControlsElement.className = "blackhole-drawing-controls";
    drawingControlsElement.setAttribute("aria-label", "initial accretion disk editor");

    matterPadElement = document.createElement("pre");
    matterPadElement.id = `${frameId}-matter-pad`;
    matterPadElement.className = "blackhole-matter-pad";
    matterPadElement.tabIndex = 0;
    matterPadElement.setAttribute("aria-label", "top-down accretion disk drawing pad");
    matterPadElement.setAttribute("aria-description", "Drag to add matter. Restart the simulation to apply the drawing.");

    clearDrawingButton = document.createElement("button");
    clearDrawingButton.type = "button";
    clearDrawingButton.className = "blackhole-drawing-actions-start";
    setControlLabel(clearDrawingButton, "clear", "c");
    clearDrawingButton.title = "Clear the draft drawing (C)";
    clearDrawingButton.setAttribute("aria-keyshortcuts", "C");
    clearDrawingButton.setAttribute("aria-controls", matterPadElement.id);
    clearDrawingButton.addEventListener("click", clearDrawing);
    simulationControlsElement.appendChild(clearDrawingButton);

    undoDrawingButton = document.createElement("button");
    undoDrawingButton.type = "button";
    setControlLabel(undoDrawingButton, "undo");
    undoDrawingButton.title = "Undo the last drawing stroke or clear (Ctrl/Command-Z)";
    undoDrawingButton.setAttribute("aria-keyshortcuts", "Control+Z Meta+Z");
    undoDrawingButton.setAttribute("aria-controls", matterPadElement.id);
    undoDrawingButton.addEventListener("click", undoDrawing);
    simulationControlsElement.appendChild(undoDrawingButton);

    redoDrawingButton = document.createElement("button");
    redoDrawingButton.type = "button";
    setControlLabel(redoDrawingButton, "redo");
    redoDrawingButton.title = "Redo the last undone drawing edit (Ctrl-Y or Ctrl/Command-Shift-Z)";
    redoDrawingButton.setAttribute(
      "aria-keyshortcuts",
      "Control+Y Control+Shift+Z Meta+Shift+Z",
    );
    redoDrawingButton.setAttribute("aria-controls", matterPadElement.id);
    redoDrawingButton.addEventListener("click", redoDrawing);
    simulationControlsElement.appendChild(redoDrawingButton);

    const brushSizeLabel = document.createElement("label");
    brushSizeLabel.className = "blackhole-brush-size";
    setControlLabel(brushSizeLabel, "brush", "b");
    brushSizeInput = document.createElement("input");
    brushSizeInput.type = "number";
    brushSizeInput.min = "1";
    brushSizeInput.max = String(MATTER_MAX_BRUSH_SIZE);
    brushSizeInput.step = "2";
    brushSizeInput.value = String(brushSize);
    brushSizeInput.setAttribute("aria-label", "brush size in cells");
    brushSizeInput.setAttribute("aria-keyshortcuts", "B ArrowUp ArrowDown");
    brushSizeInput.title = "Focus with B, then use the arrow keys; odd diameter from 1 to 9 cells";
    brushSizeInput.addEventListener("input", onBrushSizeChange);
    brushSizeInput.addEventListener("change", commitBrushSizeChange);
    brushSizeLabel.appendChild(brushSizeInput);
    simulationControlsElement.appendChild(brushSizeLabel);

    matterPadElement.addEventListener("pointerdown", onDrawingPointerDown);
    matterPadElement.addEventListener("pointermove", onDrawingPointerMove);
    matterPadElement.addEventListener("pointerup", onDrawingPointerEnd);
    matterPadElement.addEventListener("pointercancel", onDrawingPointerEnd);
    matterPadElement.addEventListener("lostpointercapture", onDrawingPointerEnd);

    drawingControlsElement.appendChild(matterPadElement);
    slidersElement.insertAdjacentElement("afterend", simulationControlsElement);
    simulationControlsElement.insertAdjacentElement("afterend", drawingControlsElement);
    updatePlayPauseButton();
    updateDrawingHistoryButtons();
    renderDrawingPad();
  }

  async function startGpuRenderer() {
    try {
      frameElement.textContent = "initializing gpu...";
      updateStatus("[webgpu] initializing...");
      renderer = await initGpuRenderer();
      useGpu = true;
      lastSliderState = { ...sliderState };
      resetFpsTracking();
      resetSimulationPhase();
      startGpuLoop();
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
      await rebuildSceneWasm({ restartMotion: true });
      return true;
    } catch (error) {
      mediaExport.update({ error: error.message });
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
    window.removeEventListener("keydown", handleSimulationShortcut);
    window.removeEventListener("beforeunload", cleanup);
    slidersElement.removeEventListener("pointerdown", onPointerDown);
    slidersElement.removeEventListener("pointermove", onPointerMove);
    slidersElement.removeEventListener("pointerup", onPointerEnd);
    slidersElement.removeEventListener("pointercancel", onPointerEnd);
    slidersElement.removeEventListener("lostpointercapture", onPointerEnd);
    slidersElement.removeEventListener("keydown", onSliderKeyDown);

    if (playPauseButton) {
      playPauseButton.removeEventListener("click", toggleSimulationPlayback);
    }
    if (restartSimButton) {
      restartSimButton.removeEventListener("click", restartSim);
    }
    if (clearDrawingButton) {
      clearDrawingButton.removeEventListener("click", clearDrawing);
    }
    if (undoDrawingButton) {
      undoDrawingButton.removeEventListener("click", undoDrawing);
    }
    if (redoDrawingButton) {
      redoDrawingButton.removeEventListener("click", redoDrawing);
    }
    if (brushSizeInput) {
      brushSizeInput.removeEventListener("input", onBrushSizeChange);
      brushSizeInput.removeEventListener("change", commitBrushSizeChange);
    }
    if (matterPadElement) {
      matterPadElement.removeEventListener("pointerdown", onDrawingPointerDown);
      matterPadElement.removeEventListener("pointermove", onDrawingPointerMove);
      matterPadElement.removeEventListener("pointerup", onDrawingPointerEnd);
      matterPadElement.removeEventListener("pointercancel", onDrawingPointerEnd);
      matterPadElement.removeEventListener("lostpointercapture", onDrawingPointerEnd);
    }
    if (drawingControlsElement) {
      drawingControlsElement.remove();
      drawingControlsElement = null;
      matterPadElement = null;
      clearDrawingButton = null;
      undoDrawingButton = null;
      redoDrawingButton = null;
      brushSizeInput = null;
    }
    if (simulationControlsElement) {
      simulationControlsElement.remove();
      simulationControlsElement = null;
      playPauseButton = null;
      restartSimButton = null;
    }

    if (vsyncCheckbox) {
      vsyncCheckbox.removeEventListener("change", onVsyncChange);
    }

    if (detachViewportLifecycle) {
      detachViewportLifecycle();
      detachViewportLifecycle = null;
    }
  }

  slidersElement.addEventListener("pointerdown", onPointerDown);
  slidersElement.addEventListener("pointermove", onPointerMove);
  slidersElement.addEventListener("pointerup", onPointerEnd);
  slidersElement.addEventListener("pointercancel", onPointerEnd);
  slidersElement.addEventListener("lostpointercapture", onPointerEnd);
  slidersElement.addEventListener("keydown", onSliderKeyDown);
  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", handleSimulationShortcut);

  if (vsyncCheckbox) {
    vsyncCheckbox.addEventListener("change", onVsyncChange);
  }

  window.addEventListener("beforeunload", cleanup, { once: true });

  installSimulationControls();
  renderSliders();
  await loadRendererFonts();

  const gpuSuccess = resolvedOptions.backend === "wasm"
    ? false
    : await startGpuRenderer();
  if (!gpuSuccess && resolvedOptions.backend !== "webgpu") {
    await startWasmRenderer();
  } else if (!gpuSuccess) {
    frameElement.textContent = "failed to load forced webgpu renderer";
    updateStatus("[webgpu] unavailable");
  }

  detachViewportLifecycle = attachViewportAnimationLifecycle({
    element: frameElement.closest(".art-section") ?? frameElement,
    pause() {
      pauseCurrentRenderer();
    },
    resume() {
      resumeCurrentRenderer();
    },
  });

  return cleanup;
}
