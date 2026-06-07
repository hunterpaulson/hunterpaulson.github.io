function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function resolveFrameStep(frameStep, framesPerTimeUnit) {
  if (frameStep !== undefined) {
    assertFiniteNumber(frameStep, "frameStep");
    if (frameStep <= 0) {
      throw new Error("frameStep must be greater than zero");
    }
    return frameStep;
  }

  assertFiniteNumber(framesPerTimeUnit, "framesPerTimeUnit");
  if (framesPerTimeUnit <= 0) {
    throw new Error("framesPerTimeUnit must be greater than zero");
  }
  return 1 / framesPerTimeUnit;
}

function sampleTimes(minimumTime, maximumTime, step) {
  const times = [];
  const epsilon = step / 1000;
  let currentTime = minimumTime;

  while (currentTime < maximumTime - epsilon) {
    times.push(currentTime);
    currentTime += step;
  }

  times.push(maximumTime);
  return times;
}

function interpolateSeriesValue(series, time) {
  if (series.length === 0) {
    return 0;
  }

  if (time < series[0].time || time > series[series.length - 1].time) {
    return 0;
  }

  if (time === series[0].time) {
    return series[0].value;
  }

  for (let index = 1; index < series.length; index += 1) {
    const left = series[index - 1];
    const right = series[index];

    if (time > right.time) {
      continue;
    }

    if (time === right.time) {
      return right.value;
    }

    const span = right.time - left.time;
    if (span <= 0) {
      return right.value;
    }

    const ratio = (time - left.time) / span;
    return left.value + (right.value - left.value) * ratio;
  }

  return series[series.length - 1].value;
}

function roundWhenCloseToInteger(value) {
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 0.0000001) {
    return rounded;
  }
  return value;
}

function formatTrimmedDecimal(value, decimals) {
  const rounded = roundWhenCloseToInteger(value);
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded
    .toFixed(decimals)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

function defaultTimeFormatter(value) {
  return formatTrimmedDecimal(value, 2);
}

function defaultAxisValueFormatter(value) {
  if (Math.abs(value) < 0.000000000001) {
    return "0";
  }

  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }

  const decimals = clamp(Math.ceil(-Math.log10(absoluteValue)) + 1, 1, 8);
  return formatTrimmedDecimal(value, decimals);
}

function chooseTotalValueFormatter(values) {
  const absoluteMaximum = values.reduce((maximum, value) => {
    return Math.max(maximum, Math.abs(value));
  }, 0);
  const hasFractional = values.some((value) => {
    return Math.abs(value - Math.round(value)) > 0.000001;
  });

  if (absoluteMaximum >= 1000000) {
    const compactFormatter = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return (value) => compactFormatter.format(roundWhenCloseToInteger(value));
  }

  if (!hasFractional) {
    return (value) => String(Math.round(value));
  }

  if (absoluteMaximum >= 100) {
    return (value) => formatTrimmedDecimal(value, 1);
  }

  if (absoluteMaximum >= 1) {
    return (value) => formatTrimmedDecimal(value, 2);
  }

  return (value) => formatTrimmedDecimal(value, 4);
}

function buildLogTickValues(maximumValue, minimumVisibleValue) {
  if (!(maximumValue > 0)) {
    return [0];
  }

  const multipliers = [1, 2, 5];
  const minimum = Math.max(minimumVisibleValue, maximumValue * 0.000000000001);
  const minimumExponent = Math.floor(Math.log10(minimum));
  const maximumExponent = Math.ceil(Math.log10(maximumValue));

  const valuesByKey = new Map();
  valuesByKey.set("0", 0);

  for (let exponent = minimumExponent; exponent <= maximumExponent; exponent += 1) {
    const scale = 10 ** exponent;
    for (const multiplier of multipliers) {
      const rawValue = multiplier * scale;
      if (!(rawValue > 0) || rawValue > maximumValue * 1.0000000001) {
        continue;
      }

      const normalizedValue = Number.parseFloat(rawValue.toPrecision(12));
      valuesByKey.set(normalizedValue.toString(), normalizedValue);
    }
  }

  return Array.from(valuesByKey.values()).sort((left, right) => left - right);
}

