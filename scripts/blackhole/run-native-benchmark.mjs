import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "blackhole-benchmark-"));
const executablePath = path.join(tempDirectory, "blackhole-benchmark");

try {
  const compile = spawnSync("cc", [
    "-std=c11", "-O3", "-I", repoRoot,
    path.join(repoRoot, "benchmarks/blackhole_benchmark.c"),
    path.join(repoRoot, "blackhole_core.c"),
    "-lm", "-o", executablePath,
  ], { encoding: "utf8", stdio: "inherit" });
  if (compile.status !== 0) {
    process.exitCode = compile.status ?? 1;
  } else {
    const benchmark = spawnSync(executablePath, [], {
      encoding: "utf8",
      stdio: "inherit",
    });
    process.exitCode = benchmark.status ?? 1;
  }
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}
