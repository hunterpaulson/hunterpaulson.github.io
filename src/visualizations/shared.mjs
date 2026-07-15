export function readNumericCustomProperty(
  element,
  propertyName,
  fallback = 0,
  windowObject = window,
) {
  const value = windowObject.getComputedStyle(element).getPropertyValue(propertyName).trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createArrowMarker(
  documentObject,
  svgNamespace,
  markerId,
  fillColor,
) {
  const marker = documentObject.createElementNS(svgNamespace, "marker");
  marker.setAttribute("id", markerId);
  marker.setAttribute("viewBox", "0 0 6 6");
  marker.setAttribute("refX", "5");
  marker.setAttribute("refY", "3");
  marker.setAttribute("markerWidth", "4");
  marker.setAttribute("markerHeight", "4");
  marker.setAttribute("markerUnits", "strokeWidth");
  marker.setAttribute("orient", "auto-start-reverse");

  const arrowHead = documentObject.createElementNS(svgNamespace, "path");
  arrowHead.setAttribute("d", "M 0 0 L 6 3 L 0 6 z");
  arrowHead.setAttribute("fill", fillColor);
  marker.appendChild(arrowHead);

  return marker;
}

export function renderedPathColor(path, windowObject = window) {
  const pathStyle = windowObject.getComputedStyle(path);
  return pathStyle.stroke && pathStyle.stroke !== "none"
    ? pathStyle.stroke
    : pathStyle.color;
}