function pruneTicksByColumnSpacing(ticks, minimumGap) {
  if (ticks.length <= 2 || minimumGap <= 1) {
    return ticks;
  }

  const kept = [ticks[0]];
  for (let index = 1; index < ticks.length - 1; index += 1) {
    const current = ticks[index];
    const lastKept = kept[kept.length - 1];
    if (current.position - lastKept.position >= minimumGap) {
      kept.push(current);
    }
  }

  const lastTick = ticks[ticks.length - 1];
  const currentLast = kept[kept.length - 1];
  if (lastTick.position === currentLast.position) {
    return kept;
  }

  if (lastTick.position - currentLast.position >= minimumGap) {
    kept.push(lastTick);
    return kept;
  }

  kept[kept.length - 1] = lastTick;
  return kept;
}

function placeLabelsInLine(width, labels) {
  const characters = Array.from({ length: width }, () => " ");
  let lastEnd = -1;

  for (let index = 0; index < labels.length; index += 1) {
    const { position, text } = labels[index];
    const isEdge = index === 0 || index === labels.length - 1;
    if (text.length === 0 || text.length > width) {
      continue;
    }

    let start = clamp(position - Math.floor(text.length / 2), 0, width - text.length);
    if (start <= lastEnd) {
      if (!isEdge) {
        continue;
      }

      start = lastEnd + 1;
      if (start + text.length > width) {
        start = width - text.length;
      }

      if (start <= lastEnd) {
        continue;
      }
    }

    for (let charIndex = 0; charIndex < text.length; charIndex += 1) {
      characters[start + charIndex] = text[charIndex];
    }
    lastEnd = start + text.length - 1;
  }

  return characters.join("");
}

function buildRangeLine(width, startLabel, endLabel) {
  if (width <= 0) {
    return "";
  }

  if (startLabel.length + endLabel.length + 1 <= width) {
    return `${startLabel}${" ".repeat(width - startLabel.length - endLabel.length)}${endLabel}`;
  }

  const joined = `${startLabel} ${endLabel}`;
  if (joined.length >= width) {
    return joined.slice(0, width);
  }

  return joined.padEnd(width, " ");
}

function normalizeSegmentPoints(points) {
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error("points must be a non-empty array");
  }

  const names = [];
  const nameSet = new Set();
  const segmentsByName = new Map();
  let minimumTime = Number.POSITIVE_INFINITY;
  let maximumTime = Number.NEGATIVE_INFINITY;

  for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
    const point = points[pointIndex];
    if (!point || typeof point !== "object") {
      throw new Error(`point at index ${pointIndex} must be an object`);
    }

    const { name, time, segments } = point;
    if (typeof name !== "string" || name.length === 0) {
      throw new Error(`point at index ${pointIndex} has an invalid name`);
    }
    assertFiniteNumber(time, `point[${pointIndex}].time`);
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error(`point[${pointIndex}].segments must be a non-empty array`);
    }

    minimumTime = Math.min(minimumTime, time);
    maximumTime = Math.max(maximumTime, time);

    if (!nameSet.has(name)) {
      nameSet.add(name);
      names.push(name);
      segmentsByName.set(name, new Map());
    }

    const rowSegmentMap = segmentsByName.get(name);
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex];
      if (!segment || typeof segment !== "object") {
        throw new Error(`point[${pointIndex}].segments[${segmentIndex}] must be an object`);
      }

      const { key, value, character } = segment;
      if (typeof key !== "string" || key.length === 0) {
        throw new Error(`point[${pointIndex}].segments[${segmentIndex}] has an invalid key`);
      }
      assertFiniteNumber(value, `point[${pointIndex}].segments[${segmentIndex}].value`);
      if (typeof character !== "string" || character.length !== 1) {
        throw new Error(`point[${pointIndex}].segments[${segmentIndex}] character must be 1 char`);
      }

      if (!rowSegmentMap.has(key)) {
        rowSegmentMap.set(key, {
          key,
          character,
          series: [],
        });
      }

      const definition = rowSegmentMap.get(key);
      definition.series.push({
        time,
        value,
      });
    }
  }

  for (const rowSegments of segmentsByName.values()) {
    for (const definition of rowSegments.values()) {
      definition.series.sort((left, right) => left.time - right.time);
    }
  }

  return {
    names,
    segmentsByName,
    minimumTime,
    maximumTime,
  };
}

