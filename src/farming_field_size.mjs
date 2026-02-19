export const MIN_FIELD_COLUMNS = 30;
export const MIN_FIELD_ROWS = 28;

export function resolveFieldDimensions(options) {
  const {
    fieldWidthPx,
    viewportHeightPx,
    cellWidthPx,
    cellHeightPx,
  } = options;

  const effectiveCellWidthPx = cellWidthPx > 0 ? cellWidthPx : 8;
  const effectiveCellHeightPx = cellHeightPx > 0 ? cellHeightPx : 16;
  const effectiveFieldWidthPx = fieldWidthPx > 0
    ? fieldWidthPx
    : MIN_FIELD_COLUMNS * effectiveCellWidthPx;
  const effectiveViewportHeightPx = viewportHeightPx > 0
    ? viewportHeightPx
    : MIN_FIELD_ROWS * effectiveCellHeightPx;

  const columns = Math.max(
    MIN_FIELD_COLUMNS,
    Math.floor(effectiveFieldWidthPx / effectiveCellWidthPx),
  );
  const rows = Math.max(
    MIN_FIELD_ROWS,
    Math.floor(effectiveViewportHeightPx / effectiveCellHeightPx),
  );

  return {
    columns,
    rows,
  };
}
