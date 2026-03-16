import { renderAnimatedTextPane } from "../shared/animated_text_pane.mjs";
import { KERNEL_STAGES } from "./data.mjs";

export const FRAME_WIDTH_MIN = 40;
export const FRAME_WIDTH_MAX = 96;
export const CODE_LINE_COUNT = 20;
export const KERNEL_PANE_LINE_COUNT = CODE_LINE_COUNT + 2;
export const CHART_PLOT_HEIGHT = 16;
export const CHART_PANE_LINE_COUNT = CHART_PLOT_HEIGHT + 4;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function fitLine(text, width) {
  return text.slice(0, width).padEnd(width, " ");
}

function hashStringToUint32(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createMulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), state | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function easeInOut(progress) {
  return 0.5 - (Math.cos(Math.PI * progress) / 2);
}

function placeLabelsInLine(width, labels) {
  const characters = Array.from({ length: width }, () => " ");
  let lastEnd = -1;

  for (let index = 0; index < labels.length; index += 1) {
    const { position, text } = labels[index];
    const isEdgeLabel = index === 0 || index === labels.length - 1;
    if (text.length === 0 || text.length > width) {
      continue;
    }

    let start = clamp(
      position - Math.floor(text.length / 2),
      0,
      width - text.length,
    );

    if (start <= lastEnd) {
      if (!isEdgeLabel) {
        continue;
      }

      start = lastEnd + 1;
      if (start + text.length > width) {
        start = width - text.length;
      }
      if (start <= lastEnd) {
        continue;
      }
    }

    for (let characterIndex = 0; characterIndex < text.length; characterIndex += 1) {
      characters[start + characterIndex] = text[characterIndex];
    }
    lastEnd = start + text.length - 1;
  }

  return characters.join("");
}

function lerp(start, end, progress) {
  return start + ((end - start) * progress);
}

function codeLinesForStage(stage) {
  if (Array.isArray(stage.codeLines)) {
    return stage.codeLines;
  }
  return stage.code.split("\n");
}

function formatGflops(value) {
  return value.toFixed(1);
}

function resolvePlotWidth(totalWidth, leftOutsideWidth) {
  const minimumPlotWidth = 16;
  return Math.max(minimumPlotWidth, totalWidth - leftOutsideWidth - 1);
}

export function clampFrameWidth(availableColumns) {
  return clamp(availableColumns, FRAME_WIDTH_MIN, FRAME_WIDTH_MAX);
}

export function formatCodeBlock(stage, width) {
  const blockLines = codeLinesForStage(stage);
  const maximumWindowStart = Math.max(0, blockLines.length - CODE_LINE_COUNT);
  const windowStart = clamp(stage.windowStart ?? 0, 0, maximumWindowStart);
  const fittedLines = [];
  for (let index = 0; index < CODE_LINE_COUNT; index += 1) {
    fittedLines.push(fitLine(blockLines[windowStart + index] ?? "", width));
  }
  return fittedLines.join("\n");
}

const transitionOrderCache = new Map();

function transitionOrderKey(fromKernel, toKernel, width) {
  return `${fromKernel}->${toKernel}@${width}`;
}

function buildTransitionOrder(fromText, toText, cacheKey) {
  const cachedOrder = transitionOrderCache.get(cacheKey);
  if (cachedOrder) {
    return cachedOrder;
  }

  const mutableIndices = [];
  for (let index = 0; index < fromText.length; index += 1) {
    if (fromText[index] !== "\n" && toText[index] !== "\n") {
      mutableIndices.push(index);
    }
  }

  const random = createMulberry32(hashStringToUint32(cacheKey));
  for (let index = mutableIndices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = mutableIndices[index];
    mutableIndices[index] = mutableIndices[swapIndex];
    mutableIndices[swapIndex] = value;
  }

  transitionOrderCache.set(cacheKey, mutableIndices);
  return mutableIndices;
}

export function renderDiffusedCode({
  fromStage,
  toStage,
  progress,
  width,
}) {
  const sourceText = formatCodeBlock(fromStage, width);
  const targetText = formatCodeBlock(toStage, width);

  if (fromStage.kernel === toStage.kernel || progress <= 0) {
    return sourceText;
  }
  if (progress >= 1) {
    return targetText;
  }

  const revealProgress = easeInOut(progress);
  const characters = sourceText.split("");
  const transitionOrder = buildTransitionOrder(
    sourceText,
    targetText,
    transitionOrderKey(fromStage.kernel, toStage.kernel, width),
  );
  const revealCount = Math.floor(transitionOrder.length * revealProgress);

  for (let index = 0; index < revealCount; index += 1) {
    const transitionIndex = transitionOrder[index];
    characters[transitionIndex] = targetText[transitionIndex];
  }

  return characters.join("");
}

