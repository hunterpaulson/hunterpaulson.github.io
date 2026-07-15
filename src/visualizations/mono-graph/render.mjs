import {
  computeGraphEdgePathPoints,
  computeNodeLayout,
} from "./layout.mjs";
import {
  createArrowMarker,
  readNumericCustomProperty,
  renderedPathColor,
} from "../shared.mjs";

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

      return Number.isFinite(column) && Number.isFinite(row)
        ? { column, row }
        : null;
    })
    .filter((waypoint) => waypoint !== null);
}

function graphPointFromGridCoordinates(column, row, cellWidth, cellHeight, insetX, insetY) {
  return {
    x: insetX + (column * cellWidth),
    y: insetY + (row * cellHeight),
  };
}

function graphPathData(points) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function renderMonoGraphs({
  root = document,
  documentObject = root.ownerDocument || root,
  windowObject = window,
  getCellDimensions,
} = {}) {
  const graphs = root.querySelectorAll(".mono-graph");
  if (graphs.length === 0 || typeof getCellDimensions !== "function") {
    return;
  }

  const cell = getCellDimensions();
  const svgNamespace = "http://www.w3.org/2000/svg";

  graphs.forEach((graph, graphIndex) => {
    const canvas = graph.querySelector(".mono-graph__canvas");
    const svg = graph.querySelector(".mono-graph__edges");
    if (!canvas || !svg) {
      return;
    }

    canvas.setAttribute("aria-hidden", "true");

    const canvasPadColumns = readNumericCustomProperty(
      graph,
      "--mono-graph-canvas-pad-cols",
      0,
      windowObject,
    );
    const canvasPadRows = readNumericCustomProperty(
      graph,
      "--mono-graph-canvas-pad-rows",
      0,
      windowObject,
    );
    const graphColumns = readNumericCustomProperty(graph, "--graph-cols", 24, windowObject);
    const graphRows = readNumericCustomProperty(graph, "--graph-rows", 8, windowObject);
    const nodePadColumns = readNumericCustomProperty(
      graph,
      "--mono-graph-node-pad-cols",
      0,
      windowObject,
    );
    const nodePadRows = readNumericCustomProperty(
      graph,
      "--mono-graph-node-pad-rows",
      0,
      windowObject,
    );
    const borderThickness = readNumericCustomProperty(graph, "--border-thickness", 0, windowObject);
    const insetX = canvasPadColumns * cell.width;
    const insetY = canvasPadRows * cell.height;
    const canvasWidth = (graphColumns + (canvasPadColumns * 2)) * cell.width;
    const canvasHeight = (graphRows + (canvasPadRows * 2)) * cell.height;
    const nodeBoundsById = new Map();

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    canvas.querySelectorAll(".mono-graph__node[data-node]").forEach((node) => {
      if (!node.dataset.label) {
        node.dataset.label = node.textContent.trim();
      }

      const label = node.dataset.label;
      const explicitColumns = Number.parseFloat(node.dataset.cols || "");
      const labelColumns = Number.isFinite(explicitColumns) && explicitColumns > 0
        ? explicitColumns
        : Math.max(label.length, 1);
      const column = readNumericCustomProperty(node, "--col", 0, windowObject);
      const row = readNumericCustomProperty(node, "--row", 0, windowObject);
      const layout = computeNodeLayout({
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
      });
      const { bounds } = layout;
      let labelElement = node.querySelector(".mono-graph__label");

      if (!labelElement) {
        labelElement = documentObject.createElement("span");
        labelElement.className = "mono-graph__label";
        node.replaceChildren(labelElement);
      }

      labelElement.textContent = label;
      node.style.left = `${bounds.x}px`;
      node.style.top = `${bounds.y}px`;
      node.style.width = `${bounds.width}px`;
      node.style.height = `${bounds.height}px`;
      labelElement.style.left = `${layout.labelLeft}px`;
      labelElement.style.top = `${layout.labelTop}px`;
      labelElement.style.width = `${layout.labelWidth}px`;
      labelElement.style.height = `${layout.labelHeight}px`;
      nodeBoundsById.set(node.dataset.node, bounds);
    });

    svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);
    svg.replaceChildren();

    const defs = documentObject.createElementNS(svgNamespace, "defs");
    svg.appendChild(defs);

    canvas.querySelectorAll(".mono-graph__edge[data-from][data-to]").forEach((edge, edgeIndex) => {
      const sourceBounds = nodeBoundsById.get(edge.dataset.from);
      const targetBounds = nodeBoundsById.get(edge.dataset.to);
      if (!sourceBounds || !targetBounds) {
        return;
      }

      const waypoints = parseGraphWaypointList(edge.dataset.via || "").map((waypoint) =>
        graphPointFromGridCoordinates(
          waypoint.column,
          waypoint.row,
          cell.width,
          cell.height,
          insetX,
          insetY,
        ),
      );
      const pathPoints = computeGraphEdgePathPoints({
        sourceBounds,
        targetBounds,
        waypoints,
        fromSide: edge.dataset.fromSide || "",
        toSide: edge.dataset.toSide || "",
      });
      const path = documentObject.createElementNS(svgNamespace, "path");
      const modifierClasses = Array.from(edge.classList)
        .filter((className) => className !== "mono-graph__edge");
      path.setAttribute("class", ["mono-graph__edge-path", ...modifierClasses].join(" "));
      path.setAttribute("d", graphPathData(pathPoints));
      svg.appendChild(path);

      const markerId = `mono-graph-arrow-${graphIndex}-${edgeIndex}`;
      defs.appendChild(createArrowMarker(
        documentObject,
        svgNamespace,
        markerId,
        renderedPathColor(path, windowObject),
      ));
      path.setAttribute("marker-end", `url(#${markerId})`);
    });
  });
}
