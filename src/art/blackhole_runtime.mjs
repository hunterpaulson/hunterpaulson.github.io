const VALID_BACKENDS = new Set(["auto", "webgpu", "wasm"]);
const VALID_GLYPH_SETS = new Set([
  "ascii",
  "braille-stars",
  "contour-stars",
  "ascii-braille",
]);
const VALID_SAMPLE_COUNTS = new Set([1, 4, 6]);

export const BLACKHOLE_WASM_INIT_PARAMETER_TYPES = Object.freeze(
  Array.from({ length: 13 }, () => "number"),
);

export function resolveBlackholeKeyboardAction({
  key = "",
  metaKey = false,
  ctrlKey = false,
  shiftKey = false,
  altKey = false,
  repeat = false,
  editable = false,
} = {}) {
  if (repeat || altKey || editable) {
    return null;
  }

  const normalizedKey = key.toLowerCase();
  const primaryModifier = metaKey || ctrlKey;
  if (primaryModifier) {
    if (normalizedKey === "z") {
      return shiftKey ? "redo" : "undo";
    }
    if (ctrlKey && !metaKey && normalizedKey === "y" && !shiftKey) {
      return "redo";
    }
    return null;
  }

  if (shiftKey) {
    return null;
  }
  if (normalizedKey === "p") {
    return "toggle-playback";
  }
  if (normalizedKey === "r") {
    return "restart";
  }
  if (normalizedKey === "c") {
    return "clear";
  }
  if (normalizedKey === "b") {
    return "focus-brush";
  }
  return null;
}

export function resolveSliderPointerIndex({
  clientY,
  sliderTop,
  lineHeight,
  sliderCount,
  pointerId,
  activePointerId = null,
  activeSliderIndex = null,
}) {
  if (activePointerId !== null) {
    if (pointerId !== activePointerId || activeSliderIndex === null) {
      return null;
    }

    return Math.max(0, Math.min(sliderCount - 1, activeSliderIndex));
  }

  const totalRows = sliderCount * 2;
  const row = Math.max(
    0,
    Math.min(totalRows - 1, Math.floor((clientY - sliderTop) / lineHeight)),
  );
  return Math.floor(row / 2);
}

const DEFAULT_RING_PROFILE = Object.freeze({
  ring_count: 5,
  ring_fill: 0.60,
  ring_edge: 0.04,
  ring_floor: 0,
  ring_irregularity: 0.65,
});

function numberInRange(value, fallback, min, max) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max
    ? numeric
    : fallback;
}

export function sampleCenter(sampleIndex, columns, rows) {
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= columns * rows) {
    throw new RangeError("sample index is outside the sub-cell grid");
  }

  return {
    x: ((sampleIndex % columns) + 0.5) / columns,
    y: (Math.floor(sampleIndex / columns) + 0.5) / rows,
  };
}

export function codepointsToFrame(codepoints, width, height) {
  if (codepoints.length < width * height) {
    throw new RangeError("renderer output is smaller than the logical frame");
  }

  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const start = y * width;
    rows.push(String.fromCodePoint(...codepoints.subarray(start, start + width)));
  }
  return rows.join("\n");
}

export function blackholeWasmInitArguments({
  width,
  height,
  incline,
  fov,
  distance,
  roll,
  glyphSet,
  sampleCount,
  ringProfile,
}) {
  const glyphSetCode = glyphSet === "ascii-braille"
    ? 1
    : glyphSet === "braille-stars"
      ? 2
      : glyphSet === "contour-stars" ? 3 : 0;

  return [
    width,
    height,
    incline,
    fov,
    distance,
    roll,
    glyphSetCode,
    sampleCount,
    ringProfile.ring_count,
    ringProfile.ring_fill,
    ringProfile.ring_edge,
    ringProfile.ring_floor,
    ringProfile.ring_irregularity,
  ];
}

export function formatRendererStatus(backend, currentFps, minFps, maxFps) {
  return `[${backend}] fps: ${currentFps} (↓${minFps} ↑${maxFps})`;
}

export function resolveBlackholeOptions({
  search = "",
  backend,
  glyphSet,
  sampleCount,
  ringProfile = {},
} = {}) {
  const query = new URLSearchParams(search);
  const requestedBackend = backend ?? query.get("blackhole-backend") ?? "auto";
  const requestedGlyphSet = glyphSet ?? query.get("blackhole-glyphs") ?? "braille-stars";
  const requestedSampleCount = Number(sampleCount ?? query.get("blackhole-samples") ?? 6);

  return {
    backend: VALID_BACKENDS.has(requestedBackend) ? requestedBackend : "auto",
    glyphSet: VALID_GLYPH_SETS.has(requestedGlyphSet) ? requestedGlyphSet : "braille-stars",
    sampleCount: VALID_SAMPLE_COUNTS.has(requestedSampleCount) ? requestedSampleCount : 6,
    ringProfile: {
      ring_count: numberInRange(
        ringProfile.ring_count ?? query.get("blackhole-ring-count"),
        DEFAULT_RING_PROFILE.ring_count,
        1,
        16,
      ),
      ring_fill: numberInRange(
        ringProfile.ring_fill ?? query.get("blackhole-ring-fill"),
        DEFAULT_RING_PROFILE.ring_fill,
        0.05,
        0.95,
      ),
      ring_edge: numberInRange(
        ringProfile.ring_edge ?? query.get("blackhole-ring-edge"),
        DEFAULT_RING_PROFILE.ring_edge,
        0.001,
        0.25,
      ),
      ring_floor: numberInRange(
        ringProfile.ring_floor ?? query.get("blackhole-ring-floor"),
        DEFAULT_RING_PROFILE.ring_floor,
        0,
        1,
      ),
      ring_irregularity: numberInRange(
        ringProfile.ring_irregularity ?? query.get("blackhole-ring-irregularity"),
        DEFAULT_RING_PROFILE.ring_irregularity,
        0,
        1,
      ),
    },
  };
}

export function scheduleLiveFrame(callback, {
  vsync,
  requestAnimationFrame,
  setTimeout,
}) {
  if (vsync) {
    return { kind: "raf", id: requestAnimationFrame(callback) };
  }

  return { kind: "timeout", id: setTimeout(callback, 0) };
}

export async function destroyRendererAfter(renderer, inFlightFrame) {
  try {
    await inFlightFrame;
  } catch (_error) {
  }
  renderer.destroy();
}
