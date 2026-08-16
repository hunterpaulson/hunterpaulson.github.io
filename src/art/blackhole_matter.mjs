export const MATTER_WIDTH = 80;
export const MATTER_HEIGHT = 40;
export const MATTER_THRESHOLD = 0.20;
export const MATTER_EDITOR_RADIUS = 40;
export const MATTER_MAX_BRUSH_SIZE = 9;

const INNER_DISK_RADIUS = 6;
const OUTER_DISK_RADIUS = MATTER_EDITOR_RADIUS;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function normalizeBrushSize(value) {
  const requested = Math.round(Number(value)) || 1;
  const bounded = clamp(requested, 1, MATTER_MAX_BRUSH_SIZE);
  return bounded % 2 === 0
    ? Math.min(MATTER_MAX_BRUSH_SIZE, bounded + 1)
    : bounded;
}

export function brushSizeFromInput(value, currentBrushSize) {
  return String(value).trim() === ""
    ? normalizeBrushSize(currentBrushSize)
    : normalizeBrushSize(value);
}

function wrapAngle(angle) {
  return angle - 2 * Math.PI * Math.floor((angle + Math.PI) / (2 * Math.PI));
}

function smoothWindow(distance) {
  const value = Math.max(0, 1 - Math.abs(distance));
  return value * value * (3 - 2 * value);
}

function angularLobe(angle, halfWidth) {
  return smoothWindow(wrapAngle(angle) / halfWidth);
}

export function createSpiralMatterField({
  width = MATTER_WIDTH,
  height = MATTER_HEIGHT,
} = {}) {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new RangeError("matter field dimensions must be positive integers");
  }

  const field = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const diskY = 1 - 2 * ((y + 0.5) / height);
    for (let x = 0; x < width; x += 1) {
      const diskX = 2 * ((x + 0.5) / width) - 1;
      const radius = Math.hypot(diskX, diskY) * MATTER_EDITOR_RADIUS;
      if (radius < INNER_DISK_RADIUS || radius > OUTER_DISK_RADIUS) {
        continue;
      }

      const radialPosition = (radius - INNER_DISK_RADIUS) /
        (OUTER_DISK_RADIUS - INNER_DISK_RADIUS);
      const phi = Math.atan2(diskY, diskX) + Math.PI / 2;
      const innerEmphasis = 1 - radialPosition;
      const innerArea = innerEmphasis * innerEmphasis;
      const ridgeWidth = 0.36 + 0.48 * innerArea;
      const wakeWidth = 0.95 + 0.30 * innerEmphasis;
      const angle = wrapAngle(phi + 7.5 * radialPosition - 0.45);
      const ridge = angularLobe(angle, ridgeWidth);
      const wake = 0.48 * angularLobe(angle - 0.62, wakeWidth);
      field[y * width + x] = Math.max(ridge, wake);
    }
  }
  return field;
}

export function matterFieldToText(
  field,
  width = MATTER_WIDTH,
  height = MATTER_HEIGHT,
  threshold = MATTER_THRESHOLD,
) {
  if (field.length !== width * height) {
    throw new RangeError("matter field size does not match its dimensions");
  }

  const rows = [];
  for (let y = 0; y < height; y += 1) {
    let row = "";
    for (let x = 0; x < width; x += 1) {
      row += field[y * width + x] >= threshold ? "█" : " ";
    }
    rows.push(row);
  }
  return rows.join("\n");
}

export function matterCellFromPointer({
  clientX,
  clientY,
  left,
  top,
  charWidth,
  lineHeight,
  width = MATTER_WIDTH,
  height = MATTER_HEIGHT,
}) {
  if (!(charWidth > 0) || !(lineHeight > 0)) {
    throw new RangeError("drawing cell dimensions must be positive");
  }

  return {
    x: clamp(Math.floor((clientX - left) / charWidth), 0, width - 1),
    y: clamp(Math.floor((clientY - top) / lineHeight), 0, height - 1),
  };
}

export function paintMatterLine(
  field,
  width,
  height,
  start,
  end,
  value = 1,
  brushSize = 1,
) {
  if (field.length !== width * height) {
    throw new RangeError("matter field size does not match its dimensions");
  }

  let x = clamp(Math.round(start.x), 0, width - 1);
  let y = clamp(Math.round(start.y), 0, height - 1);
  const targetX = clamp(Math.round(end.x), 0, width - 1);
  const targetY = clamp(Math.round(end.y), 0, height - 1);
  const stepX = x < targetX ? 1 : -1;
  const stepY = y < targetY ? 1 : -1;
  const deltaX = Math.abs(targetX - x);
  const deltaY = -Math.abs(targetY - y);
  let error = deltaX + deltaY;
  const density = clamp(value, 0, 1);
  const diameter = normalizeBrushSize(brushSize);
  const radius = (diameter - 1) / 2;

  function paintBrush(centerX, centerY) {
    const extent = Math.ceil(radius);
    for (let offsetY = -extent; offsetY <= extent; offsetY += 1) {
      for (let offsetX = -extent; offsetX <= extent; offsetX += 1) {
        if (offsetX * offsetX + offsetY * offsetY > radius * radius) {
          continue;
        }
        const brushX = centerX + offsetX;
        const brushY = centerY + offsetY;
        if (brushX >= 0 && brushX < width && brushY >= 0 && brushY < height) {
          field[brushY * width + brushX] = density;
        }
      }
    }
  }

  while (true) {
    paintBrush(x, y);
    if (x === targetX && y === targetY) {
      break;
    }
    const doubledError = 2 * error;
    if (doubledError >= deltaY) {
      error += deltaY;
      x += stepX;
    }
    if (doubledError <= deltaX) {
      error += deltaX;
      y += stepY;
    }
  }
}
