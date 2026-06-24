function gridCellDimensions() {
  const element = document.createElement("div");
  element.style.position = "fixed";
  element.style.height = "var(--line-height)";
  element.style.width = "1ch";
  document.body.appendChild(element);
  const rect = element.getBoundingClientRect();
  document.body.removeChild(element);
  return { width: rect.width, height: rect.height };
}

function updateMeasuredGridVariables() {
  const cell = gridCellDimensions();
  document.documentElement.style.setProperty("--measured-ch", `${cell.width}px`);
  document.documentElement.style.setProperty("--measured-row", `${cell.height}px`);
  return cell;
}

// Add padding to each media to maintain grid.
function adjustMediaPadding() {
  const cell = updateMeasuredGridVariables();

  function setHeightFromRatio(media, ratio) {
      const rect = media.getBoundingClientRect();
      const realHeight = rect.width / ratio;
      const diff = cell.height - (realHeight % cell.height);
      media.style.setProperty("padding-bottom", `${diff}px`);
  }

  function setFallbackHeight(media) {
      const rect = media.getBoundingClientRect();
      const height = Math.round((rect.width / 2) / cell.height) * cell.height;
      media.style.setProperty("height", `${height}px`);
  }

  function onMediaLoaded(media) {
    var width, height;
    switch (media.tagName) {
      case "IMG":
        width = media.naturalWidth;
        height = media.naturalHeight;
        break;
      case "VIDEO":
        width = media.videoWidth;
        height = media.videoHeight;
        break;
    }
    if (width > 0 && height > 0) {
      setHeightFromRatio(media, width / height);
    } else {
      setFallbackHeight(media);
    }
  }

  const medias = document.querySelectorAll("img, video");
  for (media of medias) {
    switch (media.tagName) {
      case "IMG":
        if (media.complete) {
          onMediaLoaded(media);
        } else {
          media.addEventListener("load", () => onMediaLoaded(media));
          media.addEventListener("error", function() {
              setFallbackHeight(media);
          });
        }
        break;
      case "VIDEO":
        switch (media.readyState) {
          case HTMLMediaElement.HAVE_CURRENT_DATA:
          case HTMLMediaElement.HAVE_FUTURE_DATA:
          case HTMLMediaElement.HAVE_ENOUGH_DATA:
            onMediaLoaded(media);
            break;
          default:
            media.addEventListener("loadeddata", () => onMediaLoaded(media));
            media.addEventListener("error", function() {
              setFallbackHeight(media);
            });
            break;
        }
        break;
    }
  }
}

adjustMediaPadding();
updateMeasuredGridVariables();
window.addEventListener("load", adjustMediaPadding);
window.addEventListener("resize", adjustMediaPadding);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(updateMeasuredGridVariables);
}

