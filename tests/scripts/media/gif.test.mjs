import assert from "node:assert/strict";
import test from "node:test";

import pngjs from "pngjs";

import { encodeGif } from "../../../scripts/media/gif.mjs";

const { PNG } = pngjs;

function createSolidPng(width, height, rgba) {
  const png = new PNG({ width, height });

  for (let offset = 0; offset < png.data.length; offset += 4) {
    png.data[offset] = rgba[0];
    png.data[offset + 1] = rgba[1];
    png.data[offset + 2] = rgba[2];
    png.data[offset + 3] = rgba[3];
  }

  return PNG.sync.write(png);
}

test("encodeGif returns a valid GIF file", () => {
  const gif = encodeGif({
    pngFrames: [
      createSolidPng(4, 2, [255, 0, 0, 255]),
      createSolidPng(4, 2, [0, 0, 255, 255]),
    ],
    fps: 8,
  });

  assert.equal(Buffer.from(gif).subarray(0, 6).toString("ascii"), "GIF89a");
  assert.equal(Buffer.from(gif).at(-1), 0x3b);
});
