function waitForMediaExportReady(mediaExportId = "default") {
  return async function waitUntil({ page, timeoutMs }) {
    await page.waitForFunction((id) => {
      if (id === "default") {
        return window.__mediaExport?.ready === true;
      }
      return window.__mediaExports?.[id]?.ready === true;
    }, { timeout: timeoutMs }, mediaExportId);
  };
}

function waitForText(selector, excludedText) {
  return async function waitUntil({ page, timeoutMs }) {
    await page.waitForFunction((targetSelector, blockedText) => {
      const element = document.querySelector(targetSelector);
      return Boolean(element?.textContent?.trim())
        && !element.textContent.includes(blockedText);
    }, { timeout: timeoutMs }, selector, excludedText);
  };
}

async function enableCheckbox(page, selector) {
  await page.waitForSelector(selector);
  const isChecked = await page.$eval(selector, (element) => element.checked);
  if (!isChecked) {
    await page.click(selector);
  }
}

function socialOutputPath(slug, fileName) {
  return `assets/blog/${slug}/social/${fileName}`;
}

export const MEDIA_PRESETS = {
  "matrix-rain-gif": {
    description: "Matrix digital rain animation GIF",
    durationMs: 6000,
    fps: 10,
    kind: "gif",
    mediaExportId: "matrix-rain",
    outputPath: "assets/art/matrix-rain.gif",
    pagePath: "/art/",
    selector: "#matrix-rain-animation",
    viewport: { width: 1280, height: 900 },
    waitUntil: waitForMediaExportReady("matrix-rain"),
  },
  "home-blackhole-gif": {
    description: "Home page black hole animation GIF",
    fps: 15,
    kind: "gif",
    outputPath: "assets/social/home-blackhole.gif",
    pagePath: "/",
    selector: "#bh",
    viewport: { width: 1280, height: 900 },
    waitUntil: waitForMediaExportReady(),
  },
  "home-blackhole-png": {
    description: "Home page black hole still frame",
    kind: "png",
    outputPath: "assets/social/home-blackhole.png",
    pagePath: "/",
    selector: "#bh",
    viewport: { width: 1280, height: 900 },
    waitUntil: waitForMediaExportReady(),
  },
  "industrialization-gif": {
    description: "Industrialization tractors animation GIF",
    durationMs: 6000,
    fps: 10,
    kind: "gif",
    outputPath: socialOutputPath("industrialization", "tractors-farming-code.gif"),
    pagePath: "/blog/industrialization/",
    selector: "#farming-field",
    viewport: { width: 1440, height: 1200 },
    waitUntil: waitForMediaExportReady(),
  },
  "just-another-abstraction-gif": {
    description: "Just another abstraction animation GIF",
    durationMs: 10000,
    fps: 16,
    kind: "gif",
    outputPath: socialOutputPath("just-another-abstraction", "edit-distance-abstraction.gif"),
    pagePath: "/blog/just-another-abstraction/",
    selector: "#abstraction-screen",
    viewport: { width: 1400, height: 1000 },
    waitUntil: waitForMediaExportReady(),
  },
  "just-another-abstraction-reverse-gif": {
    description: "Just another abstraction reverse animation GIF",
    durationMs: 10000,
    fps: 16,
    kind: "gif",
    outputPath: socialOutputPath("just-another-abstraction", "edit-distance-abstraction-reverse.gif"),
    pagePath: "/blog/just-another-abstraction/",
    selector: "#abstraction-screen",
    setup: async ({ page }) => {
      await enableCheckbox(page, "#abstraction-reverse");
    },
    viewport: { width: 1400, height: 1000 },
    waitUntil: waitForMediaExportReady(),
  },
  "stochastic-agentic-ascent-gif": {
    description: "Stochastic agentic ascent optimizer animation GIF",
    durationMs: 12000,
    fps: 12,
    kind: "gif",
    outputPath: socialOutputPath("stochastic-agentic-ascent", "stochastic-agentic-ascent.gif"),
    pagePath: "/blog/stochastic-agentic-ascent/",
    selectors: [
      "#stochastic-agentic-ascent-kernel-scroll-screen",
      "#stochastic-agentic-ascent-chart-screen",
    ],
    viewport: { width: 1400, height: 1400 },
    waitUntil: waitForMediaExportReady(),
  },
  "donut-gif": {
    description: "Donut.js animation GIF",
    durationMs: 6000,
    fps: 15,
    kind: "gif",
    outputPath: socialOutputPath("donut", "donut-js.gif"),
    pagePath: "/blog/donut/",
    selector: "#d",
    viewport: { width: 1280, height: 900 },
    waitUntil: waitForText("#d", "loading donut"),
  },
  "wikipedia-bfs-gif": {
    description: "Wikipedia race solver breadth-first search animation GIF",
    fps: 4,
    kind: "gif",
    mediaExportId: "wikipedia-bfs",
    outputPath: socialOutputPath("wikipedia-race-solver", "breadth-first-search.gif"),
    pagePath: "/blog/wikipedia-race-solver/",
    selector: "#wikipedia-bfs-animation .mono-graph-animation__viewport",
    viewport: { width: 1440, height: 1000 },
    waitUntil: waitForMediaExportReady("wikipedia-bfs"),
  },
  "wikipedia-bidirectional-bfs-gif": {
    description: "Wikipedia race solver bidirectional BFS animation GIF",
    fps: 4,
    kind: "gif",
    mediaExportId: "wikipedia-bidirectional-bfs",
    outputPath: socialOutputPath("wikipedia-race-solver", "bidirectional-bfs.gif"),
    pagePath: "/blog/wikipedia-race-solver/",
    selector: "#wikipedia-bidirectional-bfs-animation .mono-graph-animation__viewport",
    viewport: { width: 1440, height: 1000 },
    waitUntil: waitForMediaExportReady("wikipedia-bidirectional-bfs"),
  },
};

export function listMediaPresets() {
  return Object.entries(MEDIA_PRESETS).map(([name, preset]) => {
    return {
      name,
      ...preset,
    };
  }).sort((left, right) => left.name.localeCompare(right.name));
}

export function listGifMediaPresets() {
  return listMediaPresets().filter((preset) => preset.kind === "gif");
}

export function resolveMediaPreset(name) {
  const preset = MEDIA_PRESETS[name];
  if (!preset) {
    throw new Error(`unknown preset: ${name}`);
  }

  return {
    name,
    ...preset,
  };
}