function wrapHighlightedCodeLines(code, sourceText) {
  const sourceLines = sourceText.split("\n");
  const lineFragments = [document.createDocumentFragment()];
  let lineIndex = 0;

  function appendText(text, ancestors) {
    const parts = text.split("\n");

    parts.forEach((part, partIndex) => {
      let parent = lineFragments[lineIndex];

      for (const ancestor of ancestors) {
        const clone = ancestor.cloneNode(false);
        parent.append(clone);
        parent = clone;
      }

      parent.append(document.createTextNode(part));

      if (partIndex < parts.length - 1) {
        lineIndex += 1;
        lineFragments.push(document.createDocumentFragment());
      }
    });
  }

  function visit(node, ancestors = []) {
    if (node.nodeType === Node.TEXT_NODE) {
      appendText(node.textContent, ancestors);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const nextAncestors = ancestors.concat(node);
    node.childNodes.forEach((child) => visit(child, nextAncestors));
  }

  code.childNodes.forEach((child) => visit(child));

  const wrappedLines = lineFragments.map((fragment, index) => {
    const line = document.createElement("span");
    const leadingWhitespace = (sourceLines[index] || "").match(/^[\t ]*/)[0];
    let indentColumns = 0;

    for (const character of leadingWhitespace) {
      indentColumns = character === "\t"
        ? indentColumns + (4 - (indentColumns % 4))
        : indentColumns + 1;
    }

    line.className = "code-block__line";
    line.style.setProperty("--code-indent", `${indentColumns}ch`);
    line.append(fragment);
    return line;
  });

  code.replaceChildren(...wrappedLines);
}

function enhanceCodeBlocks() {
  const codeBlocks = document.querySelectorAll("pre > code");
  const languageExtensions = {
    bash: "sh",
    csharp: "cs",
    javascript: "js",
    markdown: "md",
    markup: "html",
    python: "py",
    ruby: "rb",
    shell: "sh",
    typescript: "ts",
    yaml: "yml",
  };

  for (const code of codeBlocks) {
    if (code.dataset.enhanced === "true") {
      continue;
    }

    const pre = code.parentElement;
    if (!pre) {
      continue;
    }
    const sourceText = code.textContent;

    const languageClass = Array.from(code.classList).find((className) =>
      className.startsWith("language-"),
    );
    const language = languageClass
      ? languageClass.slice("language-".length)
      : "";
    const extension = languageExtensions[language] || language || "txt";
    const labelText = pre.dataset.filename || `.${extension}`;

    const shell = document.createElement("div");
    shell.className = "code-block";

    const toolbar = document.createElement("div");
    toolbar.className = "code-block__toolbar";

    const label = document.createElement("span");
    label.className = "code-block__language";
    label.textContent = labelText;
    label.title = labelText;

    const copyButton = document.createElement("button");
    copyButton.className = "code-block__copy";
    copyButton.type = "button";
    copyButton.textContent = "[ cp ]";
    copyButton.setAttribute("aria-label", `Copy ${labelText} code`);
    copyButton.setAttribute("aria-live", "polite");

    let copyResetTimer;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(sourceText);
        copyButton.textContent = "[ ✓ ]";
        copyButton.setAttribute("aria-label", "Code copied");
        window.clearTimeout(copyResetTimer);
        copyResetTimer = window.setTimeout(() => {
          copyButton.textContent = "[ cp ]";
          copyButton.setAttribute("aria-label", `Copy ${labelText} code`);
        }, 1600);
      } catch {
        copyButton.textContent = "[ ! ]";
        copyButton.setAttribute("aria-label", "Could not copy code");
      }
    });

    pre.before(shell);
    shell.append(toolbar, pre);
    toolbar.append(label, copyButton);
    if (!pre.classList.contains("nowrap")) {
      wrapHighlightedCodeLines(code, sourceText);
    }
    code.dataset.enhanced = "true";
  }
}

if (typeof Prism !== "undefined") {
  document.querySelectorAll("pre > code").forEach(function (code) {
    var pre = code.parentElement;
    var hasLanguage = Array.from(code.classList).some(function (className) {
      return className.startsWith("language-");
    });
    var language = pre && Array.from(pre.classList).find(function (className) {
      return Prism.languages[className];
    });

    if (pre && language && !hasLanguage) {
      code.classList.add("language-" + language);
      pre.classList.remove(language);
    }
  });
  Prism.highlightAll();
}

enhanceCodeBlocks();

function centerScrollableDiagrams({ force = false } = {}) {
  const scrollContainers = document.querySelectorAll("figure, .mono-graph-animation__viewport");

  scrollContainers.forEach((container) => {
    const overflow = container.scrollWidth - container.clientWidth;
    if (overflow <= 1) {
      return;
    }

    if (!force && container.dataset.scrollCentered === "true") {
      return;
    }

    container.scrollLeft = overflow / 2;
    container.dataset.scrollCentered = "true";
  });
}

centerScrollableDiagrams();
window.addEventListener("load", () => centerScrollableDiagrams({ force: true }));
window.addEventListener("resize", () => centerScrollableDiagrams({ force: true }));
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => centerScrollableDiagrams({ force: true }));
}

const monoGraphLayout = globalThis.MonoGraphLayout;

