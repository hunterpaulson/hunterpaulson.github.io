import { FarmingSimulation, parseCorpusText } from "./farming_simulation.mjs";
import { resolveFieldDimensions } from "./farming_field_size.mjs";

const FIELD_ELEMENT_ID = "farming-field";
const CORPUS_URL = "/assets/farming_corpus.txt";
const TARGET_FPS = 12;
const RESIZE_DEBOUNCE_MS = 120;
const DEFAULT_SEED = "farming-v1";

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
  const viewportHeightPx = window.visualViewport?.height ?? window.innerHeight;
  const { columns, rows } = resolveFieldDimensions({
    fieldWidthPx: fieldBounds.width || fieldElement.clientWidth || 0,
    viewportHeightPx,
    cellWidthPx: cell.width,
    cellHeightPx: cell.height,
  });

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

  let corpusLines = [];
  try {
    corpusLines = await loadCorpusLines();
  } catch (error) {
    fieldElement.textContent = `farming corpus error: ${error.message}`;
    return;
  }

  const seed = resolveSeed();
  const frameDurationMs = 1000 / TARGET_FPS;
  let simulation = null;
  let intervalId = null;
  let resizeTimerId = null;
  let dimensions = null;

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
    if (
      dimensions !== null
      && nextDimensions.columns === dimensions.columns
      && nextDimensions.rows === dimensions.rows
    ) {
      return;
    }
    createSimulation();
  }

  createSimulation();
  startTimer();

  window.addEventListener("resize", () => {
    if (resizeTimerId !== null) {
      window.clearTimeout(resizeTimerId);
    }
    resizeTimerId = window.setTimeout(() => {
      restartForResizeIfNeeded();
      resizeTimerId = null;
    }, RESIZE_DEBOUNCE_MS);
  });

  window.addEventListener("beforeunload", () => {
    stopTimer();
    if (resizeTimerId !== null) {
      window.clearTimeout(resizeTimerId);
      resizeTimerId = null;
    }
  }, { once: true });
}

void bootFarmingAnimation();
