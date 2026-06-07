import assert from "node:assert/strict";
import test from "node:test";

import {
  AsciiBarChartRace,
  buildInterpolatedFrames,
} from "../../../src/blog/to-automate-someone/bar_chart_race.mjs";

function locateBarRow(frameText, barName) {
  const rows = frameText.split("\n");
  return rows.findIndex((row) => row.trimStart().startsWith(`${barName} `));
}

function extractBarRow(frameText, barName) {
  const rows = frameText.split("\n");
  return rows.find((row) => row.trimStart().startsWith(`${barName} `)) ?? "";
}

function valueFieldStartColumn(rowText) {
  const rightBorderColumn = rowText.lastIndexOf("│");
  if (rightBorderColumn < 0) {
    return -1;
  }
  return rightBorderColumn + 2;
}

test("interpolates values between known times", () => {
  const points = [
    { name: "a", time: 0, value: 5 },
    { name: "a", time: 2, value: 9 },
  ];

  const frames = buildInterpolatedFrames(points, { framesPerTimeUnit: 1 });
  const values = frames.map((frame) => frame.values.get("a"));

  assert.equal(frames.length, 3);
  assert.deepEqual(values, [5, 7, 9]);
});

test("value label column stays fixed when digit count changes", () => {
  const race = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 9 },
      { name: "a", time: 2, value: 11 },
      { name: "b", time: 0, value: 4 },
      { name: "b", time: 2, value: 4 },
    ],
    width: 52,
    framesPerTimeUnit: 1,
    topN: 2,
    gapRows: 1,
    rowSpeed: 1,
    showXAxisValues: false,
    showXAxisTicks: false,
    showTimeAxis: false,
    loop: false,
  });

  const frameA = race.renderCurrentFrame();
  const frameB = race.nextFrame();
  const frameC = race.nextFrame();

  const rowA = extractBarRow(frameA, "a");
  const rowB = extractBarRow(frameB, "a");
  const rowC = extractBarRow(frameC, "a");

  const valueColumnA = valueFieldStartColumn(rowA);
  const valueColumnB = valueFieldStartColumn(rowB);
  const valueColumnC = valueFieldStartColumn(rowC);

  assert.equal(valueColumnA, valueColumnB);
  assert.equal(valueColumnA, valueColumnC);
});

test("renders highest value at the top with one blank row gap", () => {
  const race = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 3 },
      { name: "a", time: 2, value: 3 },
      { name: "b", time: 0, value: 4 },
      { name: "b", time: 2, value: 4 },
    ],
    width: 48,
    framesPerTimeUnit: 1,
    topN: 2,
    gapRows: 1,
    rowSpeed: 1,
    showXAxisValues: false,
    showXAxisTicks: false,
    showTimeAxis: false,
    loop: false,
  });

  const frame = race.renderCurrentFrame();
  const topRow = locateBarRow(frame, "b");
  const bottomRow = locateBarRow(frame, "a");
  const rows = frame.split("\n");

  assert.ok(topRow >= 0);
  assert.equal(bottomRow - topRow, 2);
  assert.match(rows[topRow + 1].trim(), /^│\s*│$/);
});

test("renders top axis ticks on border and time caret above range", () => {
  const race = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 1 },
      { name: "a", time: 2, value: 3 },
      { name: "b", time: 0, value: 2 },
      { name: "b", time: 2, value: 2 },
    ],
    width: 58,
    framesPerTimeUnit: 1,
    topN: 2,
    xAxisTickCount: 4,
    showXAxisValues: true,
    showXAxisTicks: true,
    showTimeAxis: true,
    xAxisLabel: "value created",
    loop: false,
  });

  const withAxes = race.renderCurrentFrame();
  const rows = withAxes.split("\n");
  const labelIndex = rows.findIndex((row) => row.includes("value created"));
  const topBorderIndex = rows.findIndex((row) => row.includes("┌"));
  const detachedTickLine = rows.find((row) => row.includes("┴") && !row.includes("┌"));

  assert.ok(labelIndex >= 0);
  assert.ok(topBorderIndex >= 0);
  assert.ok(rows[topBorderIndex].includes("┴"));
  assert.equal(typeof detachedTickLine, "undefined");
  assert.ok(labelIndex < topBorderIndex);

  assert.ok(rows[rows.length - 2].includes("^"));
  assert.ok(rows[rows.length - 1].includes("0"));
  assert.equal(rows[rows.length - 1].includes("^"), false);

  const withoutAxes = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 1 },
      { name: "a", time: 2, value: 3 },
      { name: "b", time: 0, value: 2 },
      { name: "b", time: 2, value: 2 },
    ],
    width: 58,
    framesPerTimeUnit: 1,
    topN: 2,
    showXAxisValues: false,
    showXAxisTicks: false,
    showTimeAxis: false,
    loop: false,
  }).renderCurrentFrame();

  assert.equal(withoutAxes.includes("┴"), false);
  assert.equal(withoutAxes.includes("^"), false);
});

