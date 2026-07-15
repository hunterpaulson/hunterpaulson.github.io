import {
  computePlotLayout,
  dataPointToGrid,
  linePathData,
  normalizeDomain,
  parsePoint,
  parsePointList,
  projectPoint,
  smoothPathData,
} from "./layout.mjs";
import {
  createArrowMarker,
  readNumericCustomProperty,
  renderedPathColor,
} from "../shared.mjs";

function readDatasetNumber(element, key, fallback = 0) {
  const rawValue = element.dataset[key];
  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readChartLabelCoordinate(
  element,
  key,
  customPropertyName,
  fallback,
  windowObject,
) {
  if (element.dataset[key] !== undefined) {
    return readDatasetNumber(element, key, fallback);
  }

  return readNumericCustomProperty(element, customPropertyName, fallback, windowObject);
}

function chartModifierClasses(element, baseClass) {
  return Array.from(element.classList).filter((className) => className !== baseClass);
}

function createSvgPath(documentObject, svgNamespace, classNames, pathData) {
  const path = documentObject.createElementNS(svgNamespace, "path");
  path.setAttribute("class", classNames.filter(Boolean).join(" "));
  path.setAttribute("d", pathData);
  return path;
}

function labelColumnOffset(text, align) {
  return align === "end" ? -String(text).length : 0;
}

function placeChartLabel(label, {
  column,
  row,
  text,
  align,
  plotLayout,
}) {
  const alignedColumn = column + labelColumnOffset(text, align);

  label.style.left = `${plotLayout.plotLeft + (alignedColumn * plotLayout.cellWidth)}px`;
  label.style.top = `${plotLayout.plotTop + (row * plotLayout.cellHeight)}px`;
}

function appendChartLabel(documentObject, labelsLayer, {
  text,
  classNames = [],
  column,
  row,
  align = "start",
  plotLayout,
}) {
  if (!text) {
    return null;
  }

  const label = documentObject.createElement("span");
  label.className = ["mono-chart__label", "mono-chart__label--generated", ...classNames].join(" ");
  label.dataset.generated = "true";
  label.textContent = text;
  placeChartLabel(label, {
    column,
    row,
    text,
    align,
    plotLayout,
  });
  labelsLayer.appendChild(label);
  return label;
}

function generatedLabelGridPosition(
  element,
  fallbackPoint,
  domain,
  plotLayout,
  defaultColumnOffset,
  defaultRowOffset,
) {
  const fallbackGridPoint = dataPointToGrid(fallbackPoint, domain, plotLayout);
  const column = element.dataset.labelCol !== undefined
    ? readDatasetNumber(element, "labelCol", fallbackGridPoint.column)
    : Math.round(fallbackGridPoint.column)
      + readDatasetNumber(element, "labelColOffset", defaultColumnOffset);
  const row = element.dataset.labelRow !== undefined
    ? readDatasetNumber(element, "labelRow", fallbackGridPoint.row)
    : Math.round(fallbackGridPoint.row)
      + readDatasetNumber(element, "labelRowOffset", defaultRowOffset);

  return { column, row };
}

function addChartArrowMarker({
  documentObject,
  windowObject,
  svgNamespace,
  defs,
  path,
  markerId,
}) {
  defs.appendChild(createArrowMarker(
    documentObject,
    svgNamespace,
    markerId,
    renderedPathColor(path, windowObject),
  ));
  path.setAttribute("marker-end", `url(#${markerId})`);
}

function layoutAuthorChartLabels(canvas, plotLayout, windowObject) {
  const labels = canvas.querySelectorAll(".mono-chart__label:not([data-generated='true'])");

  labels.forEach((label) => {
    const column = readChartLabelCoordinate(label, "col", "--col", 0, windowObject);
    const row = readChartLabelCoordinate(label, "row", "--row", 0, windowObject);
    placeChartLabel(label, {
      column,
      row,
      text: label.textContent,
      align: label.dataset.align || "start",
      plotLayout,
    });
  });
}

export function renderMonoCharts({
  root = document,
  documentObject = root.ownerDocument || root,
  windowObject = window,
  getCellDimensions,
} = {}) {
  const charts = root.querySelectorAll(".mono-chart");
  if (charts.length === 0 || typeof getCellDimensions !== "function") {
    return;
  }

  const cell = getCellDimensions();
  const svgNamespace = "http://www.w3.org/2000/svg";

  charts.forEach((chart, chartIndex) => {
    const canvas = chart.querySelector(".mono-chart__canvas");
    if (!canvas) {
      return;
    }

    const chartColumns = readNumericCustomProperty(chart, "--chart-cols", 48, windowObject);
    const chartRows = readNumericCustomProperty(chart, "--chart-rows", 18, windowObject);
    const padLeft = readNumericCustomProperty(chart, "--mono-chart-pad-left", 8, windowObject);
    const padRight = readNumericCustomProperty(chart, "--mono-chart-pad-right", 4, windowObject);
    const padTop = readNumericCustomProperty(chart, "--mono-chart-pad-top", 2, windowObject);
    const padBottom = readNumericCustomProperty(chart, "--mono-chart-pad-bottom", 3, windowObject);
    const borderThickness = readNumericCustomProperty(chart, "--border-thickness", 2, windowObject);
    const plotLayout = computePlotLayout({
      columns: chartColumns,
      rows: chartRows,
      cellWidth: cell.width,
      cellHeight: cell.height,
      padLeft,
      padRight,
      padTop,
      padBottom,
    });
    const domain = normalizeDomain({
      xMin: canvas.dataset.xMin ?? chart.dataset.xMin ?? 0,
      xMax: canvas.dataset.xMax ?? chart.dataset.xMax ?? chartColumns,
      yMin: canvas.dataset.yMin ?? chart.dataset.yMin ?? 0,
      yMax: canvas.dataset.yMax ?? chart.dataset.yMax ?? chartRows,
    });

    let svg = canvas.querySelector(":scope > .mono-chart__svg[data-generated='true']");
    if (!svg) {
      svg = documentObject.createElementNS(svgNamespace, "svg");
      svg.classList.add("mono-chart__svg");
      svg.dataset.generated = "true";
      svg.setAttribute("aria-hidden", "true");
      canvas.prepend(svg);
    }

    let labelsLayer = canvas.querySelector(":scope > .mono-chart__labels[data-generated='true']");
    if (!labelsLayer) {
      labelsLayer = documentObject.createElement("div");
      labelsLayer.className = "mono-chart__labels";
      labelsLayer.dataset.generated = "true";
      canvas.appendChild(labelsLayer);
    }

    canvas.style.width = `${plotLayout.canvasWidth}px`;
    canvas.style.height = `${plotLayout.canvasHeight}px`;
    svg.setAttribute("viewBox", `0 0 ${plotLayout.canvasWidth} ${plotLayout.canvasHeight}`);
    svg.replaceChildren();
    labelsLayer.replaceChildren();

    const defs = documentObject.createElementNS(svgNamespace, "defs");
    svg.appendChild(defs);
    let markerIndex = 0;

    canvas.querySelectorAll(".mono-chart__area[data-from][data-to]").forEach((area) => {
      const fromPoint = parsePoint(area.dataset.from);
      const toPoint = parsePoint(area.dataset.to);
      if (!fromPoint || !toPoint) {
        return;
      }

      const fromPixel = projectPoint(fromPoint, domain, plotLayout);
      const toPixel = projectPoint(toPoint, domain, plotLayout);
      const rect = documentObject.createElementNS(svgNamespace, "rect");
      const classNames = [
        "mono-chart__area-rect",
        ...chartModifierClasses(area, "mono-chart__area"),
      ];
      if (area.dataset.fill === "none") {
        classNames.push("mono-chart__area-rect--outline");
      }

      rect.setAttribute("class", classNames.join(" "));
      rect.setAttribute("x", Math.min(fromPixel.x, toPixel.x));
      rect.setAttribute("y", Math.min(fromPixel.y, toPixel.y));
      rect.setAttribute("width", Math.abs(toPixel.x - fromPixel.x));
      rect.setAttribute("height", Math.abs(toPixel.y - fromPixel.y));
      svg.appendChild(rect);
    });

    canvas.querySelectorAll(".mono-chart__axis").forEach((axis) => {
      const orientation = axis.dataset.orientation
        || (axis.classList.contains("mono-chart__axis--y") ? "y" : "x");
      const axisPoints = orientation === "y"
        ? [
            { x: readDatasetNumber(axis, "x", domain.xMin), y: domain.yMin },
            { x: readDatasetNumber(axis, "x", domain.xMin), y: domain.yMax },
          ]
        : [
            { x: domain.xMin, y: readDatasetNumber(axis, "y", domain.yMin) },
            { x: domain.xMax, y: readDatasetNumber(axis, "y", domain.yMin) },
          ];
      const projectedPoints = axisPoints.map((point) => projectPoint(point, domain, plotLayout));
      const path = createSvgPath(documentObject, svgNamespace, [
        "mono-chart__axis-path",
        ...chartModifierClasses(axis, "mono-chart__axis"),
      ], linePathData(projectedPoints));

      svg.appendChild(path);
      if ((axis.dataset.arrow || "end") !== "none") {
        addChartArrowMarker({
          documentObject,
          windowObject,
          svgNamespace,
          defs,
          path,
          markerId: `mono-chart-arrow-${chartIndex}-${markerIndex += 1}`,
        });
      }

      if (axis.dataset.label) {
        appendChartLabel(documentObject, labelsLayer, {
          text: axis.dataset.label,
          classNames: ["mono-chart__axis-label", ...chartModifierClasses(axis, "mono-chart__axis")],
          column: readDatasetNumber(axis, "labelCol", orientation === "y" ? 0 : chartColumns + 1),
          row: readDatasetNumber(axis, "labelRow", orientation === "y" ? -1 : chartRows + 1),
          align: axis.dataset.labelAlign || "start",
          plotLayout,
        });
      }
    });

    canvas.querySelectorAll(".mono-chart__series[data-points]").forEach((series) => {
      const dataPoints = parsePointList(series.dataset.points);
      if (dataPoints.length < 2) {
        return;
      }

      const projectedPoints = dataPoints.map((point) => projectPoint(point, domain, plotLayout));
      const pathData = (series.dataset.shape || "line") === "curve"
        ? smoothPathData(projectedPoints, readDatasetNumber(series, "tension", 1))
        : linePathData(projectedPoints);
      const classNames = [
        "mono-chart__path",
        ...chartModifierClasses(series, "mono-chart__series"),
      ];
      if (series.dataset.dash === "true") {
        classNames.push("mono-chart__path--dashed");
      }

      svg.appendChild(createSvgPath(documentObject, svgNamespace, classNames, pathData));

      if (series.dataset.label) {
        const labelPoint = parsePoint(series.dataset.labelAt) || dataPoints[dataPoints.length - 1];
        const gridPosition = generatedLabelGridPosition(series, labelPoint, domain, plotLayout, 1, 0);
        appendChartLabel(documentObject, labelsLayer, {
          text: series.dataset.label,
          classNames: chartModifierClasses(series, "mono-chart__series"),
          column: gridPosition.column,
          row: gridPosition.row,
          align: series.dataset.labelAlign || "start",
          plotLayout,
        });
      }
    });

    canvas.querySelectorAll(".mono-chart__guide[data-from][data-to]").forEach((guide) => {
      const fromPoint = parsePoint(guide.dataset.from);
      const toPoint = parsePoint(guide.dataset.to);
      if (!fromPoint || !toPoint) {
        return;
      }

      const projectedPoints = [fromPoint, toPoint]
        .map((point) => projectPoint(point, domain, plotLayout));
      const path = createSvgPath(documentObject, svgNamespace, [
        "mono-chart__guide-path",
        ...chartModifierClasses(guide, "mono-chart__guide"),
      ], linePathData(projectedPoints));
      svg.appendChild(path);

      if (guide.dataset.label) {
        const midpoint = {
          x: (fromPoint.x + toPoint.x) / 2,
          y: (fromPoint.y + toPoint.y) / 2,
        };
        const gridPosition = generatedLabelGridPosition(guide, midpoint, domain, plotLayout, 0, 0);
        appendChartLabel(documentObject, labelsLayer, {
          text: guide.dataset.label,
          classNames: chartModifierClasses(guide, "mono-chart__guide"),
          column: gridPosition.column,
          row: gridPosition.row,
          align: guide.dataset.labelAlign || "start",
          plotLayout,
        });
      }
    });

    canvas.querySelectorAll(".mono-chart__arrow[data-from][data-to]").forEach((arrow) => {
      const fromPoint = parsePoint(arrow.dataset.from);
      const toPoint = parsePoint(arrow.dataset.to);
      if (!fromPoint || !toPoint) {
        return;
      }

      const projectedPoints = [fromPoint, toPoint]
        .map((point) => projectPoint(point, domain, plotLayout));
      const classNames = [
        "mono-chart__arrow-path",
        ...chartModifierClasses(arrow, "mono-chart__arrow"),
      ];
      if (arrow.dataset.dash === "true") {
        classNames.push("mono-chart__arrow-path--dashed");
      }

      const path = createSvgPath(documentObject, svgNamespace, classNames, linePathData(projectedPoints));
      svg.appendChild(path);
      addChartArrowMarker({
        documentObject,
        windowObject,
        svgNamespace,
        defs,
        path,
        markerId: `mono-chart-arrow-${chartIndex}-${markerIndex += 1}`,
      });
    });

    canvas.querySelectorAll(".mono-chart__point[data-x][data-y]").forEach((point) => {
      const dataPoint = {
        x: readDatasetNumber(point, "x"),
        y: readDatasetNumber(point, "y"),
      };
      const projectedPoint = projectPoint(dataPoint, domain, plotLayout);
      const pointMark = documentObject.createElementNS(svgNamespace, "circle");
      pointMark.setAttribute("class", [
        "mono-chart__point-mark",
        ...chartModifierClasses(point, "mono-chart__point"),
      ].join(" "));
      pointMark.setAttribute("cx", projectedPoint.x);
      pointMark.setAttribute("cy", projectedPoint.y);
      pointMark.setAttribute("r", readDatasetNumber(point, "r", Math.max(borderThickness * 2, 4)));
      svg.appendChild(pointMark);

      if (point.dataset.label) {
        const gridPosition = generatedLabelGridPosition(point, dataPoint, domain, plotLayout, 1, -1);
        appendChartLabel(documentObject, labelsLayer, {
          text: point.dataset.label,
          classNames: chartModifierClasses(point, "mono-chart__point"),
          column: gridPosition.column,
          row: gridPosition.row,
          align: point.dataset.labelAlign || "start",
          plotLayout,
        });
      }
    });

    layoutAuthorChartLabels(canvas, plotLayout, windowObject);
  });
}
