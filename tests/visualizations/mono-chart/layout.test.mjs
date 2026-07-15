import assert from "node:assert/strict";
import test from "node:test";

import * as monoChartLayout from "../../../src/visualizations/mono-chart/layout.mjs";

const {
  computePlotLayout,
  dataPointToGrid,
  gridPointToPixel,
  linePathData,
  normalizeDomain,
  parsePointList,
  projectPoint,
  smoothPathData,
} = monoChartLayout;

function assertClose(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

test("chart points project from data coordinates into the padded plot box", () => {
  const plot = computePlotLayout({
    columns: 40,
    rows: 10,
    cellWidth: 8,
    cellHeight: 20,
    padLeft: 6,
    padTop: 2,
  });
  const domain = normalizeDomain({
    xMin: 0,
    xMax: 20,
    yMin: 0,
    yMax: 100,
  });
  const projected = projectPoint({ x: 10, y: 50 }, domain, plot);

  assert.equal(projected.x, 208);
  assert.equal(projected.y, 140);
  assert.equal(plot.canvasWidth, 368);
  assert.equal(plot.canvasHeight, 240);
});

test("chart data coordinates can be rounded back onto the authoring grid", () => {
  const plot = computePlotLayout({
    columns: 40,
    rows: 20,
    cellWidth: 10,
    cellHeight: 18,
  });
  const domain = normalizeDomain({
    xMin: 0,
    xMax: 100,
    yMin: 0,
    yMax: 200,
  });
  const gridPoint = dataPointToGrid({ x: 25, y: 150 }, domain, plot);
  const pixelPoint = gridPointToPixel(gridPoint, plot);

  assert.equal(gridPoint.column, 10);
  assert.equal(gridPoint.row, 5);
  assert.equal(pixelPoint.x, 100);
  assert.equal(pixelPoint.y, 90);
});

test("chart path helpers preserve straight and smoothed series", () => {
  const points = parsePointList("0,0; 10,20; bad; 20,10");

  assert.deepEqual(points, [
    { x: 0, y: 0 },
    { x: 10, y: 20 },
    { x: 20, y: 10 },
  ]);
  assert.equal(linePathData(points), "M 0 0 L 10 20 L 20 10");
  assert.match(smoothPathData(points), /^M 0 0 C /);
  assertClose(normalizeDomain({ xMin: 1, xMax: 1 }).xMax, 2);
});
