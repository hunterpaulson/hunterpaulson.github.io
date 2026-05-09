import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

import { resolveBrowserExecutable } from "./browser.mjs";
import { encodeGif } from "./gif.mjs";
import { startStaticServer } from "./server.mjs";

const ROOT_DIRECTORY = fileURLToPath(new URL("../../", import.meta.url));
const DIST_DIRECTORY = path.join(ROOT_DIRECTORY, "dist");
const DEFAULT_TIMEOUT_MS = 30000;

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function resolveSelectors(preset) {
  if (Array.isArray(preset.selectors) && preset.selectors.length > 0) {
    return preset.selectors;
  }

  if (typeof preset.selector === "string" && preset.selector.length > 0) {
    return [preset.selector];
  }

  throw new Error(`preset ${preset.name} must define selector or selectors`);
}

export function resolveOutputPath(preset, outputOverride = null) {
  const relativePath = outputOverride ?? preset.outputPath;
  return path.resolve(ROOT_DIRECTORY, relativePath);
}

export function resolveDurationMs({
  cliDurationMs = null,
  presetDurationMs = null,
  loopDurationMs = null,
}) {
  return cliDurationMs ?? presetDurationMs ?? loopDurationMs ?? null;
}

function runCommand(command, args, workingDirectory) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: workingDirectory,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function ensureDistReady({ build }) {
  if (build || !fs.existsSync(DIST_DIRECTORY)) {
    console.log("Building site into dist/");
    await runCommand(process.platform === "win32" ? "bun.exe" : "bun", ["run", "build"], ROOT_DIRECTORY);
  }

  if (!fs.existsSync(DIST_DIRECTORY)) {
    throw new Error("dist/ does not exist; run with --build or build the site first");
  }
}

async function waitForPageReadiness(page, preset, timeoutMs) {
  const selectors = resolveSelectors(preset);
  for (const selector of selectors) {
    await page.waitForSelector(selector, { timeout: timeoutMs });
  }

  if (typeof preset.waitUntil === "function") {
    await preset.waitUntil({ page, timeoutMs, preset });
  }
}

async function scrollSelectorsIntoView(page, selectors) {
  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (!handle) {
      throw new Error(`could not find selector: ${selector}`);
    }

    await handle.evaluate((element) => {
      element.scrollIntoView({ block: "center", inline: "center" });
    });
  }
}

export function combineBoundingBoxes(boxes, marginPx = 0) {
  const validBoxes = boxes.filter(Boolean);
  if (validBoxes.length === 0) {
    throw new Error("at least one bounding box is required");
  }

  const left = Math.max(0, Math.min(...validBoxes.map((box) => box.x)) - marginPx);
  const top = Math.max(0, Math.min(...validBoxes.map((box) => box.y)) - marginPx);
  const right = Math.max(...validBoxes.map((box) => box.x + box.width)) + marginPx;
  const bottom = Math.max(...validBoxes.map((box) => box.y + box.height)) + marginPx;

  return {
    x: Math.floor(left),
    y: Math.floor(top),
    width: Math.ceil(right - left),
    height: Math.ceil(bottom - top),
  };
}

export function convertViewportClipToPageClip({ viewportClip, scrollX, scrollY }) {
  return {
    x: viewportClip.x + scrollX,
    y: viewportClip.y + scrollY,
    width: viewportClip.width,
    height: viewportClip.height,
  };
}

async function resolveCaptureClip(page, selectors, marginPx) {
  const handles = [];
  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (!handle) {
      throw new Error(`could not find selector: ${selector}`);
    }
    handles.push(handle);
  }

  const boxes = await Promise.all(handles.map((handle) => handle.boundingBox()));
  const viewportClip = combineBoundingBoxes(boxes, marginPx);
  const scrollOffset = await page.evaluate(() => {
    return {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  });
  const clip = convertViewportClipToPageClip({
    viewportClip,
    scrollX: scrollOffset.scrollX,
    scrollY: scrollOffset.scrollY,
  });

  if (clip.width <= 0 || clip.height <= 0) {
    throw new Error("capture clip must be larger than zero pixels");
  }

  return clip;
}

function resolveMediaExportId(preset) {
  return preset.mediaExportId ?? "default";
}

async function readLoopDurationFromPage(page, preset) {
  const mediaExportId = resolveMediaExportId(preset);
  const loopDurationMs = await page.evaluate((id) => {
    if (id === "default") {
      return window.__mediaExport?.loopDurationMs ?? null;
    }
    return window.__mediaExports?.[id]?.loopDurationMs ?? null;
  }, mediaExportId);

  if (!Number.isFinite(loopDurationMs) || loopDurationMs <= 0) {
    return null;
  }

  return loopDurationMs;
}

async function capturePng(page, clip) {
  return page.screenshot({
    type: "png",
    clip,
  });
}