export function buildInterpolatedSegmentFrames(points, options = {}) {
  const {
    frameStep,
    framesPerTimeUnit = 1,
  } = options;

  const normalized = normalizeSegmentPoints(points);
  const resolvedStep = resolveFrameStep(frameStep, framesPerTimeUnit);
  const times = sampleTimes(normalized.minimumTime, normalized.maximumTime, resolvedStep);

  const frames = times.map((time) => {
    const rows = normalized.names.map((name) => {
      const segmentDefinitions = normalized.segmentsByName.get(name);
      const segments = [];
      let total = 0;

      for (const definition of segmentDefinitions.values()) {
        const value = interpolateSeriesValue(definition.series, time);
        total += value;
        segments.push({
          key: definition.key,
          character: definition.character,
          value,
        });
      }

      return {
        name,
        total,
        segments,
      };
    });

    return {
      time,
      rows,
    };
  });

  return {
    frames,
    names: normalized.names,
    startTime: normalized.minimumTime,
    endTime: normalized.maximumTime,
  };
}

export class SegmentedAsciiScenarioChart {
  constructor(options = {}) {
    const {
      points,
      width = 80,
      frameStep,
      framesPerTimeUnit = 6,
      gapRows = 1,
      rowSpeed = 1,
      rankEpsilon = 0.0001,
      sortByValue = true,
      rowOrder,
      loop = true,
      showFrame = true,
      showRowValues = true,
      showXAxisValues = true,
      showXAxisTicks = true,
      xAxisTickCount = 6,
      showTimeAxis = true,
      showTimeValues = true,
      xScaleMode = "frame",
      xScaleMax,
      xAxisTitle = "",
      totalValueFormatter,
      axisValueFormatter,
      timeFormatter = defaultTimeFormatter,
      valueWidth,
    } = options;

    if (!Number.isInteger(width) || width < 42) {
      throw new Error("width must be an integer >= 42");
    }
    if (!Number.isInteger(gapRows) || gapRows < 0) {
      throw new Error("gapRows must be an integer >= 0");
    }
    if (!Number.isInteger(rowSpeed) || rowSpeed <= 0) {
      throw new Error("rowSpeed must be a positive integer");
    }
    if (typeof showRowValues !== "boolean") {
      throw new Error("showRowValues must be a boolean");
    }
    assertFiniteNumber(rankEpsilon, "rankEpsilon");
    if (typeof sortByValue !== "boolean") {
      throw new Error("sortByValue must be a boolean");
    }
    if (!Number.isInteger(xAxisTickCount) || xAxisTickCount < 2) {
      throw new Error("xAxisTickCount must be an integer >= 2");
    }
    if (xScaleMode !== "global" && xScaleMode !== "frame") {
      throw new Error("xScaleMode must be 'global' or 'frame'");
    }
    if (xScaleMax !== undefined) {
      assertFiniteNumber(xScaleMax, "xScaleMax");
      if (xScaleMax <= 0) {
        throw new Error("xScaleMax must be greater than zero");
      }
    }
    if (totalValueFormatter !== undefined && typeof totalValueFormatter !== "function") {
      throw new Error("totalValueFormatter must be a function");
    }
    if (axisValueFormatter !== undefined && typeof axisValueFormatter !== "function") {
      throw new Error("axisValueFormatter must be a function");
    }
    if (typeof timeFormatter !== "function") {
      throw new Error("timeFormatter must be a function");
    }
    if (typeof showTimeValues !== "boolean") {
      throw new Error("showTimeValues must be a boolean");
    }
    if (valueWidth !== undefined && (!Number.isInteger(valueWidth) || valueWidth < 0)) {
      throw new Error("valueWidth must be an integer >= 0");
    }
    if (showRowValues && valueWidth === 0) {
      throw new Error("valueWidth must be greater than zero when showRowValues is true");
    }

    const build = buildInterpolatedSegmentFrames(points, {
      frameStep,
      framesPerTimeUnit,
    });

    this.width = width;
    this.gapRows = gapRows;
    this.rowStride = gapRows + 1;
    this.rowSpeed = rowSpeed;
    this.rankEpsilon = Math.abs(rankEpsilon);
    this.sortByValue = sortByValue;
    this.loop = loop;
    this.showFrame = showFrame;
    this.showRowValues = showRowValues;
    this.showXAxisValues = showXAxisValues;
    this.showXAxisTicks = showXAxisTicks;
    this.xAxisTickCount = xAxisTickCount;
    this.showTimeAxis = showTimeAxis;
    this.showTimeValues = showTimeValues;
    this.xScaleMode = xScaleMode;
    this.xScaleMax = xScaleMax ?? null;
    this.xAxisTitle = typeof xAxisTitle === "string" ? xAxisTitle : "";

    this.frames = build.frames;
    this.timelineIndex = 0;
    this.startTime = build.startTime;
    this.endTime = build.endTime;
    this.duration = this.endTime - this.startTime;

    this.names = build.names.slice();
    this.rowOrder = this.resolveRowOrder(rowOrder, this.names);

    this.globalMaximum = this.computeGlobalMaximum();
    this.globalTotals = this.collectGlobalTotals();

    const formatTotal = typeof totalValueFormatter === "function"
      ? totalValueFormatter
      : chooseTotalValueFormatter(this.globalTotals);
    this.totalValueFormatter = (value) => String(formatTotal(value));

    const formatAxis = typeof axisValueFormatter === "function"
      ? axisValueFormatter
      : defaultAxisValueFormatter;
    this.axisValueFormatter = (value) => String(formatAxis(value));
    this.timeFormatter = (value) => String(timeFormatter(value));

    const inferredValueWidth = this.globalTotals.reduce((maximum, value) => {
      return Math.max(maximum, this.totalValueFormatter(value).length);
    }, 1);
    this.valueWidth = this.showRowValues ? (valueWidth ?? inferredValueWidth) : 0;

    const labelWidthLimit = Math.max(4, Math.floor(this.width * 0.35));
    const maximumLabelLength = this.rowOrder.reduce((maximum, name) => {
      return Math.max(maximum, name.length);
    }, 1);

    let resolvedLabelWidth = Math.min(maximumLabelLength, labelWidthLimit);
    const minimumChartWidth = 12;
    let resolvedChartWidth = this.width - resolvedLabelWidth - this.valueWidth - 5;

    if (resolvedChartWidth < minimumChartWidth) {
      const maxAllowedLabelWidth = Math.max(
        1,
        this.width - this.valueWidth - 5 - minimumChartWidth,
      );
      resolvedLabelWidth = Math.min(resolvedLabelWidth, maxAllowedLabelWidth);
      resolvedChartWidth = this.width - resolvedLabelWidth - this.valueWidth - 5;
    }

    if (resolvedChartWidth < minimumChartWidth) {
      throw new Error("width is too small for labels, values, and chart body");
    }

    this.labelWidth = resolvedLabelWidth;
    this.chartWidth = resolvedChartWidth;
    this.displayRows = new Map();
    this.previousTargetOrder = this.rowOrder.slice();
    this.lastFrame = "";

    this.initializeRows();
  }

