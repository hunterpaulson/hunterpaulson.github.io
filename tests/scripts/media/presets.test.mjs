import assert from "node:assert/strict";
import test from "node:test";

import { listMediaPresets } from "../../../scripts/media/presets.mjs";

test("media presets have matching output extensions", () => {
  for (const preset of listMediaPresets()) {
    if (preset.kind === "gif") {
      assert.match(preset.outputPath, /\.gif$/);
      continue;
    }

    assert.match(preset.outputPath, /\.png$/);
  }
});

test("media presets only expose supported kinds", () => {
  for (const preset of listMediaPresets()) {
    assert.match(preset.kind, /^(gif|png)$/);
  }
});

test("media presets use unique names", () => {
  const names = listMediaPresets().map((preset) => preset.name);
  assert.equal(new Set(names).size, names.length);
});