async function canSeekMediaExport(page, preset) {
  const mediaExportId = resolveMediaExportId(preset);
  return page.evaluate((id) => {
    const controller = (() => {
      if (id === "default") {
        return window.__mediaExport ?? null;
      }
      return window.__mediaExports?.[id] ?? null;
    })();
    return typeof controller?.seek === "function";
  }, mediaExportId);
}

async function seekMediaExport(page, preset, frameTimeMs) {
  const mediaExportId = resolveMediaExportId(preset);
  await page.evaluate(async ({ id, targetFrameTimeMs }) => {
    const controller = (() => {
      if (id === "default") {
        return window.__mediaExport ?? null;
      }
      return window.__mediaExports?.[id] ?? null;
    })();

    if (typeof controller?.seek !== "function") {
      throw new Error(`media export ${id} does not support seek()`);
    }

    await controller.seek(targetFrameTimeMs);
  }, {
    id: mediaExportId,
    targetFrameTimeMs: frameTimeMs,
  });
}

async function captureFrames(page, clip, fps, durationMs, timeoutMs, captureFrame, preset) {
  const totalFrames = Math.max(2, Math.round((durationMs / 1000) * fps));
  const frameTimes = Array.from({ length: totalFrames }, (_, index) => {
    return (durationMs * index) / totalFrames;
  });
  const pageCaptureStart = await page.evaluate(() => performance.now());
  const usesSeek = await canSeekMediaExport(page, preset);
  const frames = [];

  for (const frameTimeMs of frameTimes) {
    if (usesSeek) {
      await seekMediaExport(page, preset, frameTimeMs);
      await sleep(preset.seekSettleMs ?? 50);
    } else {
      await page.waitForFunction(
        (startTime, targetTime) => performance.now() - startTime >= targetTime,
        { timeout: timeoutMs },
        pageCaptureStart,
        frameTimeMs,
      );
    }
    frames.push(await captureFrame(page, clip));
  }

  return frames;
}

export async function exportMediaPreset(preset, options = {}) {
  const timeoutMs = options.timeoutMs ?? preset.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const executablePath = resolveBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      "could not find a Chromium-based browser; set MEDIA_EXPORT_BROWSER to an executable path",
    );
  }

  let browser = null;
  let page = null;
  let previewServer = null;
  let baseUrl = options.baseUrl;

  try {
    if (!baseUrl) {
      await ensureDistReady({ build: Boolean(options.build) });
      previewServer = await startStaticServer({ rootDirectory: DIST_DIRECTORY });
      baseUrl = previewServer.baseUrl;
    }

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    page = await browser.newPage();
    await page.setViewport({
      width: preset.viewport.width,
      height: preset.viewport.height,
      deviceScaleFactor: preset.viewport.deviceScaleFactor ?? 1,
    });
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "no-preference" },
      { name: "prefers-color-scheme", value: "light" },
    ]);

    const targetUrl = new URL(preset.pagePath, baseUrl).toString();
    console.log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, {
      waitUntil: "networkidle0",
      timeout: timeoutMs,
    });
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    if (typeof preset.setup === "function") {
      await preset.setup({ page, preset });
    }

    await waitForPageReadiness(page, preset, timeoutMs);

    const selectors = resolveSelectors(preset);
    await scrollSelectorsIntoView(page, selectors);
    await sleep(preset.settleMs ?? 250);

    const clip = await resolveCaptureClip(page, selectors, preset.marginPx ?? 0);
    const outputPath = resolveOutputPath(preset, options.output);
    await fsp.mkdir(path.dirname(outputPath), { recursive: true });

    if (preset.kind === "png") {
      const png = await capturePng(page, clip);
      await fsp.writeFile(outputPath, png);
      return {
        outputPath,
        preset,
        type: "png",
      };
    }

    const loopDurationMs = await readLoopDurationFromPage(page, preset);
    const durationMs = resolveDurationMs({
      cliDurationMs: options.durationMs,
      presetDurationMs: preset.durationMs,
      loopDurationMs,
    });
    if (!durationMs) {
      throw new Error(`preset ${preset.name} is missing a GIF duration`);
    }

    const fps = options.fps ?? preset.fps ?? 12;
    if (preset.kind !== "gif") {
      throw new Error(`preset ${preset.name} has unsupported media kind: ${preset.kind}`);
    }

    const pngFrames = await captureFrames(page, clip, fps, durationMs, timeoutMs, capturePng, preset);
    const gif = encodeGif({
      pngFrames,
      fps,
    });
    await fsp.writeFile(outputPath, gif);

    return {
      durationMs,
      fps,
      frameCount: pngFrames.length,
      outputPath,
      preset,
      type: "gif",
    };
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    if (previewServer) {
      await previewServer.close();
    }
  }
}
