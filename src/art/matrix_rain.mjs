import { registerMediaExport } from "../blog/shared/media_export.mjs";
import { attachViewportAnimationLifecycle } from "../blog/shared/viewport_animation_lifecycle.mjs";

const CELL_COUNT_ATTRIBUTE = "matrixCellsReady";
const COLUMN_COUNT = 80;
const GLYPHS = Array.from("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ");
const LOOP_DURATION_MS = 8000;
const MATRIX_EXPORT_ID = "matrix-rain";
const ROW_COUNT = 36;
const TARGET_FPS = 60;
const FRAME_DURATION_MS = 1000 / TARGET_FPS;

function hashInteger(value) {
  let hashed = value | 0;
  hashed ^= hashed << 13;
  hashed ^= hashed >>> 17;
  hashed ^= hashed << 5;
  return hashed >>> 0;
}

function unitRandom(seed) {
  return hashInteger(seed) / 0xffffffff;
}

function createColumnStreams(columnCount, rowCount) {
  return Array.from({ length: columnCount }, (_, column) => {
    const seed = hashInteger((column + 1) * 2654435761);
    const trailLength = 8 + Math.floor(unitRandom(seed) * 18);
    return {
      cycleLength: rowCount + trailLength + 8,
      offsetRows: Math.floor(unitRandom(seed ^ 0x85ebca6b) * (rowCount + trailLength)),
      speedRowsPerSecond: 5 + unitRandom(seed ^ 0xc2b2ae35) * 9,
      trailLength,
    };
  });
}

function createCells(rootElement, columnCount, rowCount) {
  if (rootElement.dataset[CELL_COUNT_ATTRIBUTE] === `${columnCount}x${rowCount}`) {
    return Array.from(rootElement.querySelectorAll(".matrix-rain__cell"));
  }

  rootElement.replaceChildren();
  rootElement.style.setProperty("--matrix-columns", columnCount);
  rootElement.style.setProperty("--matrix-rows", rowCount);

  const fragment = document.createDocumentFragment();
  const cells = [];
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const cell = document.createElement("span");
      cell.className = "matrix-rain__cell";
      cell.setAttribute("aria-hidden", "true");
      cell.style.setProperty("--matrix-column", column);
      cell.style.setProperty("--matrix-row", row);
      fragment.appendChild(cell);
      cells.push(cell);
    }
  }

  rootElement.appendChild(fragment);
  rootElement.dataset[CELL_COUNT_ATTRIBUTE] = `${columnCount}x${rowCount}`;
  return cells;
}

function matrixGlyph({ column, row, timeMs, distanceFromHead, headStep, passIndex }) {
  const cellSeed = ((column + 1) * 73856093) ^ ((row + 1) * 19349663);
  const isHead = distanceFromHead < 1.25;
  const mutationSeed = cellSeed ^ 0x9e3779b9;
  if (isHead) {
    const seed = cellSeed ^ (passIndex * 1597334677) ^ (headStep * 83492791);
    return GLYPHS[hashInteger(seed) % GLYPHS.length];
  }

  const mutationRateMs = 900 + Math.floor(unitRandom(mutationSeed) * 3600);
  const mutationPhaseMs = unitRandom(cellSeed ^ 0x85ebca6b) * mutationRateMs;
  const isStaticTailGlyph = unitRandom(cellSeed ^ 0xc2b2ae35) < 0.45;
  const tick = isStaticTailGlyph
    ? 0
    : Math.floor((timeMs + mutationPhaseMs) / mutationRateMs);
  const seed = cellSeed ^ (passIndex * 1597334677) ^ (tick * 83492791);
  return GLYPHS[hashInteger(seed) % GLYPHS.length];
}

function hideCell(cell) {
  if (!cell.matrixVisible) {
    return;
  }

  cell.textContent = "";
  cell.className = "matrix-rain__cell";
  cell.style.setProperty("--matrix-opacity", "0");
  cell.matrixGlyph = "";
  cell.matrixHead = false;
  cell.matrixVisible = false;
}

