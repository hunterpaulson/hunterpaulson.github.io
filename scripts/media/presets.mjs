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

function setupSidecarComposite({
  exportRootId = "media-sidecar-export-root",
  leftSelector,
  legendSelector,
  rightSelector,
  panelWidth = "40ch",
  targetWidthPx = null,
  paddingPx = 24,
}) {
  return async function setup({ page }) {
    await page.evaluate((options) => {
      document.querySelector(`#${options.exportRootId}`)?.remove();

      const documentStyle = getComputedStyle(document.documentElement);
      let background = documentStyle.backgroundColor;
      if (!background || background === "rgba(0, 0, 0, 0)" || background === "transparent") {
        background = documentStyle.getPropertyValue("--background-color").trim() || "#001b0d";
      }

      const root = document.createElement("div");
      root.id = options.exportRootId;
      Object.assign(root.style, {
        position: "absolute",
        left: "0",
        top: "0",
        zIndex: "2147483647",
        background,
        padding: `${options.paddingPx}px`,
        display: "grid",
        gridTemplateColumns: "max-content max-content",
        columnGap: "48px",
        alignItems: "start",
        width: "max-content",
        boxSizing: "border-box",
        isolation: "isolate",
        overflow: "hidden",
      });

      const pairWidth = "calc((var(--llm-context-panel-width) * 2) + 2ch)";

      function prepareClone(copy) {
        copy.removeAttribute("id");
        copy.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"));
        copy.style.setProperty("--llm-context-panel-width", options.panelWidth);
        Object.assign(copy.style, {
          margin: "0",
          width: pairWidth,
          maxWidth: "none",
        });

        copy.querySelectorAll(".llm-context-scroll").forEach((node) => {
          Object.assign(node.style, {
            width: "max-content",
            maxWidth: "none",
            overflow: "visible",
          });
        });

        copy.querySelectorAll(".llm-context-grid--pair").forEach((node) => {
          Object.assign(node.style, {
            gridTemplateColumns: "repeat(2, var(--llm-context-panel-width))",
            width: pairWidth,
            minWidth: pairWidth,
          });
        });

        copy.querySelectorAll("figcaption").forEach((node) => {
          Object.assign(node.style, {
            width: pairWidth,
            maxWidth: pairWidth,
          });
        });

        return copy;
      }

      function clone(selector) {
        const node = document.querySelector(selector);
        if (!node) {
          throw new Error(`missing selector ${selector}`);
        }
        return prepareClone(node.cloneNode(true));
      }

      const leftColumn = document.createElement("div");
      leftColumn.style.setProperty("--llm-context-panel-width", options.panelWidth);
      Object.assign(leftColumn.style, {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        width: pairWidth,
        minWidth: pairWidth,
      });

      const leftFigure = clone(options.leftSelector);
      const legend = clone(options.legendSelector);
      const rightFigure = clone(options.rightSelector);
      leftColumn.append(leftFigure, legend);
      root.append(leftColumn, rightFigure);
      document.body.append(root);

      const leftWidth = leftColumn.getBoundingClientRect().width;
      const rightWidth = rightFigure.getBoundingClientRect().width;
      if (Number.isFinite(options.targetWidthPx) && options.targetWidthPx > 0) {
        const gap = options.targetWidthPx - (options.paddingPx * 2) - leftWidth - rightWidth;
        root.style.columnGap = `${Math.max(0, gap)}px`;
        root.style.width = `${options.targetWidthPx}px`;
      }

      const rightHeight = rightFigure.getBoundingClientRect().height;
      leftColumn.style.height = `${rightHeight}px`;
    }, {
      exportRootId,
      leftSelector,
      legendSelector,
      panelWidth,
      rightSelector,
      targetWidthPx,
      paddingPx,
    });
  };
}

export const MEDIA_PRESETS = {
  "cache-write-context-current-sidecar-png": {
    description: "Cache write output tokens current context sidecar image",
    kind: "png",
    outputPath: socialOutputPath(
      "cache-write-output-tokens",
      "cache-write-context-current-sidecar-legend.png",
    ),
    pagePath: "/blog/cache-write-output-tokens/",
    selector: "#cache-write-social-export-root",
    setup: setupSidecarComposite({
      exportRootId: "cache-write-social-export-root",
      leftSelector: "#cache-write-context-current-request-1",
      legendSelector: "#cache-write-context-legend-current",
      rightSelector: "#cache-write-context-current-request-2",
      panelWidth: "40ch",
      targetWidthPx: 1696,
    }),
    viewport: { width: 1800, height: 1000 },
  },
  "cache-write-context-retained-sidecar-png": {
    description: "Cache write output tokens retained context sidecar image",
    kind: "png",
    outputPath: socialOutputPath(
      "cache-write-output-tokens",
      "cache-write-context-retained-sidecar-legend.png",
    ),
    pagePath: "/blog/cache-write-output-tokens/",
    selector: "#cache-write-social-export-root",
    setup: setupSidecarComposite({
      exportRootId: "cache-write-social-export-root",
      leftSelector: "#cache-write-context-retained-request-1",
      legendSelector: "#cache-write-context-legend-retained",
      rightSelector: "#cache-write-context-retained-request-2",
      panelWidth: "40ch",
      targetWidthPx: 1696,
    }),
    viewport: { width: 1800, height: 1000 },
  },
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
