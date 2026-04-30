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

function outlineCodeBlocks() {
  const codeBlocks = document.querySelectorAll("pre > code");
  for (const code of codeBlocks) {
    if (code.dataset.outlined === "true") {
      continue;
    }
    const lines = code.textContent.trimEnd().split("\n");
    const maxWidth = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const top = `╭${"─".repeat(maxWidth + 2)}╮`;
    const bottom = `╰${"─".repeat(maxWidth + 2)}╯`;
    const wrapped = lines.map((line) => `│ ${line.padEnd(maxWidth, " ")} │`);
    code.textContent = [top, ...wrapped, bottom].join("\n");
    code.dataset.outlined = "true";
  }
}

outlineCodeBlocks();

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
    const nodePadColumns = readNumericCustomProperty(graph, "--mono-graph-node-pad-cols");
    const nodePadRows = readNumericCustomProperty(graph, "--mono-graph-node-pad-rows");
    const borderThickness = readNumericCustomProperty(graph, "--border-thickness");
    const insetX = canvasPadColumns * cell.width;
    const insetY = canvasPadRows * cell.height;
    const nodeBoundsById = new Map();

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

    const canvasRect = canvas.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${canvasRect.width} ${canvasRect.height}`);
    svg.replaceChildren();

    const defs = document.createElementNS(svgNamespace, "defs");
    const marker = document.createElementNS(svgNamespace, "marker");
    const markerId = `mono-graph-arrow-${graphIndex}`;
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
    arrowHead.setAttribute("fill", "context-stroke");
    marker.appendChild(arrowHead);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const edges = canvas.querySelectorAll(".mono-graph__edge[data-from][data-to]");
    edges.forEach((edge) => {
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
      path.setAttribute("marker-end", `url(#${markerId})`);
      svg.appendChild(path);
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

function initializeGraphAnimations() {
  const animations = document.querySelectorAll(".mono-graph-animation");

  animations.forEach((animation) => {
    if (animation.dataset.animationReady === "true") {
      return;
    }

    const frames = Array.from(animation.querySelectorAll(".mono-graph-animation__frame"));
    if (frames.length === 0) {
      return;
    }

    animation.dataset.animationReady = "true";

    const viewport = document.createElement("div");
    viewport.className = "mono-graph-animation__viewport";
    frames[0].before(viewport);
    frames.forEach((frame) => viewport.appendChild(frame));

    const controls = document.createElement("div");
    controls.className = "mono-graph-animation__controls";

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.textContent = "prev";

    const playButton = document.createElement("button");
    playButton.type = "button";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "next";

    const status = document.createElement("span");
    status.className = "mono-graph-animation__status";
    status.setAttribute("aria-live", "polite");

    controls.append(previousButton, playButton, nextButton, status);
    viewport.after(controls);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intervalMs = Number.parseInt(animation.dataset.interval || "1400", 10);
    let activeIndex = 0;
    let isPlaying = !prefersReducedMotion;
    let timerId = null;

    function render() {
      frames.forEach((frame, frameIndex) => {
        const isActive = frameIndex === activeIndex;
        frame.classList.toggle("is-active", isActive);
        frame.setAttribute("aria-hidden", isActive ? "false" : "true");
      });
      playButton.textContent = isPlaying ? "pause" : "play";
      status.textContent = `${activeIndex + 1}/${frames.length}`;
    }

    function stopTimer() {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    function startTimer() {
      stopTimer();
      timerId = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % frames.length;
        render();
      }, Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 1400);
    }

    function syncTimer() {
      if (isPlaying) {
        startTimer();
      } else {
        stopTimer();
      }
    }

    previousButton.addEventListener("click", () => {
      activeIndex = (activeIndex - 1 + frames.length) % frames.length;
      render();
      syncTimer();
    });

    playButton.addEventListener("click", () => {
      isPlaying = !isPlaying;
      render();
      syncTimer();
    });

    nextButton.addEventListener("click", () => {
      activeIndex = (activeIndex + 1) % frames.length;
      render();
      syncTimer();
    });

    viewport.addEventListener("mouseenter", stopTimer);
    viewport.addEventListener("mouseleave", syncTimer);
    viewport.addEventListener("focusin", stopTimer);
    viewport.addEventListener("focusout", syncTimer);

    render();
    syncTimer();
  });
}

initializeGraphAnimations();

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
