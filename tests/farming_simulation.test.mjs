import assert from "node:assert/strict";
import test from "node:test";

import { FarmingSimulation, parseCorpusText } from "../src/farming_simulation.mjs";

function buildCorpusLines(count) {
  return Array.from({ length: count }, (_, index) => {
    const lineId = String(index + 1).padStart(4, " ");
    return `${lineId}|const sample_${index} = ${index};`;
  });
}

function collectFrames(seed, width, height, steps) {
  const simulation = new FarmingSimulation({
    seed,
    width,
    height,
    corpusLines: buildCorpusLines(256),
  });

  const frames = [simulation.renderFrame()];
  for (let step = 0; step < steps; step += 1) {
    simulation.tick();
    frames.push(simulation.renderFrame());
  }
  return frames;
}

function rowsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

test("parseCorpusText prefixes lines when ids are missing", () => {
  const corpusLines = parseCorpusText("alpha\nbeta\n");
  assert.deepEqual(corpusLines, ["   1|alpha", "   2|beta"]);
});

test("simulation initializes from a blank canvas", () => {
  const width = 24;
  const height = 10;
  const simulation = new FarmingSimulation({
    seed: "blank-start-check",
    width,
    height,
    corpusLines: buildCorpusLines(64),
  });

  for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < width; columnIndex += 1) {
      assert.equal(simulation.fieldOccupancy[rowIndex][columnIndex], false);
      assert.equal(simulation.fieldChars[rowIndex][columnIndex], " ");
    }
  }
});

test("plant mode cannot spawn with minority empty footprint", () => {
  const simulation = new FarmingSimulation({
    seed: "plant-minority-empty-check",
    width: 32,
    height: 9,
    corpusLines: buildCorpusLines(160),
  });

  for (let rowIndex = 0; rowIndex < simulation.height; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < simulation.width; columnIndex += 1) {
      simulation.fieldOccupancy[rowIndex][columnIndex] = true;
      simulation.fieldChars[rowIndex][columnIndex] = "x";
    }
  }

  simulation.fieldOccupancy[0][0] = false;
  simulation.fieldChars[0][0] = " ";

  const randomValues = [0.9, 0.2, 0.0];
  simulation.random = () => randomValues.shift() ?? 0.0;

  const spawnAttempt = simulation.attemptSpawn();

  assert.equal(spawnAttempt.mode, "plant");
  assert.ok(spawnAttempt.oppositeRatio > 0);
  assert.ok(spawnAttempt.oppositeRatio < 0.5);
  assert.equal(spawnAttempt.modeValid, false);
  assert.equal(spawnAttempt.spawned, false);
});

test("plant block origins are not a shared advancing cursor", () => {
  const corpusLineCount = 200;
  const simulation = new FarmingSimulation({
    seed: "random-plant-origin-check",
    width: 72,
    height: 26,
    corpusLines: buildCorpusLines(corpusLineCount),
  });

  const startIds = [];
  for (let sampleIndex = 0; sampleIndex < 24; sampleIndex += 1) {
    const block = simulation.selectPlantBlock();
    startIds.push(Number.parseInt(block[0].slice(0, 4), 10));
  }

  const strictlySequential = startIds.slice(1).every((currentStartId, index) => {
    const previousStartId = startIds[index];
    const expected = (previousStartId % corpusLineCount) + 1;
    return currentStartId === expected;
  });

  assert.equal(strictlySequential, false);
});

test("simulation is deterministic for identical seed and viewport", () => {
  const framesA = collectFrames("tractor-seed", 72, 26, 100);
  const framesB = collectFrames("tractor-seed", 72, 26, 100);
  assert.deepEqual(framesA, framesB);
});

test("active tractors always remain row-disjoint", () => {
  const simulation = new FarmingSimulation({
    seed: "row-disjoint-check",
    width: 88,
    height: 35,
    corpusLines: buildCorpusLines(400),
  });

  for (let step = 0; step < 300; step += 1) {
    simulation.tick();
    for (let left = 0; left < simulation.activeTractors.length; left += 1) {
      const tractorLeft = simulation.activeTractors[left];
      for (let right = left + 1; right < simulation.activeTractors.length; right += 1) {
        const tractorRight = simulation.activeTractors[right];
        assert.equal(
          rowsOverlap(
            tractorLeft.topRow,
            tractorLeft.topRow + tractorLeft.height,
            tractorRight.topRow,
            tractorRight.topRow + tractorRight.height,
          ),
          false,
        );
      }
    }
  }
});

test("spawned tractors satisfy majority-opposite spawn gating", () => {
  const simulation = new FarmingSimulation({
    seed: "spawn-gating-check",
    width: 90,
    height: 34,
    corpusLines: buildCorpusLines(500),
  });

  let spawnedCount = 0;
  for (let step = 0; step < 350; step += 1) {
    const tick = simulation.tick();
    if (tick.spawnAttempt.spawned) {
      spawnedCount += 1;
      assert.equal(tick.spawnAttempt.rowDisjoint, true);
      assert.ok(tick.spawnAttempt.oppositeRatio > 0.5);
    }
  }

  assert.ok(spawnedCount > 0);
});

test("rendered frame dimensions stay in bounds over time", () => {
  const width = 66;
  const height = 28;
  const simulation = new FarmingSimulation({
    seed: "bounds-check",
    width,
    height,
    corpusLines: buildCorpusLines(300),
  });

  for (let step = 0; step < 220; step += 1) {
    simulation.tick();
    const renderedFrame = simulation.renderFrame();
    const renderedRows = renderedFrame.split("\n");

    assert.equal(renderedRows.length, height);
    for (const row of renderedRows) {
      assert.equal(row.length, width);
    }

    assert.equal(simulation.fieldChars.length, height);
    assert.equal(simulation.fieldOccupancy.length, height);
    for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
      assert.equal(simulation.fieldChars[rowIndex].length, width);
      assert.equal(simulation.fieldOccupancy[rowIndex].length, width);
    }
  }
});
