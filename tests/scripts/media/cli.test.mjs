import assert from "node:assert/strict";
import test from "node:test";

import { parseCliArgs } from "../../../scripts/media/cli.mjs";

test("parseCliArgs handles preset export overrides", () => {
  const parsed = parseCliArgs([
    "home-blackhole-gif",
    "--build",
    "--fps",
    "10",
    "--duration-ms",
    "5000",
    "--output",
    "tmp/out.gif",
  ]);

  assert.equal(parsed.action, "export");
  assert.equal(parsed.presetName, "home-blackhole-gif");
  assert.equal(parsed.options.build, true);
  assert.equal(parsed.options.fps, 10);
  assert.equal(parsed.options.durationMs, 5000);
  assert.equal(parsed.options.output, "tmp/out.gif");
});

test("parseCliArgs handles list command", () => {
  const parsed = parseCliArgs(["list"]);
  assert.equal(parsed.action, "list");
  assert.equal(parsed.presetName, null);
});

test("parseCliArgs handles all-gifs command", () => {
  const parsed = parseCliArgs(["all-gifs", "--build"]);
  assert.equal(parsed.action, "all-gifs");
  assert.equal(parsed.presetName, null);
  assert.equal(parsed.options.build, true);
});

test("parseCliArgs rejects unknown options", () => {
  assert.throws(() => {
    parseCliArgs(["home-blackhole-gif", "--wat"]);
  }, /unknown option/);
});
