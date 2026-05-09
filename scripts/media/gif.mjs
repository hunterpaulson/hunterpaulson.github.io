import * as gifenc from "gifenc";
import pngjs from "pngjs";

const GIFEncoder = gifenc.GIFEncoder ?? gifenc.default?.GIFEncoder ?? gifenc.default;
const applyPalette = gifenc.applyPalette ?? gifenc.default?.applyPalette;
const quantize = gifenc.quantize ?? gifenc.default?.quantize;
const { PNG } = pngjs;

export function decodePngFrame(pngBytes) {
  const png = PNG.sync.read(Buffer.from(pngBytes));
  return {
    width: png.width,
    height: png.height,
    rgba: png.data,
  };
}

export function encodeGif({ pngFrames, fps, repeat = 0, maxColors = 256 }) {
  if (!Array.isArray(pngFrames) || pngFrames.length === 0) {
    throw new Error("pngFrames must contain at least one frame");
  }

  if (!Number.isInteger(fps) || fps <= 0) {
    throw new Error("fps must be a positive integer");
  }

  const decodedFrames = pngFrames.map((pngFrame) => decodePngFrame(pngFrame));
  const { width, height } = decodedFrames[0];
  const delayMs = Math.round(1000 / fps);
  const encoder = GIFEncoder();

  for (const decodedFrame of decodedFrames) {
    if (decodedFrame.width !== width || decodedFrame.height !== height) {
      throw new Error("all GIF frames must have the same dimensions");
    }

    const palette = quantize(decodedFrame.rgba, maxColors, { format: "rgb565" });
    const indexedFrame = applyPalette(decodedFrame.rgba, palette, "rgb565");
    encoder.writeFrame(indexedFrame, width, height, {
      delay: delayMs,
      palette,
      repeat,
    });
  }

  encoder.finish();
  return encoder.bytes();
}
