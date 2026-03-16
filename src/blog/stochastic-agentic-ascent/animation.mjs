import { preserveScrollOffset } from "../shared/animated_text_pane.mjs";
import { KERNEL_STAGES } from "./data.mjs";
import {
  CODE_LINE_COUNT,
  clampFrameWidth,
  renderChartPane,
  renderScrollableKernelPane,
} from "./render.mjs";

const CHART_SCREEN_ELEMENT_ID = "stochastic-agentic-ascent-chart-screen";
const HOLD_MS = 1500;
const KERNEL_SCROLL_SCREEN_ELEMENT_ID = "stochastic-agentic-ascent-kernel-scroll-screen";
const TRANSITION_MS = 1050;
const WHEEL_PIXELS_PER_LINE = 32;

function measureCharacterCell(referenceElement) {
  const probe = document.createElement("span");
  probe.textContent = "M";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "pre";
  referenceElement.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  referenceElement.removeChild(probe);
  return {
    width: rect.width || 8,
  };
}

function computeAvailableColumns(screenElement) {
  const characterCell = measureCharacterCell(screenElement);
  const elementWidth = screenElement.clientWidth || screenElement.getBoundingClientRect().width;
  return clampFrameWidth(Math.floor(elementWidth / characterCell.width));
}

function createAnimationState() {
  return {
    stageIndex: 0,
    phase: "hold",
    phaseElapsedMs: 0,
    lastTimestamp: 0,
    scrollOffset: 0,
  };
}

function kernelLineCount(stageIndex) {
  return KERNEL_STAGES[stageIndex].codeLines.length;
}

function resolveTransitionProgress(state) {
  if (state.phase !== "transition") {
    return 0;
  }
  return Math.min(1, state.phaseElapsedMs / TRANSITION_MS);
}

function bootOptimizerAnimation() {
  const kernelScrollScreenElement = document.getElementById(KERNEL_SCROLL_SCREEN_ELEMENT_ID);
  const chartScreenElement = document.getElementById(CHART_SCREEN_ELEMENT_ID);
  if (!kernelScrollScreenElement || !chartScreenElement) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = createAnimationState();
  let availableColumns = clampFrameWidth(Math.min(
    computeAvailableColumns(kernelScrollScreenElement),
    computeAvailableColumns(chartScreenElement),
  ));
  let frameId = null;

  function visibleKernelLineCount() {
    if (resolveTransitionProgress(state) > 0 && state.stageIndex < KERNEL_STAGES.length - 1) {
      return Math.max(kernelLineCount(state.stageIndex), kernelLineCount(state.stageIndex + 1));
    }
    return kernelLineCount(state.stageIndex);
  }

  function maximumScrollOffset() {
    return Math.max(0, visibleKernelLineCount() - CODE_LINE_COUNT);
  }

  function setScrollOffset(nextScrollOffset) {
    state.scrollOffset = Math.min(Math.max(nextScrollOffset, 0), maximumScrollOffset());
    render();
  }

  function resetToFirstStage() {
    state.stageIndex = 0;
    state.phase = "hold";
    state.phaseElapsedMs = 0;
    state.scrollOffset = 0;
  }

  function advanceStage() {
    if (state.stageIndex >= KERNEL_STAGES.length - 1) {
      resetToFirstStage();
      return;
    }

    state.scrollOffset = preserveScrollOffset({
      fromScrollOffset: state.scrollOffset,
      fromTotalLineCount: visibleKernelLineCount(),
      toTotalLineCount: kernelLineCount(state.stageIndex + 1),
      viewportLineCount: CODE_LINE_COUNT,
    });
    state.stageIndex += 1;
    state.phase = "hold";
    state.phaseElapsedMs = 0;
  }

  function render() {
    const transitionProgress = resolveTransitionProgress(state);

    kernelScrollScreenElement.textContent = renderScrollableKernelPane({
      width: availableColumns,
      stageIndex: state.stageIndex,
      transitionProgress,
      scrollOffset: state.scrollOffset,
    });
    chartScreenElement.textContent = renderChartPane({
      width: availableColumns,
      stageIndex: state.stageIndex,
      transitionProgress,
    });
  }

  function tick(timestamp) {
    if (state.lastTimestamp === 0) {
      state.lastTimestamp = timestamp;
    }

    const deltaMs = timestamp - state.lastTimestamp;
    state.lastTimestamp = timestamp;
    state.phaseElapsedMs += deltaMs;

    if (state.phase === "hold") {
      if (state.phaseElapsedMs >= HOLD_MS) {
        if (state.stageIndex >= KERNEL_STAGES.length - 1) {
          resetToFirstStage();
        } else if (reducedMotion) {
          advanceStage();
        } else {
          state.phase = "transition";
          state.phaseElapsedMs = 0;
        }
      }
    } else if (state.phaseElapsedMs >= TRANSITION_MS) {
      advanceStage();
    }

    render();
    frameId = window.requestAnimationFrame(tick);
  }

  const onResize = () => {
    availableColumns = clampFrameWidth(Math.min(
      computeAvailableColumns(kernelScrollScreenElement),
      computeAvailableColumns(chartScreenElement),
    ));
    state.scrollOffset = Math.min(state.scrollOffset, maximumScrollOffset());
    render();
  };

  const onWheel = (event) => {
    event.preventDefault();
    const direction = Math.sign(event.deltaY);
    if (direction === 0) {
      return;
    }

    const lineDelta = Math.max(1, Math.round(Math.abs(event.deltaY) / WHEEL_PIXELS_PER_LINE));
    setScrollOffset(state.scrollOffset + (direction * lineDelta));
  };

  const onKeyDown = (event) => {
    const keyToDelta = new Map([
      ["ArrowUp", -1],
      ["ArrowDown", 1],
      ["PageUp", -(CODE_LINE_COUNT - 1)],
      ["PageDown", CODE_LINE_COUNT - 1],
    ]);

    if (event.key === "Home") {
      event.preventDefault();
      setScrollOffset(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setScrollOffset(maximumScrollOffset());
      return;
    }

    const delta = keyToDelta.get(event.key);
    if (delta === undefined) {
      return;
    }

    event.preventDefault();
    setScrollOffset(state.scrollOffset + delta);
  };

  window.addEventListener("resize", onResize);
  kernelScrollScreenElement.addEventListener("wheel", onWheel, { passive: false });
  kernelScrollScreenElement.addEventListener("keydown", onKeyDown);

  if (reducedMotion) {
    state.stageIndex = KERNEL_STAGES.length - 1;
    render();
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("resize", onResize);
      kernelScrollScreenElement.removeEventListener("wheel", onWheel);
      kernelScrollScreenElement.removeEventListener("keydown", onKeyDown);
    }, { once: true });
    return;
  }

  render();
  frameId = window.requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }
    window.removeEventListener("resize", onResize);
    kernelScrollScreenElement.removeEventListener("wheel", onWheel);
    kernelScrollScreenElement.removeEventListener("keydown", onKeyDown);
  }, { once: true });
}

bootOptimizerAnimation();
