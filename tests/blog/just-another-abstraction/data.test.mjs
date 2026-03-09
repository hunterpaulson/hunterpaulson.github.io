import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  ASSEMBLY,
  C_SOURCE,
  MACHINE_CODE,
  PYTHON_SOURCE,
} from "../../../src/blog/just-another-abstraction/data.mjs";

const SAMPLE_CASES = [
  ["", "", 0],
  ["abc", "", 3],
  ["kitten", "sitting", 3],
  ["gumbo", "gambol", 2],
  ["intention", "execution", 5],
];

const CAN_RUN_PYTHON = commandAvailable("python3", ["--version"]);
const CAN_RUN_CLANG = commandAvailable("clang", ["--version"]);
const CAN_RUN_APPLE_TOOLCHAIN = commandAvailable("xcrun", ["llvm-objdump", "--version"]);
const CAN_TEST_ARM64_ASSEMBLY = process.platform === "darwin"
  && process.arch === "arm64"
  && CAN_RUN_CLANG
  && CAN_RUN_APPLE_TOOLCHAIN;

function commandAvailable(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return result.error === undefined && result.status === 0;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );

  return result;
}

function withTempDir(callback) {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "abstraction-layers-"));
  try {
    return callback(tempDirectory);
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
}

function renderPythonHarness() {
  const lines = SAMPLE_CASES.map(([left, right]) => {
    return `print(edit_distance(${JSON.stringify(left)}, ${JSON.stringify(right)}))`;
  });
  return `${PYTHON_SOURCE}\n${lines.join("\n")}\n`;
}

function renderCMain() {
  const lines = SAMPLE_CASES.map(([left, right]) => {
    return `  printf("%d\\n", edit_distance(${JSON.stringify(left)}, ${JSON.stringify(right)}));`;
  });

  return [
    "#include <stdio.h>",
    "",
    "int main(void) {",
    ...lines,
    "  return 0;",
    "}",
    "",
  ].join("\n");
}

function renderAssemblySource() {
  return [
    ".section __TEXT,__text,regular,pure_instructions",
    ".globl _edit_distance",
    ".p2align 2",
    ASSEMBLY,
    "",
  ].join("\n");
}

function machineCodeFromObject(objectPath) {
  const result = runCommand("xcrun", ["llvm-objdump", "-d", objectPath]);
  const lines = [];

  for (const line of result.stdout.split("\n")) {
    const match = line.match(/^\s*([0-9a-f]+):\s+([0-9a-f]{8})\b/i);
    if (!match) {
      continue;
    }

    const [, address, word] = match;
    const byteGroups = [];
    for (let index = 0; index < word.length; index += 2) {
      const byteValue = Number.parseInt(word.slice(index, index + 2), 16);
      byteGroups.push(byteValue.toString(2).padStart(8, "0"));
    }
    lines.push(`${address.padStart(8, "0")}: ${byteGroups.join(" ")}`);
  }

  return lines.join("\n");
}

test("python edit-distance snippet returns correct results", { skip: !CAN_RUN_PYTHON }, () => {
  const result = runCommand("python3", ["-c", renderPythonHarness()]);
  const outputs = result.stdout.trim().split("\n").map((value) => Number.parseInt(value, 10));
  const expected = SAMPLE_CASES.map(([, , distance]) => distance);
  assert.deepEqual(outputs, expected);
});

test("c edit-distance snippet compiles and returns correct results", { skip: !CAN_RUN_CLANG }, () => {
  withTempDir((tempDirectory) => {
    const sourcePath = path.join(tempDirectory, "edit_distance.c");
    const executablePath = path.join(tempDirectory, "edit_distance");

    fs.writeFileSync(sourcePath, `${C_SOURCE}\n\n${renderCMain()}`);

    runCommand("clang", ["-O1", sourcePath, "-o", executablePath]);

    const result = runCommand(executablePath, []);
    const outputs = result.stdout.trim().split("\n").map((value) => Number.parseInt(value, 10));
    const expected = SAMPLE_CASES.map(([, , distance]) => distance);
    assert.deepEqual(outputs, expected);
  });
});

test("assembly edit-distance snippet links and returns correct results", { skip: !CAN_TEST_ARM64_ASSEMBLY }, () => {
  withTempDir((tempDirectory) => {
    const assemblyPath = path.join(tempDirectory, "edit_distance.s");
    const harnessPath = path.join(tempDirectory, "main.c");
    const executablePath = path.join(tempDirectory, "edit_distance_asm");

    fs.writeFileSync(assemblyPath, renderAssemblySource());
    fs.writeFileSync(
      harnessPath,
      [
        "#include <stdio.h>",
        "",
        "int edit_distance(const char *word1, const char *word2);",
        "",
        renderCMain(),
      ].join("\n"),
    );

    runCommand("clang", ["-O1", assemblyPath, harnessPath, "-o", executablePath]);

    const result = runCommand(executablePath, []);
    const outputs = result.stdout.trim().split("\n").map((value) => Number.parseInt(value, 10));
    const expected = SAMPLE_CASES.map(([, , distance]) => distance);
    assert.deepEqual(outputs, expected);
  });
});

test("machine-code block matches the assembled arm64 object bytes", { skip: !CAN_TEST_ARM64_ASSEMBLY }, () => {
  withTempDir((tempDirectory) => {
    const assemblyPath = path.join(tempDirectory, "edit_distance.s");
    const objectPath = path.join(tempDirectory, "edit_distance.o");

    fs.writeFileSync(assemblyPath, renderAssemblySource());
    runCommand("clang", ["-c", assemblyPath, "-o", objectPath]);

    assert.equal(machineCodeFromObject(objectPath), MACHINE_CODE);
  });
});
