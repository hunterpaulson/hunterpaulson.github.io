import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInterpolatedSegmentFrames,
  SegmentedAsciiScenarioChart,
} from "../../../src/blog/to-automate-someone/automation_futures_simulation.mjs";

function findRow(frame, rowName) {
  return frame.rows.find((row) => row.name === rowName);
}

function findRenderedRow(frameText, rowName) {
  return frameText
    .split("\n")
    .find((line) => line.trimStart().startsWith(`${rowName} `)) ?? "";
}

function locateRenderedRowIndex(frameText, rowName) {
  return frameText
    .split("\n")
    .findIndex((line) => line.trimStart().startsWith(`${rowName} `));
}

test("interpolates segment values between known times", () => {
  const points = [
    {
      name: "ai + you",
      time: 0,
      segments: [
        { key: "ai", character: "░", value: 4 },
      ],
    },
    {
      name: "ai + you",
      time: 2,
      segments: [
        { key: "ai", character: "░", value: 8 },
      ],
    },
  ];

  const build = buildInterpolatedSegmentFrames(points, { framesPerTimeUnit: 1 });
  const midFrame = build.frames[1];
  const midRow = findRow(midFrame, "ai + you");
  const aiSegment = midRow.segments.find((segment) => segment.key === "ai");

  assert.equal(build.frames.length, 3);
  assert.equal(aiSegment.value, 6);
  assert.equal(midRow.total, 6);
});

test("renders multi-character segments in one bar", () => {
  const chart = new SegmentedAsciiScenarioChart({
    points: [
      {
        name: "ai + you",
        time: 0,
        segments: [
          { key: "ai", character: "░", value: 8 },
          { key: "human", character: "█", value: 10 },
          { key: "synergy", character: "+", value: 4 },
        ],
      },
    ],
    width: 64,
    showTimeAxis: false,
    loop: false,
  });

  const frame = chart.renderCurrentFrame();
  const row = findRenderedRow(frame, "ai + you");

  assert.ok(row.includes("░"));
  assert.ok(row.includes("█"));
  assert.ok(row.includes("+"));
});

test("negative synergy renders '-' and lowers net value", () => {
  const chart = new SegmentedAsciiScenarioChart({
    points: [
      {
        name: "ai + you",
        time: 0,
        segments: [
          { key: "ai", character: "░", value: 12 },
          { key: "human", character: "█", value: 10 },
          { key: "synergy_negative", character: "-", value: -6 },
        ],
      },
    ],
    width: 64,
    showTimeAxis: false,
    loop: false,
  });

  const frame = chart.renderCurrentFrame();
  const row = findRenderedRow(frame, "ai + you");

  assert.ok(row.includes("-"));
  assert.ok(/\s16\s*$/.test(row));
});

test("log-like tick labels stay stable while positions move", () => {
  const chart = new SegmentedAsciiScenarioChart({
    points: [
      {
        name: "ai alone",
        time: 0,
        segments: [
          { key: "ai", character: "░", value: 120 },
        ],
      },
      {
        name: "ai alone",
        time: 1,
        segments: [
          { key: "ai", character: "░", value: 80 },
        ],
      },
    ],
    width: 64,
    xScaleMode: "frame",
    showTimeAxis: false,
    loop: false,
  });

  const firstAxisLine = chart.renderCurrentFrame().split("\n")[0];
  const secondAxisLine = chart.nextFrame().split("\n")[0];
  const firstTick50 = firstAxisLine.indexOf("50");
  const secondTick50 = secondAxisLine.indexOf("50");

  assert.ok(firstTick50 >= 0);
  assert.ok(secondTick50 >= 0);
  assert.notEqual(firstTick50, secondTick50);
});

test("small ranges can show decimal tick labels", () => {
  const chart = new SegmentedAsciiScenarioChart({
    points: [
      {
        name: "ai alone",
        time: 0,
        segments: [
          { key: "ai", character: "░", value: 0.08 },
        ],
      },
      {
        name: "ai alone",
        time: 1,
        segments: [
          { key: "ai", character: "░", value: 0.08 },
        ],
      },
    ],
    width: 64,
    xScaleMode: "frame",
    showTimeAxis: false,
    loop: false,
  });

  const axisLine = chart.renderCurrentFrame().split("\n")[0];
  assert.ok(axisLine.includes("0.05") || axisLine.includes("0.02"));
});

test("keeps the longest row on top and swaps smoothly", () => {
  const chart = new SegmentedAsciiScenarioChart({
    points: [
      {
        name: "alpha",
        time: 0,
        segments: [
          { key: "alpha", character: "█", value: 12 },
        ],
      },
      {
        name: "alpha",
        time: 2,
        segments: [
          { key: "alpha", character: "█", value: 4 },
        ],
      },
      {
        name: "beta",
        time: 0,
        segments: [
          { key: "beta", character: "░", value: 4 },
        ],
      },
      {
        name: "beta",
        time: 2,
        segments: [
          { key: "beta", character: "░", value: 12 },
        ],
      },
    ],
    width: 56,
    framesPerTimeUnit: 1,
    gapRows: 1,
    showXAxisValues: false,
    showXAxisTicks: false,
    showTimeAxis: false,
    loop: false,
  });

  const frames = [chart.renderCurrentFrame()];
  for (let step = 0; step < 6; step += 1) {
    frames.push(chart.nextFrame());
  }

  const alphaRows = frames.map((frame) => locateRenderedRowIndex(frame, "alpha"));
  const betaRows = frames.map((frame) => locateRenderedRowIndex(frame, "beta"));

  assert.ok(alphaRows[0] < betaRows[0]);

  for (let index = 1; index < alphaRows.length; index += 1) {
    assert.ok(Math.abs(alphaRows[index] - alphaRows[index - 1]) <= 1);
    assert.ok(Math.abs(betaRows[index] - betaRows[index - 1]) <= 1);
    assert.notEqual(alphaRows[index], betaRows[index]);
  }

  const finalFrame = frames[frames.length - 1];
  assert.ok(locateRenderedRowIndex(finalFrame, "beta") < locateRenderedRowIndex(finalFrame, "alpha"));
});

test("can hide y values, x-axis numbers, and time numbers", () => {
  const chart = new SegmentedAsciiScenarioChart({
    points: [
      {
        name: "you alone",
        time: 0,
        segments: [
          { key: "human", character: "█", value: 10 },
        ],
      },
      {
        name: "ai alone",
        time: 0,
        segments: [
          { key: "ai", character: "░", value: 6 },
        ],
      },
    ],
    width: 64,
    showRowValues: false,
    showXAxisValues: false,
    showXAxisTicks: true,
    showTimeAxis: true,
    showTimeValues: false,
    loop: false,
  });

  const frame = chart.renderCurrentFrame();
  const lines = frame.split("\n");
  const row = findRenderedRow(frame, "you alone");

  assert.ok(row.trimEnd().endsWith("│"));
  assert.equal(/\d/.test(lines[0]), false);
  assert.equal(frame.includes("t="), false);
  assert.ok(lines[lines.length - 1].includes("^"));
});
