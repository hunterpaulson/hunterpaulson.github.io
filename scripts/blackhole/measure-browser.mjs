import path from "node:path";

import puppeteer from "puppeteer-core";

import { resolveBrowserExecutable } from "../media/browser.mjs";
import { startStaticServer } from "../media/server.mjs";

const executablePath = resolveBrowserExecutable();
if (!executablePath) throw new Error("no Chromium-family browser is available");
const server = await startStaticServer({ rootDirectory: path.resolve("dist") });
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-webgpu", "--use-angle=metal"],
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      errors.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  const navigationStart = performance.now();
  await page.goto(`${server.baseUrl}/?blackhole-backend=webgpu`, {
    waitUntil: "networkidle0",
  });
  await page.waitForFunction(() => window.__mediaExport?.ready === true);
  const initialRenderMs = performance.now() - navigationStart;
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const fontMetrics = await page.$eval("#bh", (element) => {
    const style = getComputedStyle(element);
    const widths = {};
    for (const character of ["M", "⠁", "⣿"]) {
      const probe = document.createElement("span");
      probe.textContent = character;
      probe.style.fontFamily = style.fontFamily;
      probe.style.fontSize = style.fontSize;
      probe.style.fontStyle = style.fontStyle;
      probe.style.fontWeight = style.fontWeight;
      probe.style.fontFeatureSettings = style.fontFeatureSettings;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "pre";
      document.body.append(probe);
      widths[character] = probe.getBoundingClientRect().width;
      probe.remove();
    }
    return {
      family: style.fontFamily,
      size: style.fontSize,
      weight: style.fontWeight,
      ligatures: style.fontVariantLigatures,
      featureSettings: style.fontFeatureSettings,
      fontsReady: {
        ascii: document.fonts.check('500 1rem "Blackhole JetBrains Mono"', "M"),
        braille: document.fonts.check('400 1rem "Blackhole Braille"', "⣿"),
      },
      widths,
    };
  });
  const liveStatusBeforeBenchmark = await page.$eval(
    "#bh-status",
    (element) => element.textContent,
  );

  const measurements = await page.evaluate(async () => {
    const width = 80;
    const height = 40;
    const phase = 0.7;
    const frameCount = 120;
    const { BlackHoleGPU } = await import("/assets/blackhole_gpu.js");
    const {
      BLACKHOLE_WASM_INIT_PARAMETER_TYPES,
      blackholeWasmInitArguments,
    } = await import("/src/art/blackhole_runtime.mjs");

    const gpu = new BlackHoleGPU();
    let start = performance.now();
    await gpu.init(width, height, 2, 60, 80, 0, "ascii", 6);
    const gpuInitializationMs = performance.now() - start;
    start = performance.now();
    const gpuFrame = await gpu.generateFrame(phase);
    const gpuInitialTraceAndFrameMs = performance.now() - start;
    start = performance.now();
    for (let index = 0; index < frameCount; index += 1) {
      await gpu.generateFrame(phase + index * 0.01);
    }
    const gpuCachedFrameMs = (performance.now() - start) / frameCount;
    gpu.updateParams({ inc_deg: 3 });
    start = performance.now();
    await gpu.generateFrame(phase);
    const gpuRetraceAndFrameMs = performance.now() - start;
    gpu.destroy();

    const factory = (await import("/assets/blackhole_wasm.js")).default;
    const module = await factory();
    const initialize = module.cwrap(
      "bh_wasm_init",
      "number",
      BLACKHOLE_WASM_INIT_PARAMETER_TYPES,
    );
    const generate = module.cwrap("bh_wasm_generate_frame", "number", ["number"]);
    const destroy = module.cwrap("bh_wasm_destroy", "void", []);
    const getGlyphSet = module.cwrap("bh_wasm_glyph_set", "number", []);
    const wasmFrameAt = (framePhase) => {
      const pointer = generate(framePhase);
      const codepoints = module.HEAPU32.subarray(
        pointer >>> 2,
        (pointer >>> 2) + width * height,
      );
      const rows = [];
      for (let y = 0; y < height; y += 1) {
        rows.push(String.fromCodePoint(...codepoints.subarray(y * width, (y + 1) * width)));
      }
      return rows.join("\n");
    };
    start = performance.now();
    const ringProfile = {
      ring_count: 5,
      ring_fill: 0.60,
      ring_edge: 0.04,
      ring_floor: 0,
      ring_irregularity: 0.65,
    };
    const wasmArguments = (glyphSet) => blackholeWasmInitArguments({
      width,
      height,
      incline: 2,
      fov: 60,
      distance: 80,
      roll: 0,
      glyphSet,
      sampleCount: 6,
      ringProfile,
    });
    const status = initialize(...wasmArguments("ascii"));
    const wasmTraceMs = performance.now() - start;
    const wasmFrame = wasmFrameAt(phase);
    start = performance.now();
    for (let index = 0; index < frameCount; index += 1) {
      wasmFrameAt(phase + index * 0.01);
    }
    const wasmCachedFrameMs = (performance.now() - start) / frameCount;
    destroy();

    const gpuCells = [...gpuFrame].filter((character) => character !== "\n");
    const wasmCells = [...wasmFrame].filter((character) => character !== "\n");
    let exactMatches = 0;
    let occupancyMatches = 0;
    for (let index = 0; index < gpuCells.length; index += 1) {
      if (gpuCells[index] === wasmCells[index]) exactMatches += 1;
      const gpuInk = gpuCells[index] !== " ";
      const wasmInk = wasmCells[index] !== " ";
      if (gpuInk === wasmInk) occupancyMatches += 1;
    }

    const countFamilies = (frame) => {
      const counts = { blank: 0, ascii: 0, braille: 0, other: 0 };
      for (const character of frame) {
        if (character === "\n") continue;
        const codepoint = character.codePointAt(0);
        if (codepoint === 32) counts.blank += 1;
        else if (codepoint >= 33 && codepoint <= 126) counts.ascii += 1;
        else if (codepoint >= 0x2800 && codepoint <= 0x28ff) counts.braille += 1;
        else counts.other += 1;
      }
      return counts;
    };

    const brailleGpu = new BlackHoleGPU();
    await brailleGpu.init(width, height, 2, 60, 80, 0, "braille-stars", 6);
    const brailleGpuFrame = await brailleGpu.generateFrame(phase);
    brailleGpu.destroy();
    initialize(...wasmArguments("braille-stars"));
    const brailleWasmGlyphSet = getGlyphSet();
    const brailleWasmFrame = wasmFrameAt(phase);
    destroy();
    const brailleGpuCells = [...brailleGpuFrame].filter((character) => character !== "\n");
    const brailleWasmCells = [...brailleWasmFrame].filter((character) => character !== "\n");
    let brailleExactMatches = 0;
    let brailleOccupancyMatches = 0;
    for (let index = 0; index < brailleGpuCells.length; index += 1) {
      if (brailleGpuCells[index] === brailleWasmCells[index]) brailleExactMatches += 1;
      const gpuInk = brailleGpuCells[index] !== " ";
      const wasmInk = brailleWasmCells[index] !== " ";
      if (gpuInk === wasmInk) brailleOccupancyMatches += 1;
    }

    return {
      gpu: {
        initializationMs: gpuInitializationMs,
        initialTraceAndFrameMs: gpuInitialTraceAndFrameMs,
        cachedFrameMs: gpuCachedFrameMs,
        retraceAndFrameMs: gpuRetraceAndFrameMs,
      },
      wasm: {
        status,
        traceMs: wasmTraceMs,
        cachedFrameMs: wasmCachedFrameMs,
      },
      parity: {
        exact: exactMatches / gpuCells.length,
        occupancy: occupancyMatches / gpuCells.length,
      },
      brailleStars: {
        parity: {
          exact: brailleExactMatches / brailleGpuCells.length,
          occupancy: brailleOccupancyMatches / brailleGpuCells.length,
        },
        gpuFamilies: countFamilies(brailleGpuFrame),
        wasmFamilies: countFamilies(brailleWasmFrame),
        wasmGlyphSet: brailleWasmGlyphSet,
      },
      readbackBytes: width * height * 4,
    };
  });

  await new Promise((resolve) => setTimeout(resolve, 2500));
  measurements.liveStatus = {
    beforeBenchmark: liveStatusBeforeBenchmark,
    afterBenchmark: await page.$eval("#bh-status", (element) => element.textContent),
  };

  console.log(JSON.stringify({ initialRenderMs, errors, fontMetrics, ...measurements }, null, 2));
} finally {
  await browser.close();
  await server.close();
}