  resolveRowOrder(requestedOrder, names) {
    if (!Array.isArray(requestedOrder) || requestedOrder.length === 0) {
      return names.slice();
    }

    const nameSet = new Set(names);
    const seen = new Set();
    const ordered = [];

    for (const name of requestedOrder) {
      if (typeof name !== "string" || !nameSet.has(name) || seen.has(name)) {
        continue;
      }
      ordered.push(name);
      seen.add(name);
    }

    for (const name of names) {
      if (seen.has(name)) {
        continue;
      }
      ordered.push(name);
      seen.add(name);
    }

    return ordered;
  }

  buildRowByName(rows) {
    const rowByName = new Map();
    for (const row of rows) {
      rowByName.set(row.name, row);
    }
    return rowByName;
  }

  initializeRows() {
    const frame = this.frames[this.timelineIndex];
    const rowByName = this.buildRowByName(frame.rows);
    const targetOrder = this.computeTargetOrder(rowByName, true);
    const targetRows = this.resolveTargetRows(targetOrder);

    this.displayRows = new Map();
    for (const name of targetOrder) {
      this.displayRows.set(name, targetRows.get(name));
    }
  }

  computeTargetOrder(rowByName, persist = true) {
    const availableNames = this.rowOrder.filter((name) => rowByName.has(name));
    if (!this.sortByValue) {
      if (persist) {
        this.previousTargetOrder = availableNames;
      }
      return availableNames;
    }

    const previousOrderIndex = new Map();
    for (let index = 0; index < this.previousTargetOrder.length; index += 1) {
      previousOrderIndex.set(this.previousTargetOrder[index], index);
    }

    const baseOrderIndex = new Map();
    for (let index = 0; index < this.rowOrder.length; index += 1) {
      baseOrderIndex.set(this.rowOrder[index], index);
    }

    const ordered = availableNames.slice().sort((leftName, rightName) => {
      const leftTotal = rowByName.get(leftName)?.total ?? Number.NEGATIVE_INFINITY;
      const rightTotal = rowByName.get(rightName)?.total ?? Number.NEGATIVE_INFINITY;
      const difference = rightTotal - leftTotal;

      if (Math.abs(difference) > this.rankEpsilon) {
        return difference;
      }

      const leftPrevious = previousOrderIndex.get(leftName) ?? Number.MAX_SAFE_INTEGER;
      const rightPrevious = previousOrderIndex.get(rightName) ?? Number.MAX_SAFE_INTEGER;
      if (leftPrevious !== rightPrevious) {
        return leftPrevious - rightPrevious;
      }

      const leftBase = baseOrderIndex.get(leftName) ?? Number.MAX_SAFE_INTEGER;
      const rightBase = baseOrderIndex.get(rightName) ?? Number.MAX_SAFE_INTEGER;
      return leftBase - rightBase;
    });

    if (persist) {
      this.previousTargetOrder = ordered;
    }

    return ordered;
  }

