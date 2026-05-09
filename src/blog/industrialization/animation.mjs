import { registerMediaExport } from "../shared/media_export.mjs";
import { attachViewportAnimationLifecycle } from "../shared/viewport_animation_lifecycle.mjs";
import { shouldRecreateFarmingSimulation } from "./resize_policy.mjs";
import { FarmingSimulation, parseCorpusText } from "./simulation.mjs";

const FIELD_ELEMENT_ID = "farming-field";
const CORPUS_URL = "/assets/blog/industrialization/corpus.txt";
const TARGET_FPS = 12;
const RESIZE_DEBOUNCE_MS = 120;
const DEFAULT_SEED = "farming-v1";
const NARROW_VIEWPORT_QUERY = "(max-width: 700px)";
const FIXED_ROWS_ATTRIBUTE = "farmingRows";

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
    height: rect.height || 16,
  };
}

function computeFieldSize(fieldElement) {
  const cell = measureCharacterCell(fieldElement);
  const fieldBounds = fieldElement.getBoundingClientRect();
  const fixedRows = Number.parseInt(fieldElement.dataset[FIXED_ROWS_ATTRIBUTE] || "", 10);

  const availableWidth = fieldBounds.width || fieldElement.clientWidth || 80 * cell.width;
  const columns = Math.max(20, Math.floor(availableWidth / cell.width));

  const availableHeight = Math.max(
    cell.height * 12,
    window.innerHeight - fieldBounds.top - cell.height * 4,
  );
  const rows = Number.isInteger(fixedRows) && fixedRows > 0
    ? fixedRows
    : Math.max(10, Math.floor(availableHeight / cell.height));

  return {
    columns,
    rows,
    lineHeight: cell.height,
  };
}

function resolveSeed() {
  const params = new URLSearchParams(window.location.search);
  return params.get("seed") || DEFAULT_SEED;
}

function isNarrowViewport() {
  return window.matchMedia(NARROW_VIEWPORT_QUERY).matches;
}

async function loadCorpusLines() {
  const response = await fetch(CORPUS_URL);
  if (!response.ok) {
    throw new Error(`failed to fetch corpus (${response.status})`);
  }
  const corpusText = await response.text();
  const corpusLines = parseCorpusText(corpusText);
  if (corpusLines.length === 0) {
    throw new Error("corpus is empty");
  }
  return corpusLines;
}

async function bootFarmingAnimation() {
  const fieldElement = document.getElementById(FIELD_ELEMENT_ID);
  if (!fieldElement) {
    return;
  }

  const mediaExport = registerMediaExport({
    fps: TARGET_FPS,
    frameDurationMs: 1000 / TARGET_FPS,
  });

  let corpusLines = [];
  try {
    corpusLines = await loadCorpusLines();
  } catch (error) {
    mediaExport.update({ error: error.message });
    fieldElement.textContent = `farming corpus error: ${error.message}`;
    return;
  }

  const seed = resolveSeed();
  const frameDurationMs = 1000 / TARGET_FPS;
  let simulation = null;
  let intervalId = null;
  let resizeTimerId = null;
  let dimensions = null;

  function clearResizeTimer() {
    if (resizeTimerId === null) {
      return;
    }

    window.clearTimeout(resizeTimerId);
    resizeTimerId = null;
  }

  function renderFrame() {
    fieldElement.textContent = simulation.renderFrame();
  }

  function createSimulation() {
    const nextDimensions = computeFieldSize(fieldElement);
    dimensions = nextDimensions;
    fieldElement.style.height = `${nextDimensions.rows * nextDimensions.lineHeight}px`;
    simulation = new FarmingSimulation({
      width: nextDimensions.columns,
      height: nextDimensions.rows,
      seed,
      corpusLines,
    });
    renderFrame();
    mediaExport.setReady({
      rows: nextDimensions.rows,
      columns: nextDimensions.columns,
      seed,
    });
  }

  function stopTimer() {
    if (intervalId === null) {
      return;
    }
    window.clearInterval(intervalId);
    intervalId = null;
  }

  function startTimer() {
    stopTimer();
    intervalId = window.setInterval(() => {
      simulation.tick();
      renderFrame();
    }, frameDurationMs);
  }

  function restartForResizeIfNeeded() {
    const nextDimensions = computeFieldSize(fieldElement);
    if (!shouldRecreateFarmingSimulation({
      currentDimensions: dimensions,
      nextDimensions,
      narrowViewport: isNarrowViewport(),
    })) {
      return;
    }
    createSimulation();
  }

  createSimulation();

  attachViewportAnimationLifecycle({
    element: fieldElement.closest(".art-section") ?? fieldElement,
    pause() {
      stopTimer();
      clearResizeTimer();
    },
    resume() {
      restartForResizeIfNeeded();
      renderFrame();
      startTimer();
    },
  });

  window.addEventListener("resize", () => {
    clearResizeTimer();
    resizeTimerId = window.setTimeout(() => {
      restartForResizeIfNeeded();
      resizeTimerId = null;
    }, RESIZE_DEBOUNCE_MS);
  });
}

void bootFarmingAnimation();
