function parseFiniteNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parsePoint(rawPoint) {
  const [xText, yText] = String(rawPoint).split(",").map((part) => part.trim());
  const x = Number.parseFloat(xText);
  const y = Number.parseFloat(yText);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
}

export function parsePointList(rawPoints) {
  if (!rawPoints) {
    return [];
  }

  return String(rawPoints)
    .split(";")
    .map((rawPoint) => parsePoint(rawPoint))
    .filter((point) => point !== null);
}

export function normalizeDomain({
  xMin = 0,
  xMax = 1,
  yMin = 0,
  yMax = 1,
} = {}) {
  const normalized = {
    xMin: parseFiniteNumber(xMin, 0),
    xMax: parseFiniteNumber(xMax, 1),
    yMin: parseFiniteNumber(yMin, 0),
    yMax: parseFiniteNumber(yMax, 1),
  };

  if (normalized.xMin === normalized.xMax) {
    normalized.xMax = normalized.xMin + 1;
  }

  if (normalized.yMin === normalized.yMax) {
    normalized.yMax = normalized.yMin + 1;
  }

  return normalized;
}

export function computePlotLayout({
  columns,
  rows,
  cellWidth,
  cellHeight,
  padLeft = 0,
  padRight = 0,
  padTop = 0,
  padBottom = 0,
}) {
  const plotLeft = padLeft * cellWidth;
  const plotTop = padTop * cellHeight;
  const plotWidth = columns * cellWidth;
  const plotHeight = rows * cellHeight;

  return {
    columns,
    rows,
    cellWidth,
    cellHeight,
    padLeft,
    padRight,
    padTop,
    padBottom,
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    canvasWidth: (columns + padLeft + padRight) * cellWidth,
    canvasHeight: (rows + padTop + padBottom) * cellHeight,
  };
}

export function projectPoint(point, domain, plotLayout) {
  const xRatio = (point.x - domain.xMin) / (domain.xMax - domain.xMin);
  const yRatio = (point.y - domain.yMin) / (domain.yMax - domain.yMin);

  return {
    x: plotLayout.plotLeft + (xRatio * plotLayout.plotWidth),
    y: plotLayout.plotTop + ((1 - yRatio) * plotLayout.plotHeight),
  };
}

export function dataPointToGrid(point, domain, plotLayout) {
  const xRatio = (point.x - domain.xMin) / (domain.xMax - domain.xMin);
  const yRatio = (point.y - domain.yMin) / (domain.yMax - domain.yMin);

  return {
    column: xRatio * plotLayout.columns,
    row: (1 - yRatio) * plotLayout.rows,
  };
}

export function gridPointToPixel(point, plotLayout) {
  return {
    x: plotLayout.plotLeft + (point.column * plotLayout.cellWidth),
    y: plotLayout.plotTop + (point.row * plotLayout.cellHeight),
  };
}

export function linePathData(points) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function smoothPathData(points, tension = 1) {
  if (points.length < 3) {
    return linePathData(points);
  }

  const clampedTension = Math.max(0, Math.min(tension, 1));
  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] || points[index];
    const current = points[index];
    const next = points[index + 1];
    const following = points[index + 2] || next;
    const control1 = {
      x: current.x + ((next.x - previous.x) / 6) * clampedTension,
      y: current.y + ((next.y - previous.y) / 6) * clampedTension,
    };
    const control2 = {
      x: next.x - ((following.x - current.x) / 6) * clampedTension,
      y: next.y - ((following.y - current.y) / 6) * clampedTension,
    };

    commands.push(`C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${next.x} ${next.y}`);
  }

  return commands.join(" ");
}
