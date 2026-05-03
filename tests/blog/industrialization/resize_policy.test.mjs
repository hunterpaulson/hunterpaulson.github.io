import assert from "node:assert/strict";
import test from "node:test";

import { shouldRecreateFarmingSimulation } from "../../../src/blog/industrialization/resize_policy.mjs";

test("mobile height-only resize does not recreate the farming simulation", () => {
  const currentDimensions = {
    columns: 42,
    rows: 28,
    lineHeight: 19.2,
  };
  const nextDimensions = {
    columns: 42,
    rows: 31,
    lineHeight: 19.2,
  };

  assert.equal(
    shouldRecreateFarmingSimulation({
      currentDimensions,
      nextDimensions,
      narrowViewport: true,
    }),
    false,
  );
});

test("mobile width changes still recreate the farming simulation", () => {
  const currentDimensions = {
    columns: 42,
    rows: 28,
    lineHeight: 19.2,
  };
  const nextDimensions = {
    columns: 36,
    rows: 28,
    lineHeight: 19.2,
  };

  assert.equal(
    shouldRecreateFarmingSimulation({
      currentDimensions,
      nextDimensions,
      narrowViewport: true,
    }),
    true,
  );
});

test("desktop height changes still recreate the farming simulation", () => {
  const currentDimensions = {
    columns: 96,
    rows: 30,
    lineHeight: 19.2,
  };
  const nextDimensions = {
    columns: 96,
    rows: 36,
    lineHeight: 19.2,
  };

  assert.equal(
    shouldRecreateFarmingSimulation({
      currentDimensions,
      nextDimensions,
      narrowViewport: false,
    }),
    true,
  );
});
