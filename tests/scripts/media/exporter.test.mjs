import assert from "node:assert/strict";
import test from "node:test";

import {
  combineBoundingBoxes,
  convertViewportClipToPageClip,
  resolveDurationMs,
} from "../../../scripts/media/exporter.mjs";

test("combineBoundingBoxes unions multiple clips with margin", () => {
  const clip = combineBoundingBoxes([
    { x: 10, y: 15, width: 30, height: 20 },
    { x: 44, y: 8, width: 12, height: 50 },
  ], 4);

  assert.deepEqual(clip, {
    x: 6,
    y: 4,
    width: 54,
    height: 58,
  });
});

test("resolveDurationMs prefers CLI override over preset and loop metadata", () => {
  assert.equal(resolveDurationMs({
    cliDurationMs: 5000,
    presetDurationMs: 6000,
    loopDurationMs: 7000,
  }), 5000);
  assert.equal(resolveDurationMs({
    cliDurationMs: null,
    presetDurationMs: 6000,
    loopDurationMs: 7000,
  }), 6000);
  assert.equal(resolveDurationMs({
    cliDurationMs: null,
    presetDurationMs: null,
    loopDurationMs: 7000,
  }), 7000);
});

test("convertViewportClipToPageClip adds the current page scroll offset", () => {
  const clip = convertViewportClipToPageClip({
    viewportClip: { x: 12, y: 34, width: 56, height: 78 },
    scrollX: 90,
    scrollY: 1200,
  });

  assert.deepEqual(clip, {
    x: 102,
    y: 1234,
    width: 56,
    height: 78,
  });
});