test("x-axis labels use integers for larger ranges", () => {
  const race = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 120 },
      { name: "a", time: 1, value: 120 },
      { name: "b", time: 0, value: 45 },
      { name: "b", time: 1, value: 45 },
    ],
    width: 56,
    framesPerTimeUnit: 1,
    topN: 2,
    xAxisTickCount: 4,
    showXAxisValues: true,
    showXAxisTicks: true,
    showTimeAxis: false,
    loop: false,
  });

  const firstLine = race.renderCurrentFrame().split("\n")[0];
  assert.equal(/\d+\.\d/.test(firstLine), false);
});

test("tick values stay fixed while positions move as frame max changes", () => {
  const race = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 120 },
      { name: "a", time: 1, value: 80 },
      { name: "b", time: 0, value: 60 },
      { name: "b", time: 1, value: 40 },
    ],
    width: 56,
    framesPerTimeUnit: 1,
    topN: 2,
    xScaleMode: "frame",
    xAxisTickCount: 4,
    showXAxisValues: true,
    showXAxisTicks: true,
    showTimeAxis: false,
    loop: false,
  });

  const firstAxisLine = race.renderCurrentFrame().split("\n")[0];
  const secondAxisLine = race.nextFrame().split("\n")[0];

  const firstTick50Position = firstAxisLine.indexOf("50");
  const secondTick50Position = secondAxisLine.indexOf("50");
  assert.ok(firstTick50Position >= 0);
  assert.ok(secondTick50Position >= 0);
  assert.notEqual(firstTick50Position, secondTick50Position);
});

test("x-axis labels can include decimals for very small ranges", () => {
  const race = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 0.08 },
      { name: "a", time: 1, value: 0.08 },
      { name: "b", time: 0, value: 0.03 },
      { name: "b", time: 1, value: 0.03 },
    ],
    width: 56,
    framesPerTimeUnit: 1,
    topN: 2,
    xScaleMode: "frame",
    xAxisTickCount: 5,
    showXAxisValues: true,
    showXAxisTicks: true,
    showTimeAxis: false,
    loop: false,
  });

  const firstAxisLine = race.renderCurrentFrame().split("\n")[0];
  assert.ok(firstAxisLine.includes("0.05") || firstAxisLine.includes("0.02"));
});

test("bar swaps move at most one row per frame and can reverse", () => {
  const race = new AsciiBarChartRace({
    points: [
      { name: "a", time: 0, value: 5 },
      { name: "a", time: 1, value: 1 },
      { name: "a", time: 2, value: 5 },
      { name: "b", time: 0, value: 1 },
      { name: "b", time: 1, value: 5 },
      { name: "b", time: 2, value: 1 },
    ],
    width: 52,
    framesPerTimeUnit: 1,
    topN: 2,
    gapRows: 1,
    rowSpeed: 1,
    showXAxisValues: false,
    showXAxisTicks: false,
    showTimeAxis: false,
    loop: false,
  });

  const frames = [race.renderCurrentFrame()];
  for (let step = 0; step < 5; step += 1) {
    frames.push(race.nextFrame());
  }

  const rowHistoryA = frames.map((frame) => locateBarRow(frame, "a"));
  const rowHistoryB = frames.map((frame) => locateBarRow(frame, "b"));

  for (let index = 1; index < rowHistoryA.length; index += 1) {
    assert.ok(Math.abs(rowHistoryA[index] - rowHistoryA[index - 1]) <= 1);
    assert.ok(Math.abs(rowHistoryB[index] - rowHistoryB[index - 1]) <= 1);
    assert.notEqual(rowHistoryA[index], rowHistoryB[index]);
  }

  const finalFrame = frames[frames.length - 1];
  const finalRowA = locateBarRow(finalFrame, "a");
  const finalRowB = locateBarRow(finalFrame, "b");
  assert.ok(finalRowA < finalRowB);
  assert.equal(finalRowB - finalRowA, 2);
});