  resolveTargetRows(targetOrder) {
    const rows = new Map();
    for (let index = 0; index < targetOrder.length; index += 1) {
      rows.set(targetOrder[index], index * this.rowStride);
    }
    return rows;
  }

  pickAvailableRow(candidates, occupiedRows, currentRow) {
    for (const candidate of candidates) {
      if (candidate >= 0 && !occupiedRows.has(candidate)) {
        return candidate;
      }
    }

    let offset = 1;
    while (true) {
      const upper = currentRow - offset;
      if (upper >= 0 && !occupiedRows.has(upper)) {
        return upper;
      }

      const lower = currentRow + offset;
      if (!occupiedRows.has(lower)) {
        return lower;
      }

      offset += 1;
    }
  }

  updateDisplayRows(targetOrder, targetRows) {
    const occupiedRows = new Set();
    const nextRows = new Map();

    for (const name of targetOrder) {
      const currentRow = this.displayRows.get(name) ?? targetRows.get(name);
      const targetRow = targetRows.get(name);
      const distance = targetRow - currentRow;
      const step = Math.sign(distance) * Math.min(this.rowSpeed, Math.abs(distance));
      const movedRow = currentRow + step;
      const candidates = [];

      if (step !== 0) {
        candidates.push(movedRow);
      }
      candidates.push(currentRow);

      const nextRow = this.pickAvailableRow(candidates, occupiedRows, currentRow);
      occupiedRows.add(nextRow);
      nextRows.set(name, nextRow);
    }

    this.displayRows = nextRows;
  }

  collectGlobalTotals() {
    const totals = [];
    for (const frame of this.frames) {
      for (const row of frame.rows) {
        totals.push(row.total);
      }
    }
    return totals;
  }

  computeGlobalMaximum() {
    let maximum = 0;
    for (const frame of this.frames) {
      for (const row of frame.rows) {
        maximum = Math.max(maximum, Math.max(0, row.total));
      }
    }
    return maximum > 0 ? maximum : 1;
  }

  getCurrentTime() {
    return this.frames[this.timelineIndex].time;
  }

  formatTotal(value) {
    return this.totalValueFormatter(value);
  }

  formatAxisValue(value) {
    return this.axisValueFormatter(value);
  }

  formatElapsedTime(value) {
    return this.timeFormatter(value);
  }

  buildValueSuffix(value) {
    if (this.valueWidth <= 0) {
      return "";
    }

    if (!this.showRowValues) {
      return ` ${" ".repeat(this.valueWidth)}`;
    }

    const totalText = this.formatTotal(value).padStart(this.valueWidth, " ");
    return ` ${totalText}`;
  }

  buildValuePaddingSuffix() {
    if (this.valueWidth <= 0) {
      return "";
    }

    return ` ${" ".repeat(this.valueWidth)}`;
  }

  resolveScaleMaximum(rows) {
    if (this.xScaleMax !== null) {
      return this.xScaleMax;
    }

    if (this.xScaleMode === "global") {
      return this.globalMaximum;
    }

    let frameMaximum = 0;
    for (const row of rows) {
      frameMaximum = Math.max(frameMaximum, Math.max(0, row.total));
    }

    return frameMaximum > 0 ? frameMaximum : this.globalMaximum;
  }