function readNumericCustomProperty(element, propertyName, fallback = 0) {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseGraphWaypointList(rawWaypoints) {
  if (!rawWaypoints) {
    return [];
  }

  return rawWaypoints
    .split(";")
    .map((rawWaypoint) => rawWaypoint.trim())
    .filter((rawWaypoint) => rawWaypoint.length > 0)
    .map((rawWaypoint) => {
      const [columnText, rowText] = rawWaypoint.split(",").map((part) => part.trim());
      const column = Number.parseFloat(columnText);
      const row = Number.parseFloat(rowText);

      if (!Number.isFinite(column) || !Number.isFinite(row)) {
        return null;
      }

      return { column, row };
    })
    .filter((waypoint) => waypoint !== null);
}

function graphPointFromGridCoordinates(column, row, cellWidth, cellHeight, insetX, insetY) {
  return {
    x: insetX + (column * cellWidth),
    y: insetY + (row * cellHeight),
  };
}

function graphNodeCenter(bounds) {
  if (monoGraphLayout) {
    return monoGraphLayout.centerOfBounds(bounds);
  }

  return {
    x: bounds.x + (bounds.width / 2),
    y: bounds.y + (bounds.height / 2),
  };
}

function graphNodeEndpoint(bounds, towardPoint, side) {
  if (monoGraphLayout) {
    if (side) {
      return monoGraphLayout.pointOnPillSide(bounds, side);
    }

    return monoGraphLayout.computePillEdgeEndpoint(bounds, towardPoint);
  }

  return graphNodeCenter(bounds);
}

function createMonoGraphArrowMarker(svgNamespace, markerId, fillColor) {
  const marker = document.createElementNS(svgNamespace, "marker");
  marker.setAttribute("id", markerId);
  marker.setAttribute("viewBox", "0 0 6 6");
  marker.setAttribute("refX", "5");
  marker.setAttribute("refY", "3");
  marker.setAttribute("markerWidth", "4");
  marker.setAttribute("markerHeight", "4");
  marker.setAttribute("markerUnits", "strokeWidth");
  marker.setAttribute("orient", "auto-start-reverse");

  const arrowHead = document.createElementNS(svgNamespace, "path");
  arrowHead.setAttribute("d", "M 0 0 L 6 3 L 0 6 z");
  arrowHead.setAttribute("fill", fillColor);
  marker.appendChild(arrowHead);

  return marker;
}

function buildGraphPathData(startPoint, viaPoints, endPoint) {
  const segments = [startPoint, ...viaPoints, endPoint];
  return segments
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function alignFooterToGrid() {
  if (!monoGraphLayout || typeof monoGraphLayout.computeNearestGridShift !== "function") {
    return;
  }

  const footer = document.querySelector(".site-footer");
  if (!footer) {
    return;
  }

  const cell = gridCellDimensions();
  const footerTop = footer.getBoundingClientRect().top + window.scrollY;
  const shiftToNearestRow = monoGraphLayout.computeNearestGridShift(footerTop, cell.height);

  footer.style.setProperty("--site-footer-shift-y", `${shiftToNearestRow}px`);
}

function layoutMonoGraphs() {
  const graphs = document.querySelectorAll(".mono-graph");
  if (graphs.length === 0) {
    return;
  }

  const cell = gridCellDimensions();
  const svgNamespace = "http://www.w3.org/2000/svg";

  graphs.forEach((graph, graphIndex) => {
    const canvas = graph.querySelector(".mono-graph__canvas");
    const svg = graph.querySelector(".mono-graph__edges");

    if (!canvas || !svg) {
      return;
    }

    canvas.setAttribute("aria-hidden", "true");

    const canvasPadColumns = readNumericCustomProperty(graph, "--mono-graph-canvas-pad-cols");
    const canvasPadRows = readNumericCustomProperty(graph, "--mono-graph-canvas-pad-rows");
    const graphColumns = readNumericCustomProperty(graph, "--graph-cols", 24);
    const graphRows = readNumericCustomProperty(graph, "--graph-rows", 8);
    const nodePadColumns = readNumericCustomProperty(graph, "--mono-graph-node-pad-cols");
    const nodePadRows = readNumericCustomProperty(graph, "--mono-graph-node-pad-rows");
    const borderThickness = readNumericCustomProperty(graph, "--border-thickness");
    const insetX = canvasPadColumns * cell.width;
    const insetY = canvasPadRows * cell.height;
    const canvasWidth = (graphColumns + (canvasPadColumns * 2)) * cell.width;
    const canvasHeight = (graphRows + (canvasPadRows * 2)) * cell.height;
    const nodeBoundsById = new Map();

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const nodes = canvas.querySelectorAll(".mono-graph__node[data-node]");
    nodes.forEach((node) => {
      if (!node.dataset.label) {
        node.dataset.label = node.textContent.trim();
      }

      const label = node.dataset.label;
      const labelColumns = (() => {
        const explicitColumns = Number.parseFloat(node.dataset.cols || "");
        if (Number.isFinite(explicitColumns) && explicitColumns > 0) {
          return explicitColumns;
        }
        return Math.max(label.length, 1);
      })();
      const column = readNumericCustomProperty(node, "--col");
      const row = readNumericCustomProperty(node, "--row");
      const layout = monoGraphLayout
        ? monoGraphLayout.computeNodeLayout({
            column,
            row,
            labelColumns,
            cellWidth: cell.width,
            cellHeight: cell.height,
            insetX,
            insetY,
            nodePadColumns,
            nodePadRows,
            borderThickness,
          })
        : null;
      const bounds = layout ? layout.bounds : {
        x: insetX + (column * cell.width),
        y: insetY + (row * cell.height),
        width: labelColumns * cell.width,
        height: cell.height,
      };
      let labelElement = node.querySelector(".mono-graph__label");

      if (!labelElement) {
        labelElement = document.createElement("span");
        labelElement.className = "mono-graph__label";
        node.replaceChildren(labelElement);
      }

      labelElement.textContent = label;

      node.style.left = `${bounds.x}px`;
      node.style.top = `${bounds.y}px`;
      node.style.width = `${bounds.width}px`;
      node.style.height = `${bounds.height}px`;
      labelElement.style.left = `${layout ? layout.labelLeft : 0}px`;
      labelElement.style.top = `${layout ? layout.labelTop : 0}px`;
      labelElement.style.width = `${layout ? layout.labelWidth : bounds.width}px`;
      labelElement.style.height = `${layout ? layout.labelHeight : bounds.height}px`;
      nodeBoundsById.set(node.dataset.node, bounds);
    });

    svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);
    svg.replaceChildren();

    const defs = document.createElementNS(svgNamespace, "defs");
    svg.appendChild(defs);

    const edges = canvas.querySelectorAll(".mono-graph__edge[data-from][data-to]");
    edges.forEach((edge, edgeIndex) => {
      const sourceBounds = nodeBoundsById.get(edge.dataset.from);
      const targetBounds = nodeBoundsById.get(edge.dataset.to);

      if (!sourceBounds || !targetBounds) {
        return;
      }

      const waypoints = parseGraphWaypointList(edge.dataset.via || "").map((waypoint) =>
        graphPointFromGridCoordinates(waypoint.column, waypoint.row, cell.width, cell.height, insetX, insetY),
      );
      const fromSide = edge.dataset.fromSide || "";
      const toSide = edge.dataset.toSide || "";
      const pathPoints = monoGraphLayout
        ? monoGraphLayout.computeGraphEdgePathPoints({
            sourceBounds,
            targetBounds,
            waypoints,
            fromSide,
            toSide,
          })
        : (() => {
            const sourceCenter = graphNodeCenter(sourceBounds);
            const targetCenter = graphNodeCenter(targetBounds);
            const sourceAnchor = graphNodeEndpoint(sourceBounds, waypoints[0] || targetCenter, fromSide);
            const targetAnchor = graphNodeEndpoint(targetBounds, waypoints[waypoints.length - 1] || sourceCenter, toSide);
            return [sourceAnchor, ...waypoints, targetAnchor];
          })();

      const path = document.createElementNS(svgNamespace, "path");
      const modifierClasses = Array.from(edge.classList).filter((className) => className !== "mono-graph__edge");
      path.setAttribute("class", ["mono-graph__edge-path", ...modifierClasses].join(" "));
      path.setAttribute("d", buildGraphPathData(pathPoints[0], pathPoints.slice(1, -1), pathPoints[pathPoints.length - 1]));
      svg.appendChild(path);

      const markerId = `mono-graph-arrow-${graphIndex}-${edgeIndex}`;
      const pathStyle = window.getComputedStyle(path);
      const markerColor = pathStyle.stroke && pathStyle.stroke !== "none" ? pathStyle.stroke : pathStyle.color;
      defs.appendChild(createMonoGraphArrowMarker(svgNamespace, markerId, markerColor));
      path.setAttribute("marker-end", `url(#${markerId})`);
    });
  });
}

layoutMonoGraphs();
alignFooterToGrid();
window.addEventListener("load", layoutMonoGraphs);
window.addEventListener("load", alignFooterToGrid);
window.addEventListener("resize", layoutMonoGraphs);
window.addEventListener("resize", alignFooterToGrid);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(layoutMonoGraphs);
  document.fonts.ready.then(alignFooterToGrid);
}

