import assert from "node:assert/strict";
import test from "node:test";

import {
  DESKTOP_PROMPT_RULE_WIDTH,
  formatCompactPromptScene,
  shouldUseCompactPromptLayout,
} from "../../../src/blog/just-another-abstraction/prompt.mjs";

test("compact prompt layout wraps the typed prompt within narrow columns", () => {
  const rendered = formatCompactPromptScene({
    typed: "write a function that calculates the edit distance between two strings",
    columns: 32,
    cursorVisible: false,
    cursor: "█",
  });

  const lines = rendered.split("\n");
  assert.deepEqual(lines, [
    "* Compiling ...",
    "────────────────────────────────",
    "❯ write a function that",
    "  calculates the edit distance",
    "  between two strings",
    "────────────────────────────────",
    "  ⏵⏵ bypass permissions",
  ]);
  assert.ok(lines.every((line) => line.length <= 32));
});

test("compact prompt layout keeps the cursor in the wrapped prompt body", () => {
  const rendered = formatCompactPromptScene({
    typed: "write a function that calculates the edit distance between two strings",
    columns: 32,
    cursorVisible: true,
    cursor: "█",
  });

  assert.match(rendered, /strings█$/m);
});

test("compact prompt layout is only used below desktop prompt width", () => {
  assert.equal(shouldUseCompactPromptLayout(DESKTOP_PROMPT_RULE_WIDTH - 1), true);
  assert.equal(shouldUseCompactPromptLayout(DESKTOP_PROMPT_RULE_WIDTH), false);
});