function renderPaneBorder(topOrBottomCharacter, innerWidth) {
  const horizontal = "─".repeat(innerWidth);
  return topOrBottomCharacter === "top"
    ? `┌${horizontal}┐`
    : `└${horizontal}┘`;
}

function resolveStagePair(stageIndex) {
  const clampedStageIndex = clamp(stageIndex, 0, KERNEL_STAGES.length - 1);
  return {
    currentStage: KERNEL_STAGES[clampedStageIndex],
    nextStage: KERNEL_STAGES[Math.min(clampedStageIndex + 1, KERNEL_STAGES.length - 1)],
  };
}

export function renderKernelPane({
  width,
  stageIndex,
  transitionProgress,
}) {
  const clampedWidth = clampFrameWidth(width);
  const innerWidth = clampedWidth - 2;
  const { currentStage, nextStage } = resolveStagePair(stageIndex);
  const codeBlock = renderDiffusedCode({
    fromStage: currentStage,
    toStage: nextStage,
    progress: clamp(transitionProgress, 0, 1),
    width: innerWidth,
  });

  return [
    renderPaneBorder("top", innerWidth),
    ...codeBlock.split("\n").map((line) => `│${line}│`),
    renderPaneBorder("bottom", innerWidth),
  ].join("\n");
}

export function renderScrollableKernelPane({
  width,
  stageIndex,
  transitionProgress,
  scrollOffset,
}) {
  const clampedWidth = clampFrameWidth(width);
  const { currentStage, nextStage } = resolveStagePair(stageIndex);

  return renderAnimatedTextPane({
    width: clampedWidth,
    viewportLineCount: CODE_LINE_COUNT,
    fromLines: codeLinesForStage(currentStage),
    toLines: codeLinesForStage(nextStage),
    progress: clamp(transitionProgress, 0, 1),
    scrollOffset,
    scrollbarCharacter: "█",
  });
}

function resolveXPosition(index, count, plotWidth) {
  if (count <= 1) {
    return (plotWidth - 1) / 2;
  }
  return (index * (plotWidth - 1)) / (count - 1);
}

function resolveRawYPosition(value, minimumValue, maximumValue, plotHeight) {
  if (maximumValue <= minimumValue) {
    return (plotHeight - 1) / 2;
  }

  const minimumLog = Math.log10(minimumValue);
  const maximumLog = Math.log10(maximumValue);
  const valueLog = Math.log10(value);
  const ratio = (valueLog - minimumLog) / (maximumLog - minimumLog);
  return (1 - ratio) * (plotHeight - 1);
}

function resolveUniqueRows(points, plotHeight) {
  if (points.length === 0) {
    return new Map();
  }

  const sortedByValueDescending = [...points].sort((left, right) => {
    return right.stage.gflops - left.stage.gflops;
  });
  const resolvedRows = new Map();
  let minimumRow = 0;

  for (let index = 0; index < sortedByValueDescending.length; index += 1) {
    const point = sortedByValueDescending[index];
    const remainingPoints = sortedByValueDescending.length - index - 1;
    const maximumRow = plotHeight - 1 - remainingPoints;
    const row = clamp(Math.round(point.yTarget), minimumRow, maximumRow);
    resolvedRows.set(point.stage.kernel, row);
    minimumRow = row + 1;
  }

  return resolvedRows;
}

function buildChartState(visibleStages, plotWidth, plotHeight) {
  const minimumValue = Math.min(...visibleStages.map((stage) => stage.gflops));
  const maximumValue = Math.max(...visibleStages.map((stage) => stage.gflops));

  return visibleStages.map((stage, index) => {
    return {
      stage,
      x: resolveXPosition(index, visibleStages.length, plotWidth),
      yTarget: resolveRawYPosition(stage.gflops, minimumValue, maximumValue, plotHeight),
    };
  });
}