import("/src/graph_animation.mjs").then(({ initializeGraphAnimations }) => {
  initializeGraphAnimations();
  centerScrollableDiagrams({ force: true });
});

function checkOffsets() {
  const ignoredTagNames = new Set([
    "DEFS",
    "MARKER",
    "PATH",
    "POLYGON",
    "SVG",
    "THEAD",
    "TBODY",
    "TFOOT",
    "TR",
    "TD",
    "TH",
  ]);
  const cell = gridCellDimensions();
  const unit = cell.height / 2;
  const tolerance = 0.5;
  const elements = document.querySelectorAll("body :not(.debug-grid, .debug-toggle, .theme-toggle)");
  let inspected = 0;
  let offGridCount = 0;
  let worstDelta = 0;
  let worstElement = null;
  for (const element of elements) {
    if (ignoredTagNames.has(element.tagName)) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      continue;
    }
    inspected += 1;
    const top = rect.top + window.scrollY;
    const remainder = ((top % unit) + unit) % unit;
    const delta = Math.min(remainder, unit - remainder);
    if (delta > tolerance) {
      element.classList.add("off-grid");
      offGridCount += 1;
      if (delta > worstDelta) {
        worstDelta = delta;
        worstElement = element;
      }
    } else {
      element.classList.remove("off-grid");
    }
  }
  if (offGridCount === 0) {
    console.info(`[monospace] grid check: ${inspected} elements aligned to ${unit.toFixed(2)}px rhythm.`);
  } else if (worstElement) {
    console.warn(
      `[monospace] grid check: ${offGridCount} elements off-grid (max delta ${worstDelta.toFixed(2)}px).`,
      worstElement
    );
  }
}

