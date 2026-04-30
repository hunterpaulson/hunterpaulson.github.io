import assert from "node:assert/strict";
import test from "node:test";

import monoGraphLayout from "../src/mono_graph_layout.js";

const {
  computeNearestGridShift,
  computeGraphEdgePathPoints,
  computeNodeLayout,
  computePillEdgeEndpoint,
} = monoGraphLayout;

function assertClose(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

test("graph node label aligns to the monospace row grid inside the pill", () => {
  const layout = computeNodeLayout({
    column: 4,
    row: 3,
    labelColumns: 3,
    cellWidth: 8,
    cellHeight: 20,
    insetX: 16,
    insetY: 24,
    nodePadColumns: 1.5,
    nodePadRows: 0.5,
    borderThickness: 2,
  });

  assert.equal(layout.labelLeft, 10);
  assert.equal(layout.labelTop, 8);
  assert.equal(layout.bounds.height, 40);
  assert.equal(layout.labelHeight, 20);
});

test("graph edges are straight by default and preserve explicit waypoints", () => {
  const sourceBounds = {
    x: 10,
    y: 10,
    width: 60,
    height: 20,
  };
  const targetBounds = {
    x: 110,
    y: 60,
    width: 60,
    height: 20,
  };

  const straightPath = computeGraphEdgePathPoints({
    sourceBounds,
    targetBounds,
  });

  assert.equal(straightPath.length, 2);

  const explicitWaypoint = { x: 90, y: 20 };
  const waypointPath = computeGraphEdgePathPoints({
    sourceBounds,
    targetBounds,
    waypoints: [explicitWaypoint],
  });

  assert.equal(waypointPath.length, 3);
  assert.deepEqual(waypointPath[1], explicitWaypoint);
});

test("footer top that lands near a half-row snaps to the nearest full row", () => {
  assertClose(computeNearestGridShift(1641.2813, 19.1953125), 9.515575);
});

test("graph arrows aim at the rounded pill edge instead of the rectangular side midpoint", () => {
  const bounds = {
    x: 10,
    y: 10,
    width: 60,
    height: 20,
  };

  const endpoint = computePillEdgeEndpoint(bounds, { x: 100, y: 0 });

  assertClose(endpoint.x, 65.34846922834953);
  assertClose(endpoint.y, 11.550510257216821);
});
