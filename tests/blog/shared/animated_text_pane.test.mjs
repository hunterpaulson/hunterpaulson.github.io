import assert from "node:assert/strict";
import test from "node:test";

import {
  preserveScrollOffset,
  renderAnimatedTextPane,
  renderDiffusedDocumentLines,
} from "../../../src/blog/shared/animated_text_pane.mjs";

test("diffused document line endpoints match the source and target", () => {
  const fromText = [
    "alpha()",
    "beta()",
  ].join("\n");
  const toText = [
    "gamma()",
    "delta()",
  ].join("\n");

  assert.deepEqual(renderDiffusedDocumentLines({
    fromText,
    toText,
    progress: 0,
    lineWidth: 12,
  }), [
    "alpha()     ",
    "beta()      ",
  ]);

  assert.deepEqual(renderDiffusedDocumentLines({
    fromText,
    toText,
    progress: 1,
    lineWidth: 12,
  }), [
    "gamma()     ",
    "delta()     ",
  ]);
});

test("diffused document lines can transition to an empty document", () => {
  assert.deepEqual(renderDiffusedDocumentLines({
    fromText: ["alpha()", "beta()"].join("\n"),
    toText: "",
    progress: 1,
    lineWidth: 10,
  }), [
    "          ",
  ]);
});

test("scrollbar height does not expand until diffusion progress actually starts", () => {
  const pane = renderAnimatedTextPane({
    width: 18,
    viewportLineCount: 4,
    fromLines: ["a", "b"],
    toLines: ["1", "2", "3", "4", "5", "6", "7", "8"],
    progress: 0,
    scrollOffset: 0,
    scrollbarCharacter: "█",
  });

  assert.equal((pane.match(/█/g) ?? []).length, 0);
});

test("animated text pane renders a bordered fixed-size viewport", () => {
  const pane = renderAnimatedTextPane({
    width: 20,
    viewportLineCount: 4,
    documentLines: ["one", "two", "three", "four"],
    scrollOffset: 0,
    scrollbarCharacter: "█",
  });
  const lines = pane.split("\n");

  assert.equal(lines.length, 6);
  assert.equal(lines[0], "┌──────────────────┐");
  assert.equal(lines.at(-1), "└──────────────────┘");
  assert.match(pane, /│one\s+│/);
  assert.match(pane, /│four\s+│/);

  for (const line of lines) {
    assert.equal(line.length, 20);
  }
});

test("animated text pane supports scrolling with an internal scrollbar", () => {
  const pane = renderAnimatedTextPane({
    width: 18,
    viewportLineCount: 4,
    documentLines: [
      "line 1",
      "line 2",
      "line 3",
      "line 4",
      "line 5",
      "line 6",
      "line 7",
      "line 8",
    ],
    scrollOffset: 2,
    scrollbarCharacter: "█",
  });
  const lines = pane.split("\n");

  assert.match(lines[1], /line 3/);
  assert.match(lines[4], /line 6/);
  assert.equal((pane.match(/█/g) ?? []).length, 2);
});

test("preserveScrollOffset keeps the same relative reading position", () => {
  assert.equal(preserveScrollOffset({
    fromScrollOffset: 30,
    fromTotalLineCount: 100,
    toTotalLineCount: 40,
    viewportLineCount: 10,
  }), 10);

  assert.equal(preserveScrollOffset({
    fromScrollOffset: 0,
    fromTotalLineCount: 20,
    toTotalLineCount: 200,
    viewportLineCount: 8,
  }), 0);
});