const themeToggle = document.querySelector(".theme-toggle");
const debugToggle = document.querySelector(".debug-toggle");
const themeStorageKey = "theme";
const root = document.documentElement;
let offsetsMonitoring = false;

function applyTheme(theme) {
  const isDark = theme === "dark";
  root.classList.toggle("theme-light", !isDark);
  if (themeToggle) {
    themeToggle.checked = isDark;
  }
  localStorage.setItem(themeStorageKey, theme);
}

function loadThemePreference() {
  const saved = localStorage.getItem(themeStorageKey);
  return saved === "light" ? "light" : "dark";
}

function onThemeToggle() {
  applyTheme(themeToggle.checked ? "dark" : "light");
}

function enableGridDebug() {
  if (!offsetsMonitoring) {
    offsetsMonitoring = true;
    window.addEventListener("resize", checkOffsets);
  }
  checkOffsets();
}
function disableGridDebug() {
  if (!offsetsMonitoring) {
    return;
  }
  offsetsMonitoring = false;
  window.removeEventListener("resize", checkOffsets);
  const marked = document.querySelectorAll(".off-grid");
  marked.forEach((element) => element.classList.remove("off-grid"));
}
function onDebugToggle() {
  if (!debugToggle) {
    return;
  }
  const enabled = debugToggle.checked;
  document.body.classList.toggle("debug", enabled);
  if (enabled) {
    enableGridDebug();
  } else {
    disableGridDebug();
  }
}

applyTheme(loadThemePreference());
if (themeToggle) {
  themeToggle.addEventListener("change", onThemeToggle);
}
if (debugToggle) {
  debugToggle.addEventListener("change", onDebugToggle);
  onDebugToggle();
}
