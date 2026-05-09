import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  resolveRelativeAssetCandidates,
  resolveStaticFilePath,
} from "../../../scripts/media/server.mjs";

test("resolveRelativeAssetCandidates maps clean routes to index files", () => {
  assert.deepEqual(resolveRelativeAssetCandidates("/"), ["index.html"]);
  assert.deepEqual(resolveRelativeAssetCandidates("/blog/industrialization/"), [
    "blog/industrialization/index.html",
  ]);
  assert.deepEqual(resolveRelativeAssetCandidates("/blog/industrialization"), [
    "blog/industrialization.html",
    "blog/industrialization/index.html",
  ]);
});

test("resolveStaticFilePath returns null for traversal attempts", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "media-server-test-"));
  await fs.writeFile(path.join(tempRoot, "index.html"), "ok");

  assert.equal(resolveStaticFilePath(tempRoot, "/../secret.txt"), null);
  assert.equal(resolveStaticFilePath(tempRoot, "/"), path.join(tempRoot, "index.html"));

  await fs.rm(tempRoot, { recursive: true, force: true });
});
