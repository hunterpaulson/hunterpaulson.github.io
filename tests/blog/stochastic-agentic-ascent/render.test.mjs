import assert from "node:assert/strict";
import test from "node:test";

import {
  CUBLAS_REFERENCE,
  KERNEL_STAGES,
  MAX_CLEANED_KERNEL_LINES,
  UPSTREAM_COMMIT,
} from "../../../src/blog/stochastic-agentic-ascent/data.mjs";
import {
  CHART_PANE_LINE_COUNT,
  CODE_LINE_COUNT,
  formatCodeBlock,
  renderDiffusedCode,
  renderChartPane,
  renderKernelPane,
  renderScrollableKernelPane,
} from "../../../src/blog/stochastic-agentic-ascent/render.mjs";

test("optimizer kernel stages cover all ten CUDA kernels", () => {
  assert.equal(KERNEL_STAGES.length, 10);
  assert.deepEqual(
    KERNEL_STAGES.map((stage) => stage.kernel),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  );
  assert.ok(KERNEL_STAGES.at(-1).gflops < CUBLAS_REFERENCE.gflops);
  assert.equal(typeof UPSTREAM_COMMIT, "string");
  assert.equal(UPSTREAM_COMMIT.length, 40);
  assert.equal(MAX_CLEANED_KERNEL_LINES, 87);
});

test("generated kernel metadata exposes cleaned upstream lines", () => {
  for (const stage of KERNEL_STAGES) {
    assert.ok(Array.isArray(stage.codeLines));
    assert.equal(stage.codeLines.length, stage.cleanedLineCount);
    assert.match(stage.vendoredPath, /^scripts\/blog\/stochastic-agentic-ascent\/upstream\/.+\.cuh$/);
    assert.match(stage.sourceUrl, new RegExp(UPSTREAM_COMMIT));
  }
});

test("formatted code blocks always use a fixed line count", () => {
  const block = formatCodeBlock(KERNEL_STAGES[0], 72);
  const lines = block.split("\n");

  assert.equal(lines.length, CODE_LINE_COUNT);
  for (const line of lines) {
    assert.equal(line.length, 72);
  }
});

test("diffusion endpoints match the original and target kernels", () => {
  const width = 72;
  const sourceBlock = formatCodeBlock(KERNEL_STAGES[2], width);
  const targetBlock = formatCodeBlock(KERNEL_STAGES[3], width);

  assert.equal(renderDiffusedCode({
    fromStage: KERNEL_STAGES[2],
    toStage: KERNEL_STAGES[3],
    progress: 0,
    width,
  }), sourceBlock);

  assert.equal(renderDiffusedCode({
    fromStage: KERNEL_STAGES[2],
    toStage: KERNEL_STAGES[3],
    progress: 1,
    width,
  }), targetBlock);
});

test("kernel pane is just the bordered code viewport", () => {
  const pane = renderKernelPane({
    width: 80,
    stageIndex: 4,
    transitionProgress: 0.5,
  });
  const lines = pane.split("\n");

  assert.equal(lines.length, CODE_LINE_COUNT + 2);
  assert.match(lines[0], /^┌/);
  assert.match(lines.at(-1), /^└/);
  assert.doesNotMatch(pane, /optimizer|objective|cuBLAS|GFLOPs\/s/);

  for (const line of lines) {
    assert.equal(line.length, 80);
  }
});

test("scrollable kernel pane uses the shared pane scrollbar", () => {
  const pane = renderScrollableKernelPane({
    width: 80,
    stageIndex: 9,
    transitionProgress: 0,
    scrollOffset: 20,
  });
  const lines = pane.split("\n");

  assert.equal(lines.length, CODE_LINE_COUNT + 2);
  assert.match(pane, /█/);
  assert.match(pane, /wt::storeToGmem|warpRow|threadResults/);

  for (const line of lines) {
    assert.equal(line.length, 80);
  }
});

test("chart pane renders labels outside the box with one point per kernel", () => {
  const pane = renderChartPane({
    width: 80,
    stageIndex: 9,
    transitionProgress: 0,
  });
  const lines = pane.split("\n");

  assert.equal(lines.length, CHART_PANE_LINE_COUNT);
  assert.equal(lines[0].trim(), "GFLOPs/s");
  assert.match(lines[1], /┌/);
  assert.match(lines.at(-2), /└.*┬/);
  assert.match(lines.at(-1), /1.*2.*3.*4.*5.*6.*7.*8.*9.*10/);
  assert.equal((pane.match(/\*/g) ?? []).length, 10);
  assert.match(pane, /21779\.3/);
  assert.match(pane, /309\.0/);
  assert.doesNotMatch(pane, /[⠁⠂⠄]/);
  assert.doesNotMatch(pane, /┈|\b300\b|\b1k\b|\b3k\b|\b10k\b|\b30k\b/);
  assert.doesNotMatch(pane, /objective|cuBLAS/);

  for (const line of lines) {
    assert.equal(line.length, 80);
  }
});

test("chart transition moves existing points before revealing the next one", () => {
  const pane = renderChartPane({
    width: 80,
    stageIndex: 4,
    transitionProgress: 0.6,
  });

  assert.equal((pane.match(/\*/g) ?? []).length, 5);
  assert.doesNotMatch(pane, /18237\.3/);
  assert.doesNotMatch(pane, /\b6\b.*\b7\b.*\b8\b.*\b9\b.*\b10\b/);
});

test("compact chart pane still fits narrow mobile widths", () => {
  const pane = renderChartPane({
    width: 40,
    stageIndex: 6,
    transitionProgress: 0.35,
  });
  const lines = pane.split("\n");

  assert.equal(lines.length, CHART_PANE_LINE_COUNT);
  for (const line of lines) {
    assert.equal(line.length, 40);
  }
});
