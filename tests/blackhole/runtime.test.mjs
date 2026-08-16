import assert from "node:assert/strict";
import test from "node:test";

import {
  BLACKHOLE_WASM_INIT_PARAMETER_TYPES,
  blackholeWasmInitArguments,
  codepointsToFrame,
  destroyRendererAfter,
  formatRendererStatus,
  resolveBlackholeKeyboardAction,
  resolveSliderPointerIndex,
  resolveBlackholeOptions,
  sampleCenter,
  scheduleLiveFrame,
} from "../../src/art/blackhole_runtime.mjs";

test("simulation keyboard shortcuts follow platform conventions", () => {
  assert.equal(
    resolveBlackholeKeyboardAction({ key: "z", metaKey: true }),
    "undo",
  );
  assert.equal(
    resolveBlackholeKeyboardAction({ key: "Z", ctrlKey: true }),
    "undo",
  );
  assert.equal(
    resolveBlackholeKeyboardAction({ key: "z", metaKey: true, shiftKey: true }),
    "redo",
  );
  assert.equal(
    resolveBlackholeKeyboardAction({ key: "Y", ctrlKey: true }),
    "redo",
  );
  assert.equal(resolveBlackholeKeyboardAction({ key: "p" }), "toggle-playback");
  assert.equal(resolveBlackholeKeyboardAction({ key: "b" }), "focus-brush");
  assert.equal(
    resolveBlackholeKeyboardAction({ key: " ", code: "Space" }),
    null,
    "Space remains available for ordinary page scrolling",
  );
  assert.equal(resolveBlackholeKeyboardAction({ key: "r" }), "restart");
  assert.equal(resolveBlackholeKeyboardAction({ key: "C" }), "clear");

  assert.equal(
    resolveBlackholeKeyboardAction({ key: "r", ctrlKey: true }),
    null,
    "Ctrl/Command-R remains available for browser reload",
  );
  assert.equal(resolveBlackholeKeyboardAction({ key: "p", repeat: true }), null);
  assert.equal(
    resolveBlackholeKeyboardAction({ key: "p", editable: true }),
    null,
    "typing in a form control must not trigger a page shortcut",
  );
});

test("an in-flight GPU frame settles before its buffers are destroyed", async () => {
  let finishFrame;
  const frame = new Promise((resolve) => {
    finishFrame = resolve;
  });
  let destroyed = false;
  const renderer = {
    destroy() {
      destroyed = true;
    },
  };

  const disposal = destroyRendererAfter(renderer, frame);
  await Promise.resolve();
  assert.equal(destroyed, false);
  finishFrame();
  await disposal;
  assert.equal(destroyed, true);
});

test("WASM initialization has one shared scene-parameter contract", () => {
  const ringProfile = {
    ring_count: 5,
    ring_fill: 0.60,
    ring_edge: 0.04,
    ring_floor: 0,
    ring_irregularity: 0.65,
  };
  const argumentsForWasm = blackholeWasmInitArguments({
    width: 80,
    height: 40,
    incline: 2,
    fov: 60,
    distance: 80,
    roll: 0,
    glyphSet: "braille-stars",
    sampleCount: 6,
    ringProfile,
  });

  assert.deepEqual(
    argumentsForWasm,
    [80, 40, 2, 60, 80, 0, 2, 6, 5, 0.60, 0.04, 0, 0.65],
  );
  assert.equal(BLACKHOLE_WASM_INIT_PARAMETER_TYPES.length, argumentsForWasm.length);
  assert.ok(BLACKHOLE_WASM_INIT_PARAMETER_TYPES.every((type) => type === "number"));
});

test("an active pointer drag stays latched to its original slider row", () => {
  const pointerOverSecondSlider = {
    clientY: 70,
    sliderTop: 0,
    lineHeight: 20,
    sliderCount: 3,
    pointerId: 7,
  };

  assert.equal(resolveSliderPointerIndex(pointerOverSecondSlider), 1);
  assert.equal(
    resolveSliderPointerIndex({
      ...pointerOverSecondSlider,
      activePointerId: 7,
      activeSliderIndex: 0,
    }),
    0,
  );
  assert.equal(
    resolveSliderPointerIndex({
      ...pointerOverSecondSlider,
      pointerId: 8,
      activePointerId: 7,
      activeSliderIndex: 0,
    }),
    null,
  );
});

test("2x3 sampling addresses six region centers inside each logical cell", () => {
  assert.deepEqual(
    Array.from({ length: 6 }, (_, index) => sampleCenter(index, 2, 3)),
    [
      { x: 0.25, y: 1 / 6 },
      { x: 0.75, y: 1 / 6 },
      { x: 0.25, y: 0.5 },
      { x: 0.75, y: 0.5 },
      { x: 0.25, y: 5 / 6 },
      { x: 0.75, y: 5 / 6 },
    ],
  );
});

test("u32 renderer output preserves Braille codepoints and row boundaries", () => {
  assert.equal(
    codepointsToFrame(Uint32Array.of(0x2801, 0x2802, 65, 66), 2, 2),
    "⠁⠂\nAB",
  );
});

test("renderer status shows the backend without internal rendering parameters", () => {
  assert.equal(
    formatRendererStatus("webgpu", 60, 58, 61),
    "[webgpu] fps: 60 (↓58 ↑61)",
  );
  assert.equal(
    formatRendererStatus("wasm", 30, 28, 31),
    "[wasm] fps: 30 (↓28 ↑31)",
  );
});

test("query parameters can force a backend and glyph family", () => {
  const defaultRingProfile = {
    ring_count: 5,
    ring_fill: 0.60,
    ring_edge: 0.04,
    ring_floor: 0,
    ring_irregularity: 0.65,
  };
  assert.deepEqual(
    resolveBlackholeOptions(),
    {
      backend: "auto",
      glyphSet: "braille-stars",
      sampleCount: 6,
      ringProfile: defaultRingProfile,
    },
  );
  assert.deepEqual(
    resolveBlackholeOptions({
      search: "?blackhole-backend=nope&blackhole-glyphs=nope&blackhole-samples=5",
    }),
    {
      backend: "auto",
      glyphSet: "braille-stars",
      sampleCount: 6,
      ringProfile: defaultRingProfile,
    },
  );
  assert.deepEqual(
    resolveBlackholeOptions({
      search: "?blackhole-backend=wasm&blackhole-glyphs=ascii-braille&blackhole-samples=4&blackhole-ring-count=6&blackhole-ring-fill=0.55&blackhole-ring-edge=0.04&blackhole-ring-floor=0&blackhole-ring-irregularity=0.4",
    }),
    {
      backend: "wasm",
      glyphSet: "ascii-braille",
      sampleCount: 4,
      ringProfile: {
        ring_count: 6,
        ring_fill: 0.55,
        ring_edge: 0.04,
        ring_floor: 0,
        ring_irregularity: 0.4,
      },
    },
  );
});

test("live vsync schedules on requestAnimationFrame without a fixed FPS cap", () => {
  const calls = [];
  const callback = () => {};
  scheduleLiveFrame(callback, {
    vsync: true,
    requestAnimationFrame: (next) => calls.push(["raf", next]),
    setTimeout: (next, delay) => calls.push(["timeout", next, delay]),
  });

  assert.deepEqual(calls, [["raf", callback]]);
});