function showCell(cell, { glyph, head, opacity }) {
  if (cell.matrixGlyph !== glyph) {
    cell.textContent = glyph;
    cell.matrixGlyph = glyph;
  }

  if (!cell.matrixVisible || cell.matrixHead !== head) {
    cell.className = head
      ? "matrix-rain__cell matrix-rain__cell--head"
      : "matrix-rain__cell";
    cell.matrixHead = head;
  }

  cell.style.setProperty("--matrix-opacity", opacity.toFixed(3));
  cell.matrixVisible = true;
}

function renderMatrixFrame({ cells, columnCount, rowCount, streams, timeMs }) {
  for (let column = 0; column < columnCount; column += 1) {
    const stream = streams[column];
    const progressRows = ((timeMs / 1000) * stream.speedRowsPerSecond) + stream.offsetRows;
    const headRow = (progressRows % stream.cycleLength) - stream.trailLength;
    const unwrappedHeadRow = progressRows - stream.trailLength;

    for (let row = 0; row < rowCount; row += 1) {
      const cell = cells[(row * columnCount) + column];
      const distanceFromHead = headRow - row;
      const isVisible = distanceFromHead >= 0 && distanceFromHead <= stream.trailLength;

      if (!isVisible) {
        hideCell(cell);
        continue;
      }

      const fadeProgress = distanceFromHead / stream.trailLength;
      const opacity = Math.max(0.08, 1 - fadeProgress);
      showCell(cell, {
        glyph: matrixGlyph({
          column,
          row,
          timeMs,
          distanceFromHead,
          headStep: Math.floor(unwrappedHeadRow),
          passIndex: Math.floor((unwrappedHeadRow - row) / stream.cycleLength),
        }),
        head: distanceFromHead < 1.25,
        opacity,
      });
    }
  }
}

function bootMatrixRain() {
  const rootElement = document.getElementById("matrix-rain-animation");
  if (!rootElement) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cells = createCells(rootElement, COLUMN_COUNT, ROW_COUNT);
  const streams = createColumnStreams(COLUMN_COUNT, ROW_COUNT);
  const mediaExport = registerMediaExport({
    fps: TARGET_FPS,
    id: MATRIX_EXPORT_ID,
    loopDurationMs: LOOP_DURATION_MS,
    seek(frameTimeMs) {
      stopAnimation();
      renderMatrixFrame({
        cells,
        columnCount: COLUMN_COUNT,
        rowCount: ROW_COUNT,
        streams,
        timeMs: frameTimeMs,
      });
    },
  });

  let animationFrameId = null;
  let elapsedOffsetMs = 0;
  let lastFrameTimeMs = 0;
  let startTimeMs = performance.now();

  function renderAtTime(timeMs) {
    renderMatrixFrame({
      cells,
      columnCount: COLUMN_COUNT,
      rowCount: ROW_COUNT,
      streams,
      timeMs,
    });
  }

  function stopAnimation() {
    if (animationFrameId === null) {
      return;
    }
    elapsedOffsetMs = performance.now() - startTimeMs;
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  function tick(timestampMs) {
    if (timestampMs - lastFrameTimeMs >= FRAME_DURATION_MS) {
      renderAtTime(timestampMs - startTimeMs);
      lastFrameTimeMs = timestampMs;
    }
    animationFrameId = window.requestAnimationFrame(tick);
  }

  renderAtTime(0);
  mediaExport.setReady({
    columns: COLUMN_COUNT,
    rows: ROW_COUNT,
  });

  function startAnimation() {
    if (reducedMotion || animationFrameId !== null) {
      return;
    }

    startTimeMs = performance.now() - elapsedOffsetMs;
    lastFrameTimeMs = 0;
    animationFrameId = window.requestAnimationFrame(tick);
  }

  attachViewportAnimationLifecycle({
    element: rootElement,
    pause() {
      stopAnimation();
    },
    resume() {
      startAnimation();
    },
  });
}

bootMatrixRain();