  resolveXAxisTicks(scaleMaximum) {
    const axisMaximum = Math.max(scaleMaximum, 0.000000000001);
    const minimumVisibleValue = axisMaximum / Math.max(this.chartWidth - 1, 1);
    const tickValues = buildLogTickValues(axisMaximum, minimumVisibleValue);
    const tickByPosition = new Map();

    for (const value of tickValues) {
      const ratio = axisMaximum > 0 ? value / axisMaximum : 0;
      const position = clamp(
        Math.round(ratio * (this.chartWidth - 1)),
        0,
        Math.max(0, this.chartWidth - 1),
      );

      const existing = tickByPosition.get(position);
      if (!existing) {
        tickByPosition.set(position, { value, position });
        continue;
      }

      if (existing.value === 0) {
        continue;
      }

      if (value > existing.value) {
        tickByPosition.set(position, { value, position });
      }
    }

    const sortedTicks = Array.from(tickByPosition.values()).sort((left, right) => {
      return left.position - right.position;
    });

    const minimumGap = Math.max(
      1,
      Math.floor(this.chartWidth / Math.max(this.xAxisTickCount * 2, 4)),
    );
    const prunedTicks = pruneTicksByColumnSpacing(sortedTicks, minimumGap);

    return prunedTicks.map((tick) => {
      return {
        value: tick.value,
        position: tick.position,
        label: this.formatAxisValue(tick.value),
      };
    });
  }

  padLine(lineText) {
    if (lineText.length >= this.width) {
      return lineText.slice(0, this.width);
    }
    return lineText.padEnd(this.width, " ");
  }

  buildEmptyBodyRow() {
    if (this.showFrame) {
      return `${" ".repeat(this.labelWidth)} │${" ".repeat(this.chartWidth)}│${this.buildValuePaddingSuffix()}`;
    }
    return `${" ".repeat(this.labelWidth)} ${" ".repeat(this.chartWidth)}${this.buildValuePaddingSuffix()}`;
  }

  renderSegments(row, scaleMaximum) {
    const cells = Array.from({ length: this.chartWidth }, () => " ");
    let cursor = 0;

    for (const segment of row.segments) {
      if (!Number.isFinite(segment.value) || segment.value === 0) {
        continue;
      }

      let delta = scaleMaximum > 0
        ? Math.round((segment.value / scaleMaximum) * this.chartWidth)
        : 0;
      if (segment.value > 0 && delta === 0) {
        delta = 1;
      }
      if (segment.value < 0 && delta === 0) {
        delta = -1;
      }

      const nextCursor = clamp(cursor + delta, 0, this.chartWidth);
      const start = Math.min(cursor, nextCursor);
      const end = Math.max(cursor, nextCursor);

      for (let column = start; column < end; column += 1) {
        cells[column] = segment.character;
      }

      cursor = nextCursor;
    }

    return cells.join("");
  }

  buildBodyRows(rowByName, targetOrder, scaleMaximum) {
    if (targetOrder.length === 0) {
      return [this.buildEmptyBodyRow()];
    }

    const assignedRows = targetOrder.map((name) => this.displayRows.get(name));
    const settledHeight = targetOrder.length * this.rowStride - this.gapRows;
    const renderedHeight = Math.max(settledHeight, Math.max(...assignedRows) + 1);
    const lines = Array.from({ length: renderedHeight }, () => this.buildEmptyBodyRow());

    for (const name of targetOrder) {
      const row = rowByName.get(name);
      if (!row) {
        continue;
      }

      const rowIndex = this.displayRows.get(name);
      const bar = this.renderSegments(row, scaleMaximum);
      const label = row.name.length <= this.labelWidth
        ? row.name.padEnd(this.labelWidth, " ")
        : row.name.slice(0, this.labelWidth);
      const valueSuffix = this.buildValueSuffix(row.total);

      if (this.showFrame) {
        lines[rowIndex] = `${label} │${bar}│${valueSuffix}`;
      } else {
        lines[rowIndex] = `${label} ${bar}${valueSuffix}`;
      }
    }

    return lines;
  }

