(function(globalScope, factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.MonoGraphLayout = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  function centerOfBounds(bounds) {
    return {
      x: bounds.x + (bounds.width / 2),
      y: bounds.y + (bounds.height / 2),
    };
  }

  function normalizeGridOffset(offset, unit) {
    return ((offset % unit) + unit) % unit;
  }

  function computeNearestGridShift(offset, unit) {
    const normalizedOffset = normalizeGridOffset(offset, unit);

    if (normalizedOffset <= (unit / 2)) {
      return -normalizedOffset;
    }

    return unit - normalizedOffset;
  }

  function computeNodeLayout({
    column,
    row,
    labelColumns,
    cellWidth,
    cellHeight,
    insetX,
    insetY,
    nodePadColumns,
    nodePadRows,
    borderThickness,
  }) {
    const labelWidth = labelColumns * cellWidth;
    const labelHeight = cellHeight;
    const bounds = {
      x: insetX + (column * cellWidth) - (nodePadColumns * cellWidth),
      y: insetY + (row * cellHeight) - (nodePadRows * cellHeight),
      width: labelWidth + (nodePadColumns * 2 * cellWidth),
      height: labelHeight + (nodePadRows * 2 * cellHeight),
    };

    return {
      bounds,
      labelLeft: (nodePadColumns * cellWidth) - borderThickness,
      labelTop: (nodePadRows * cellHeight) - borderThickness,
      labelWidth,
      labelHeight,
    };
  }

  function pointOnPillSide(bounds, side) {
    const center = centerOfBounds(bounds);

    switch (side) {
      case "n":
        return { x: center.x, y: bounds.y };
      case "e":
        return { x: bounds.x + bounds.width, y: center.y };
      case "s":
        return { x: center.x, y: bounds.y + bounds.height };
      case "w":
        return { x: bounds.x, y: center.y };
      default:
        return center;
    }
  }

  function computePillEdgeEndpoint(bounds, towardPoint) {
    const center = centerOfBounds(bounds);
    const deltaX = towardPoint.x - center.x;
    const deltaY = towardPoint.y - center.y;
    const radius = bounds.height / 2;
    const halfBodyWidth = Math.max((bounds.width - bounds.height) / 2, 0);
    const vectorLength = Math.hypot(deltaX, deltaY);

    if (vectorLength === 0) {
      return center;
    }

    const unitX = deltaX / vectorLength;
    const unitY = deltaY / vectorLength;

    if (halfBodyWidth === 0) {
      return {
        x: center.x + (unitX * radius),
        y: center.y + (unitY * radius),
      };
    }

    if (unitY !== 0 && (Math.abs(unitX) * radius) <= (Math.abs(unitY) * halfBodyWidth)) {
      const scalar = radius / Math.abs(unitY);
      return {
        x: center.x + (unitX * scalar),
        y: center.y + (unitY * scalar),
      };
    }

    const scalar = (halfBodyWidth * Math.abs(unitX)) + Math.sqrt(
      (radius * radius) - ((halfBodyWidth * unitY) * (halfBodyWidth * unitY)),
    );

    return {
      x: center.x + (unitX * scalar),
      y: center.y + (unitY * scalar),
    };
  }

  function computeGraphEdgePathPoints({
    sourceBounds,
    targetBounds,
    waypoints = [],
    fromSide = "",
    toSide = "",
  }) {
    const sourceCenter = centerOfBounds(sourceBounds);
    const targetCenter = centerOfBounds(targetBounds);
    const sourceAnchor = fromSide
      ? pointOnPillSide(sourceBounds, fromSide)
      : computePillEdgeEndpoint(sourceBounds, waypoints[0] || targetCenter);
    const targetAnchor = toSide
      ? pointOnPillSide(targetBounds, toSide)
      : computePillEdgeEndpoint(targetBounds, waypoints[waypoints.length - 1] || sourceCenter);

    return [sourceAnchor, ...waypoints, targetAnchor];
  }

  return {
    centerOfBounds,
    computeNearestGridShift,
    computeGraphEdgePathPoints,
    computeNodeLayout,
    computePillEdgeEndpoint,
    pointOnPillSide,
  };
});