function buildDisplayedChartPoints(stageIndex, transitionProgress, plotWidth, plotHeight) {
  const easedProgress = easeInOut(clamp(transitionProgress, 0, 1));
  const visibleStages = KERNEL_STAGES.slice(0, stageIndex + 1);
  const currentState = buildChartState(visibleStages, plotWidth, plotHeight);

  if (transitionProgress <= 0 || stageIndex >= KERNEL_STAGES.length - 1) {
    const resolvedRows = resolveUniqueRows(currentState, plotHeight);
    return currentState.map((point) => {
      return {
        ...point,
        x: Math.round(point.x),
        y: resolvedRows.get(point.stage.kernel),
      };
    });
  }

  const nextState = buildChartState(KERNEL_STAGES.slice(0, stageIndex + 2), plotWidth, plotHeight);
  const nextByKernel = new Map(nextState.map((point) => [point.stage.kernel, point]));
  const interpolatedPoints = currentState.map((point) => {
    const nextPoint = nextByKernel.get(point.stage.kernel);
    return {
      stage: point.stage,
      x: nextPoint
        ? lerp(point.x, nextPoint.x, easedProgress)
        : point.x,
      yTarget: nextPoint
        ? lerp(point.yTarget, nextPoint.yTarget, easedProgress)
        : point.yTarget,
    };
  });
  const resolvedRows = resolveUniqueRows(interpolatedPoints, plotHeight);

  return interpolatedPoints.map((point) => {
    return {
      ...point,
      x: Math.round(point.x),
      y: resolvedRows.get(point.stage.kernel),
    };
  });
}

function buildChartLeftPrefix(labelWidth, labelText, isTickRow) {
  if (!isTickRow) {
    return `${" ".repeat(labelWidth + 1)}│`;
  }
  return `${labelText.padStart(labelWidth, " ")} ┤`;
}

function buildChartBottomBorder(leftOutsideWidth, plotWidth, displayedPoints) {
  const borderCharacters = Array.from({ length: plotWidth }, () => "─");
  for (const point of displayedPoints) {
    borderCharacters[point.x] = "┬";
  }
  return `${" ".repeat(leftOutsideWidth - 1)}└${borderCharacters.join("")}┘`;
}

function buildChartLabelLine(leftOutsideWidth, plotWidth, displayedPoints, totalWidth) {
  const labels = displayedPoints.map((point) => {
    return {
      position: point.x,
      text: point.stage.kernel,
    };
  });
  return fitLine(
    `${" ".repeat(leftOutsideWidth)}${placeLabelsInLine(plotWidth, labels)}`,
    totalWidth,
  );
}

export function renderChartPane({
  width,
  stageIndex,
  transitionProgress,
}) {
  const clampedWidth = clampFrameWidth(width);
  const labelWidth = Math.max(
    "GFLOPs/s".length,
    ...KERNEL_STAGES.map((stage) => formatGflops(stage.gflops).length),
  );
  const leftOutsideWidth = Math.max(labelWidth + 2, 10);
  const plotWidth = resolvePlotWidth(clampedWidth, leftOutsideWidth);
  const displayedPoints = buildDisplayedChartPoints(
    clamp(stageIndex, 0, KERNEL_STAGES.length - 1),
    clamp(transitionProgress, 0, 1),
    plotWidth,
    CHART_PLOT_HEIGHT,
  );

  const grid = Array.from({ length: CHART_PLOT_HEIGHT }, () => {
    return Array.from({ length: plotWidth }, () => " ");
  });
  const pointByRow = new Map();

  for (const point of displayedPoints) {
    grid[point.y][point.x] = "*";
    const existingPoint = pointByRow.get(point.y);
    if (!existingPoint || point.stage.gflops > existingPoint.stage.gflops) {
      pointByRow.set(point.y, point);
    }
  }

  const lines = [fitLine("GFLOPs/s", clampedWidth)];
  lines.push(`${" ".repeat(leftOutsideWidth - 1)}┌${"─".repeat(plotWidth)}┐`);

  for (let rowIndex = 0; rowIndex < CHART_PLOT_HEIGHT; rowIndex += 1) {
    const point = pointByRow.get(rowIndex);
    const labelText = point ? formatGflops(point.stage.gflops) : "";
    const leftPrefix = buildChartLeftPrefix(labelWidth, labelText, point !== undefined);
    lines.push(`${leftPrefix}${grid[rowIndex].join("")}│`);
  }

  lines.push(buildChartBottomBorder(leftOutsideWidth, plotWidth, displayedPoints));
  lines.push(buildChartLabelLine(leftOutsideWidth, plotWidth, displayedPoints, clampedWidth));

  return lines.map((line) => fitLine(line, clampedWidth)).join("\n");
}