  buildXAxisValueLine(ticks) {
    const labels = ticks.map((tick) => {
      return {
        position: tick.position,
        text: tick.label,
      };
    });
    const content = placeLabelsInLine(this.chartWidth, labels);
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${content}`);
  }

  buildXAxisTickLine(ticks) {
    const characters = Array.from({ length: this.chartWidth }, () => " ");
    for (const tick of ticks) {
      characters[tick.position] = "┴";
    }
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${characters.join("")}`);
  }

  buildTopBorderLine(ticks) {
    const border = Array.from({ length: this.chartWidth }, () => "─");
    if (this.showXAxisTicks) {
      for (const tick of ticks) {
        border[tick.position] = "┴";
      }
    }

    return this.padLine(
      `${" ".repeat(this.labelWidth + 1)}┌${border.join("")}┐${this.buildValuePaddingSuffix()}`,
    );
  }

  buildBottomBorderLine() {
    return this.padLine(
      `${" ".repeat(this.labelWidth + 1)}└${"─".repeat(this.chartWidth)}┘${this.buildValuePaddingSuffix()}`,
    );
  }

  buildXAxisTitleLine() {
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${this.xAxisTitle}`);
  }

  buildTimePointerLine() {
    const elapsed = Math.max(0, this.frames[this.timelineIndex].time - this.startTime);
    const progress = this.duration > 0
      ? clamp(elapsed / this.duration, 0, 1)
      : 1;
    const pointerPosition = this.chartWidth <= 1
      ? 0
      : Math.round(progress * (this.chartWidth - 1));

    const characters = Array.from({ length: this.chartWidth }, () => " ");
    characters[pointerPosition] = "^";
    const elapsedSuffix = this.showTimeValues
      ? ` t=${this.formatElapsedTime(elapsed)}`
      : "";
    return this.padLine(
      `${" ".repeat(this.labelWidth + 2)}${characters.join("")}${elapsedSuffix}`,
    );
  }

  buildTimeRangeLine() {
    const startText = this.formatElapsedTime(0);
    const endText = this.formatElapsedTime(Math.max(0, this.duration));
    const content = buildRangeLine(this.chartWidth, startText, endText);
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${content}`);
  }

  resolveRowsForCurrentFrame() {
    const frame = this.frames[this.timelineIndex];
    return this.buildRowByName(frame.rows);
  }

  renderCurrentFrame() {
    const rowByName = this.resolveRowsForCurrentFrame();
    const targetOrder = this.computeTargetOrder(rowByName, true);
    const targetRows = this.resolveTargetRows(targetOrder);

    this.updateDisplayRows(targetOrder, targetRows);

    const rowsForScale = targetOrder
      .map((name) => rowByName.get(name))
      .filter((row) => row !== undefined);
    const scaleMaximum = this.resolveScaleMaximum(rowsForScale);
    const ticks = (this.showXAxisValues || this.showXAxisTicks)
      ? this.resolveXAxisTicks(scaleMaximum)
      : [];

    const outputRows = [];
    if (this.xAxisTitle.length > 0) {
      outputRows.push(this.buildXAxisTitleLine());
    }
    if (this.showXAxisValues) {
      outputRows.push(this.buildXAxisValueLine(ticks));
    }
    if (this.showXAxisTicks && !this.showFrame) {
      outputRows.push(this.buildXAxisTickLine(ticks));
    }
    if (this.showFrame) {
      outputRows.push(this.buildTopBorderLine(ticks));
    }

    for (const rowLine of this.buildBodyRows(rowByName, targetOrder, scaleMaximum)) {
      outputRows.push(this.padLine(rowLine));
    }

    if (this.showFrame) {
      outputRows.push(this.buildBottomBorderLine());
    }
    if (this.showTimeAxis) {
      outputRows.push(this.buildTimePointerLine());
      if (this.showTimeValues) {
        outputRows.push(this.buildTimeRangeLine());
      }
    }

    this.lastFrame = outputRows.join("\n");
    return this.lastFrame;
  }

  advanceTimeline() {
    if (this.timelineIndex < this.frames.length - 1) {
      this.timelineIndex += 1;
      return;
    }

    if (!this.loop) {
      return;
    }

    this.timelineIndex = 0;
  }

  nextFrame() {
    this.advanceTimeline();
    return this.renderCurrentFrame();
  }

  reset() {
    this.timelineIndex = 0;
    this.previousTargetOrder = this.rowOrder.slice();
    this.initializeRows();
    return this.renderCurrentFrame();
  }

  isSettled() {
    const rowByName = this.resolveRowsForCurrentFrame();
    const targetOrder = this.computeTargetOrder(rowByName, false);
    for (let index = 0; index < targetOrder.length; index += 1) {
      const name = targetOrder[index];
      const targetRow = index * this.rowStride;
      if (this.displayRows.get(name) !== targetRow) {
        return false;
      }
    }
    return true;
  }

  isFinished() {
    return !this.loop
      && this.timelineIndex === this.frames.length - 1
      && this.isSettled();
  }
}

function measureCharacterCell(referenceElement) {
  const probe = document.createElement("span");
  probe.textContent = "M";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "pre";
  referenceElement.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  referenceElement.removeChild(probe);
  return {
    width: rect.width || 8,
  };
}

function computeCharacterColumns(element, minimumColumns) {
  const cell = measureCharacterCell(element);
  const bounds = element.getBoundingClientRect();
  const availableWidth = bounds.width || element.clientWidth || 80 * cell.width;
  return Math.max(minimumColumns, Math.floor(availableWidth / cell.width));
}

