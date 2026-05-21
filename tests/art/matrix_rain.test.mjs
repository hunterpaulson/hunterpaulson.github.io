import assert from "node:assert/strict";
import test from "node:test";

import { renderMatrixFrame } from "../../src/art/matrix_rain.mjs";

function createFakeCells(columnCount, rowCount) {
  return Array.from({ length: columnCount * rowCount }, () => ({
    className: "",
    matrixGlyph: "",
    matrixHead: false,
    matrixVisible: false,
    style: {
      properties: new Map(),
      setProperty(name, value) {
        this.properties.set(name, value);
      },
    },
    textContent: "",
  }));
}

function getRowGlyphs(cells, row, columnCount) {
  return cells
    .slice(row * columnCount, (row + 1) * columnCount)
    .map((cell) => cell.textContent);
}

test("tail cells keep their head glyph when the head advances one row", () => {
  const columnCount = 16;
  const rowCount = 4;
  const cells = createFakeCells(columnCount, rowCount);
  const streams = Array.from({ length: columnCount }, () => ({
    cycleLength: 100,
    offsetRows: 8,
    speedRowsPerSecond: 1000,
    trailLength: 8,
  }));

  renderMatrixFrame({
    cells,
    columnCount,
    rowCount,
    streams,
    timeMs: 0.999,
  });
  const headGlyphs = getRowGlyphs(cells, 0, columnCount);

  renderMatrixFrame({
    cells,
    columnCount,
    rowCount,
    streams,
    timeMs: 1.001,
  });

  assert.deepEqual(getRowGlyphs(cells, 0, columnCount), headGlyphs);
  assert.ok(getRowGlyphs(cells, 1, columnCount).every(Boolean));
});
