/*
Kernel excerpts in this file are adapted from Simon Boehm's SGEMM_CUDA:
https://github.com/siboehm/SGEMM_CUDA
Copyright (c) 2023 Simon Boehm
Licensed under the MIT License.
*/

import {
  GENERATED_KERNEL_STAGES,
  UPSTREAM_COMMIT,
  UPSTREAM_REPOSITORY,
} from "./data.generated.mjs";

export const CUBLAS_REFERENCE = {
  label: "0: cuBLAS",
  gflops: 23249.6,
  percentOfCublas: 100.0,
};

const WINDOW_START_OVERRIDES = {};

export { UPSTREAM_COMMIT, UPSTREAM_REPOSITORY };

export const KERNEL_STAGES = GENERATED_KERNEL_STAGES.map((stage) => {
  return {
    ...stage,
    windowStart: WINDOW_START_OVERRIDES[stage.kernel] ?? 0,
  };
});

export const MAX_CLEANED_KERNEL_LINES = KERNEL_STAGES.reduce((maximum, stage) => {
  return Math.max(maximum, stage.cleanedLineCount);
}, 0);