export function mountSegmentedAsciiScenarioChart(options = {}) {
  const {
    element,
    points,
    fps = 12,
    width,
    autoResize = true,
    minimumColumns = 42,
    resizeDebounceMs = 120,
    showPlaybackControls = true,
    controlsContainer,
    stopCheckboxLabel = "stop",
    ...chartOptions
  } = options;

  if (!element || typeof element !== "object") {
    throw new Error("element is required");
  }
  assertFiniteNumber(fps, "fps");
  if (fps <= 0) {
    throw new Error("fps must be greater than zero");
  }
  if (width !== undefined && width !== null && (!Number.isInteger(width) || width < minimumColumns)) {
    throw new Error("width must be an integer >= minimumColumns");
  }

  let chart = null;
  let timerId = null;
  let running = false;
  let resizeTimerId = null;
  let pauseCheckbox = null;
  let pauseLabel = null;
  let pauseChangeHandler = null;
  let createdControls = null;

  function resolveWidth() {
    if (width !== undefined && width !== null) {
      return width;
    }
    return computeCharacterColumns(element, minimumColumns);
  }

  function rebuildChart() {
    chart = new SegmentedAsciiScenarioChart({
      points,
      width: resolveWidth(),
      ...chartOptions,
    });
    element.textContent = chart.renderCurrentFrame();
  }

  function syncCheckbox() {
    if (!pauseCheckbox) {
      return;
    }
    pauseCheckbox.checked = !running;
  }

  function stop() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    running = false;
    syncCheckbox();
  }

  function start() {
    if (running) {
      return;
    }

    const frameDurationMs = 1000 / fps;
    timerId = window.setInterval(() => {
      element.textContent = chart.nextFrame();
      if (chart.isFinished()) {
        stop();
      }
    }, frameDurationMs);
    running = true;
    syncCheckbox();
  }

  function onResize() {
    if (!autoResize || (width !== undefined && width !== null)) {
      return;
    }

    if (resizeTimerId !== null) {
      window.clearTimeout(resizeTimerId);
    }

    resizeTimerId = window.setTimeout(() => {
      const nextWidth = resolveWidth();
      if (nextWidth !== chart.width) {
        const shouldRestart = running;
        stop();
        rebuildChart();
        if (shouldRestart) {
          start();
        }
      }
      resizeTimerId = null;
    }, resizeDebounceMs);
  }

  function setupControls() {
    if (!showPlaybackControls) {
      return;
    }

    const controls = controlsContainer ?? document.createElement("div");
    if (!controlsContainer) {
      controls.className = "automation-futures-controls";
      element.insertAdjacentElement("afterend", controls);
      createdControls = controls;
    }

    pauseLabel = document.createElement("label");
    pauseLabel.className = "automation-futures-toggle";

    pauseCheckbox = document.createElement("input");
    pauseCheckbox.type = "checkbox";
    pauseCheckbox.className = "automation-futures-toggle-checkbox";

    pauseChangeHandler = () => {
      if (pauseCheckbox.checked) {
        stop();
        return;
      }
      start();
    };

    pauseCheckbox.addEventListener("change", pauseChangeHandler);
    pauseLabel.appendChild(pauseCheckbox);
    pauseLabel.appendChild(document.createTextNode(` ${stopCheckboxLabel}`));
    controls.appendChild(pauseLabel);
    syncCheckbox();
  }

  rebuildChart();
  setupControls();
  start();

  if (autoResize) {
    window.addEventListener("resize", onResize);
  }

  return {
    start,
    stop,
    isRunning() {
      return running;
    },
    chart() {
      return chart;
    },
    destroy() {
      stop();
      if (resizeTimerId !== null) {
        window.clearTimeout(resizeTimerId);
        resizeTimerId = null;
      }
      if (autoResize) {
        window.removeEventListener("resize", onResize);
      }
      if (pauseCheckbox && pauseChangeHandler) {
        pauseCheckbox.removeEventListener("change", pauseChangeHandler);
      }
      if (pauseLabel && pauseLabel.parentElement) {
        pauseLabel.parentElement.removeChild(pauseLabel);
      }
      if (createdControls && createdControls.parentElement) {
        createdControls.parentElement.removeChild(createdControls);
      }

      pauseCheckbox = null;
      pauseLabel = null;
      pauseChangeHandler = null;
      createdControls = null;
    },
  };
}
