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

function normalizePoints(points) {
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error("points must be a non-empty array");
  }

  return points.map((point, index) => {
    if (!point || typeof point !== "object") {
      throw new Error(`point at index ${index} must be an object`);
    }

    const { name, time, value } = point;
    if (typeof name !== "string" || name.length === 0) {
      throw new Error(`point at index ${index} has an invalid name`);
    }

    assertFiniteNumber(time, `point[${index}].time`);
    assertFiniteNumber(value, `point[${index}].value`);

    return {
      name,
      time,
      value,
    };
  });
}

function groupSeriesByName(points) {
  const grouped = new Map();
  for (const point of points) {
    if (!grouped.has(point.name)) {
      grouped.set(point.name, []);
    }
    grouped.get(point.name).push({ time: point.time, value: point.value });
  }

  for (const series of grouped.values()) {
    series.sort((left, right) => left.time - right.time);
  }

  return grouped;
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

function interpolateSeriesValue(series, time, missingValue) {
  if (series.length === 0) {
    return missingValue;
  }

  if (time < series[0].time || time > series[series.length - 1].time) {
    return missingValue;
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

    const duration = right.time - left.time;
    if (duration <= 0) {
      return right.value;
    }

    const ratio = (time - left.time) / duration;
    return left.value + (right.value - left.value) * ratio;
  }

  return series[series.length - 1].value;
}

function resolveTopN(topN, totalNames) {
  if (topN === undefined || topN === null || topN === Infinity) {
    return totalNames;
  }
  if (!Number.isInteger(topN) || topN <= 0) {
    throw new Error("topN must be a positive integer");
  }
  return Math.min(topN, totalNames);
}

function clipName(name, width) {
  if (name.length <= width) {
    return name.padEnd(width, " ");
  }
  return name.slice(0, width);
}

function roundWhenCloseToInteger(value) {
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 0.000001) {
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

function maxAbsolute(values) {
  let maximum = 0;
  for (const value of values) {
    maximum = Math.max(maximum, Math.abs(value));
  }
  return maximum;
}

function minNonZeroAbsolute(values) {
  let minimum = Number.POSITIVE_INFINITY;
  for (const value of values) {
    const absolute = Math.abs(value);
    if (absolute > 0 && absolute < minimum) {
      minimum = absolute;
    }
  }
  return minimum;
}

function chooseAdaptiveValueFormatter(values) {
  const absoluteMaximum = maxAbsolute(values);
  const minimumNonZero = minNonZeroAbsolute(values);
  const hasFractionalValues = values.some((value) => {
    return Math.abs(value - Math.round(value)) > 0.000001;
  });

  if (absoluteMaximum >= 1000000) {
    const compactFormatter = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return (value) => compactFormatter.format(roundWhenCloseToInteger(value));
  }

  if (minimumNonZero < 0.001) {
    return (value) => roundWhenCloseToInteger(value).toExponential(2).replace("+", "");
  }

  if (absoluteMaximum >= 1000) {
    const integerFormatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    });
    return (value) => integerFormatter.format(roundWhenCloseToInteger(value));
  }

  if (!hasFractionalValues) {
    return (value) => String(Math.round(value));
  }

  if (absoluteMaximum >= 100) {
    return (value) => formatTrimmedDecimal(value, 1);
  }

  if (absoluteMaximum >= 1) {
    return (value) => formatTrimmedDecimal(value, 2);
  }

  if (!Number.isFinite(minimumNonZero)) {
    return (value) => formatTrimmedDecimal(value, 2);
  }

  const decimals = clamp(Math.ceil(-Math.log10(minimumNonZero)) + 1, 2, 6);
  return (value) => formatTrimmedDecimal(value, decimals);
}

function defaultTimeFormatter(value) {
  return formatTrimmedDecimal(value, 2);
}

function defaultLogAxisFormatter(value) {
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

function buildLogTickValues(maximumValue, minimumVisibleValue) {
  if (!(maximumValue > 0)) {
    return [0];
  }

  const multipliers = [1, 2, 5];
  const minimum = Math.max(
    minimumVisibleValue,
    maximumValue * 0.000000000001,
  );
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
    const last = kept[kept.length - 1];
    if (current.position - last.position >= minimumGap) {
      kept.push(current);
    }
  }

  const lastTick = ticks[ticks.length - 1];
  const lastKept = kept[kept.length - 1];
  if (lastTick.position === lastKept.position) {
    return kept;
  }

  if (lastTick.position - lastKept.position >= minimumGap) {
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
    const isEdgeLabel = index === 0 || index === labels.length - 1;
    if (text.length === 0 || text.length > width) {
      continue;
    }

    let start = clamp(
      position - Math.floor(text.length / 2),
      0,
      width - text.length,
    );

    if (start <= lastEnd) {
      if (!isEdgeLabel) {
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

export function buildInterpolatedFrames(points, options = {}) {
  const {
    frameStep,
    framesPerTimeUnit = 1,
    missingValue = 0,
  } = options;

  assertFiniteNumber(missingValue, "missingValue");

  const normalizedPoints = normalizePoints(points);
  const seriesByName = groupSeriesByName(normalizedPoints);
  const names = Array.from(seriesByName.keys()).sort((left, right) => left.localeCompare(right));
  const allTimes = normalizedPoints.map((point) => point.time);
  const minimumTime = Math.min(...allTimes);
  const maximumTime = Math.max(...allTimes);
  const resolvedStep = resolveFrameStep(frameStep, framesPerTimeUnit);
  const times = sampleTimes(minimumTime, maximumTime, resolvedStep);

  return times.map((time) => {
    const values = new Map();
    for (const name of names) {
      const series = seriesByName.get(name);
      values.set(name, interpolateSeriesValue(series, time, missingValue));
    }
    return {
      time,
      values,
    };
  });
}

export class AsciiBarChartRace {
  constructor(options = {}) {
    const {
      points,
      width = 80,
      frameStep,
      framesPerTimeUnit = 1,
      gapRows = 1,
      rowSpeed = 1,
      topN = Infinity,
      barCharacter = "█",
      valueFormatter,
      valueWidth,
      axisValueFormatter,
      timeFormatter = defaultTimeFormatter,
      missingValue = 0,
      rankEpsilon = 0.0001,
      loop = true,
      showFrame = true,
      showXAxisValues = true,
      showXAxisTicks = true,
      xAxisTickCount = 5,
      showTimeAxis = true,
      xScaleMode = "global",
      xScaleMax,
      xAxisTitle,
      xAxisLabel = "",
    } = options;

    if (!Number.isInteger(width) || width < 30) {
      throw new Error("width must be an integer >= 30");
    }
    if (!Number.isInteger(gapRows) || gapRows < 0) {
      throw new Error("gapRows must be an integer >= 0");
    }
    if (!Number.isInteger(rowSpeed) || rowSpeed <= 0) {
      throw new Error("rowSpeed must be a positive integer");
    }
    if (typeof barCharacter !== "string" || barCharacter.length === 0) {
      throw new Error("barCharacter must be a non-empty string");
    }
    if (valueFormatter !== undefined && typeof valueFormatter !== "function") {
      throw new Error("valueFormatter must be a function");
    }
    if (axisValueFormatter !== undefined && typeof axisValueFormatter !== "function") {
      throw new Error("axisValueFormatter must be a function");
    }
    if (typeof timeFormatter !== "function") {
      throw new Error("timeFormatter must be a function");
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
    if (valueWidth !== undefined && (!Number.isInteger(valueWidth) || valueWidth <= 0)) {
      throw new Error("valueWidth must be a positive integer");
    }

    const normalizedPoints = normalizePoints(points);

    this.width = width;
    this.gapRows = gapRows;
    this.rowStride = gapRows + 1;
    this.rowSpeed = rowSpeed;
    this.barCharacter = barCharacter;
    this.missingValue = missingValue;
    this.rankEpsilon = Math.abs(rankEpsilon);
    this.loop = loop;
    this.showFrame = showFrame;
    this.showXAxisValues = showXAxisValues;
    this.showXAxisTicks = showXAxisTicks;
    this.showTimeAxis = showTimeAxis;
    this.xAxisTickCount = xAxisTickCount;
    this.xScaleMode = xScaleMode;
    this.xScaleMax = xScaleMax ?? null;
    this.xAxisTitle = typeof xAxisTitle === "string"
      ? xAxisTitle
      : (typeof xAxisLabel === "string" ? xAxisLabel : "");

    this.names = Array.from(new Set(normalizedPoints.map((point) => point.name))).sort((left, right) => {
      return left.localeCompare(right);
    });
    this.topN = resolveTopN(topN, this.names.length);
    this.frames = buildInterpolatedFrames(normalizedPoints, {
      frameStep,
      framesPerTimeUnit,
      missingValue,
    });

    this.startTime = this.frames[0].time;
    this.endTime = this.frames[this.frames.length - 1].time;
    this.duration = this.endTime - this.startTime;

    this.globalValues = this.collectAllValues();
    this.globalScaleMax = Math.max(1, ...this.globalValues);

    const baseValueFormatter = typeof valueFormatter === "function"
      ? valueFormatter
      : chooseAdaptiveValueFormatter(this.globalValues);
    this.valueFormatter = (value) => String(baseValueFormatter(value));

    const baseAxisValueFormatter = typeof axisValueFormatter === "function"
      ? axisValueFormatter
      : defaultLogAxisFormatter;
    this.axisValueFormatter = (value) => String(baseAxisValueFormatter(value));
    this.timeFormatter = (value) => String(timeFormatter(value));

    const inferredValueWidth = this.globalValues.reduce((maximum, value) => {
      return Math.max(maximum, this.valueFormatter(value).length);
    }, 1);
    this.valueWidth = valueWidth ?? inferredValueWidth;

    const maximumLabelLength = this.names.reduce((maximum, name) => {
      return Math.max(maximum, name.length);
    }, 1);
    const labelWidthCap = Math.max(4, Math.floor(this.width * 0.35));
    let resolvedLabelWidth = Math.min(maximumLabelLength, labelWidthCap);
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

    this.timelineIndex = 0;
    this.displayRows = new Map();
    this.previousTargetOrder = this.names.slice();
    this.lastFrame = "";

    this.initializeRows();
  }

  collectAllValues() {
    const values = [];
    for (const frame of this.frames) {
      for (const name of this.names) {
        values.push(Math.max(0, frame.values.get(name) ?? this.missingValue));
      }
    }
    return values;
  }

  initializeRows() {
    const frame = this.frames[this.timelineIndex];
    const targetOrder = this.computeTargetOrder(frame.values, true);
    const targetRows = this.resolveTargetRows(targetOrder);

    this.displayRows = new Map();
    for (const name of targetOrder) {
      this.displayRows.set(name, targetRows.get(name));
    }
  }

  getCurrentTime() {
    return this.frames[this.timelineIndex].time;
  }

  computeTargetOrder(valueMap, persist = true) {
    const previousOrderIndex = new Map();
    for (let index = 0; index < this.previousTargetOrder.length; index += 1) {
      previousOrderIndex.set(this.previousTargetOrder[index], index);
    }

    const ordered = this.names.slice().sort((leftName, rightName) => {
      const leftValue = valueMap.get(leftName) ?? this.missingValue;
      const rightValue = valueMap.get(rightName) ?? this.missingValue;
      const difference = rightValue - leftValue;

      if (Math.abs(difference) > this.rankEpsilon) {
        return difference;
      }

      const leftPrevious = previousOrderIndex.get(leftName) ?? Number.MAX_SAFE_INTEGER;
      const rightPrevious = previousOrderIndex.get(rightName) ?? Number.MAX_SAFE_INTEGER;
      if (leftPrevious !== rightPrevious) {
        return leftPrevious - rightPrevious;
      }

      return leftName.localeCompare(rightName);
    });

    const visible = ordered.slice(0, this.topN);
    if (persist) {
      this.previousTargetOrder = visible;
    }
    return visible;
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
      const candidateRows = [];

      if (step !== 0) {
        candidateRows.push(movedRow);
      }
      candidateRows.push(currentRow);

      const nextRow = this.pickAvailableRow(candidateRows, occupiedRows, currentRow);
      occupiedRows.add(nextRow);
      nextRows.set(name, nextRow);
    }

    this.displayRows = nextRows;
  }

  padLine(lineText) {
    if (lineText.length >= this.width) {
      return lineText.slice(0, this.width);
    }
    return lineText.padEnd(this.width, " ");
  }

  formatValue(value) {
    return this.valueFormatter(value);
  }

  formatAxisValue(value) {
    return this.axisValueFormatter(value);
  }

  formatElapsedTime(value) {
    return this.timeFormatter(value);
  }

  resolveScaleMaximum(valueMap, targetOrder) {
    if (this.xScaleMax !== null) {
      return this.xScaleMax;
    }

    if (this.xScaleMode === "global") {
      return this.globalScaleMax;
    }

    let frameMaximum = 0;
    for (const name of targetOrder) {
      frameMaximum = Math.max(frameMaximum, Math.max(0, valueMap.get(name) ?? this.missingValue));
    }

    return frameMaximum > 0 ? frameMaximum : this.globalScaleMax;
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

  buildEmptyBodyRow() {
    if (this.showFrame) {
      return `${" ".repeat(this.labelWidth)} │${" ".repeat(this.chartWidth)}│ ${" ".repeat(this.valueWidth)}`;
    }

    return `${" ".repeat(this.labelWidth)} ${" ".repeat(this.chartWidth)} ${" ".repeat(this.valueWidth)}`;
  }

  buildBodyRows(targetOrder, valueMap, scaleMaximum) {
    if (targetOrder.length === 0) {
      return [this.buildEmptyBodyRow()];
    }

    const assignedRows = targetOrder.map((name) => this.displayRows.get(name));
    const settledHeight = targetOrder.length * this.rowStride - this.gapRows;
    const renderedHeight = Math.max(settledHeight, Math.max(...assignedRows) + 1);
    const lines = Array.from({ length: renderedHeight }, () => this.buildEmptyBodyRow());

    for (const name of targetOrder) {
      const rowIndex = this.displayRows.get(name);
      const value = Math.max(0, valueMap.get(name) ?? this.missingValue);

      let barLength = scaleMaximum > 0
        ? Math.round((value / scaleMaximum) * this.chartWidth)
        : 0;
      barLength = clamp(barLength, 0, this.chartWidth);

      if (value > 0 && barLength === 0) {
        barLength = 1;
      }

      const bar = this.barCharacter.repeat(barLength).padEnd(this.chartWidth, " ");
      const label = clipName(name, this.labelWidth);
      const valueText = this.formatValue(value).padStart(this.valueWidth, " ");

      if (this.showFrame) {
        lines[rowIndex] = `${label} │${bar}│ ${valueText}`;
        continue;
      }

      lines[rowIndex] = `${label} ${bar} ${valueText}`;
    }

    return lines;
  }

  buildXAxisValueLine(xAxisTicks) {
    const labels = xAxisTicks.map((tick) => {
      return {
        position: tick.position,
        text: tick.label,
      };
    });
    const content = placeLabelsInLine(this.chartWidth, labels);
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${content}`);
  }

  buildXAxisTickLine(xAxisTicks) {
    const characters = Array.from({ length: this.chartWidth }, () => " ");
    for (const tick of xAxisTicks) {
      characters[tick.position] = "┴";
    }
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${characters.join("")}`);
  }

  buildTopBorderLine(xAxisTicks) {
    const borderCharacters = Array.from({ length: this.chartWidth }, () => "─");
    if (this.showXAxisTicks) {
      for (const tick of xAxisTicks) {
        borderCharacters[tick.position] = "┴";
      }
    }

    return this.padLine(
      `${" ".repeat(this.labelWidth + 1)}┌${borderCharacters.join("")}┐ ${" ".repeat(this.valueWidth)}`,
    );
  }

  buildBottomBorderLine() {
    return this.padLine(
      `${" ".repeat(this.labelWidth + 1)}└${"─".repeat(this.chartWidth)}┘ ${" ".repeat(this.valueWidth)}`,
    );
  }

  buildXAxisTitleLine() {
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${this.xAxisTitle}`);
  }

  buildTimeRangeLine() {
    const startText = this.formatElapsedTime(0);
    const endText = this.formatElapsedTime(Math.max(0, this.duration));
    const content = buildRangeLine(this.chartWidth, startText, endText);
    return this.padLine(`${" ".repeat(this.labelWidth + 2)}${content}`);
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
    const elapsedLabel = this.formatElapsedTime(elapsed);
    return this.padLine(
      `${" ".repeat(this.labelWidth + 2)}${characters.join("")} t=${elapsedLabel}`,
    );
  }

  renderCurrentFrame() {
    const frame = this.frames[this.timelineIndex];
    const targetOrder = this.computeTargetOrder(frame.values, true);
    const targetRows = this.resolveTargetRows(targetOrder);

    this.updateDisplayRows(targetOrder, targetRows);
    const scaleMaximum = this.resolveScaleMaximum(frame.values, targetOrder);
    const bodyRows = this.buildBodyRows(targetOrder, frame.values, scaleMaximum);
    const xAxisTicks = (this.showXAxisValues || this.showXAxisTicks)
      ? this.resolveXAxisTicks(scaleMaximum)
      : [];

    const outputRows = [];
    if (this.xAxisTitle.length > 0) {
      outputRows.push(this.buildXAxisTitleLine());
    }
    if (this.showXAxisValues) {
      outputRows.push(this.buildXAxisValueLine(xAxisTicks));
    }
    if (this.showXAxisTicks && !this.showFrame) {
      outputRows.push(this.buildXAxisTickLine(xAxisTicks));
    }
    if (this.showFrame) {
      outputRows.push(this.buildTopBorderLine(xAxisTicks));
    }

    for (const bodyRow of bodyRows) {
      outputRows.push(this.padLine(bodyRow));
    }

    if (this.showFrame) {
      outputRows.push(this.buildBottomBorderLine());
    }
    if (this.showTimeAxis) {
      outputRows.push(this.buildTimePointerLine());
      outputRows.push(this.buildTimeRangeLine());
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
    this.initializeRows();
  }

  nextFrame() {
    this.advanceTimeline();
    return this.renderCurrentFrame();
  }

  reset() {
    this.timelineIndex = 0;
    this.previousTargetOrder = this.names.slice();
    this.initializeRows();
    return this.renderCurrentFrame();
  }

  isSettled() {
    const frame = this.frames[this.timelineIndex];
    const targetOrder = this.computeTargetOrder(frame.values, false);
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

export function mountAsciiBarChartRace(options = {}) {
  const {
    element,
    points,
    fps = 12,
    width,
    autoResize = true,
    minimumColumns = 30,
    resizeDebounceMs = 120,
    showPlaybackControls = true,
    controlsContainer,
    stopCheckboxLabel = "stop",
    ...raceOptions
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

  let renderer = null;
  let timerId = null;
  let running = false;
  let resizeTimerId = null;
  let pauseCheckbox = null;
  let pauseCheckboxLabel = null;
  let pauseCheckboxChangeHandler = null;
  let createdControls = null;

  function resolveWidth() {
    if (width !== undefined && width !== null) {
      return width;
    }
    return computeCharacterColumns(element, minimumColumns);
  }

  function rebuildRenderer() {
    renderer = new AsciiBarChartRace({
      points,
      width: resolveWidth(),
      ...raceOptions,
    });
    element.textContent = renderer.renderCurrentFrame();
  }

  function syncPauseCheckbox() {
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
    syncPauseCheckbox();
  }

  function start() {
    if (running) {
      return;
    }

    const frameDurationMs = 1000 / fps;
    timerId = window.setInterval(() => {
      element.textContent = renderer.nextFrame();
      if (renderer.isFinished()) {
        stop();
      }
    }, frameDurationMs);
    running = true;
    syncPauseCheckbox();
  }

  function toggle() {
    if (running) {
      stop();
      return;
    }
    start();
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
      if (nextWidth !== renderer.width) {
        const shouldRestart = running;
        stop();
        rebuildRenderer();
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
      controls.className = "bar-chart-race-controls";
      element.insertAdjacentElement("afterend", controls);
      createdControls = controls;
    }

    pauseCheckboxLabel = document.createElement("label");
    pauseCheckboxLabel.className = "bar-chart-race-toggle";

    pauseCheckbox = document.createElement("input");
    pauseCheckbox.type = "checkbox";
    pauseCheckbox.className = "bar-chart-race-toggle-checkbox";

    pauseCheckboxChangeHandler = () => {
      if (pauseCheckbox.checked) {
        stop();
        return;
      }
      start();
    };
    pauseCheckbox.addEventListener("change", pauseCheckboxChangeHandler);

    pauseCheckboxLabel.appendChild(pauseCheckbox);
    pauseCheckboxLabel.appendChild(document.createTextNode(` ${stopCheckboxLabel}`));
    controls.appendChild(pauseCheckboxLabel);
    syncPauseCheckbox();
  }

  rebuildRenderer();
  setupControls();
  start();

  if (autoResize) {
    window.addEventListener("resize", onResize);
  }

  return {
    start,
    stop,
    toggle,
    isRunning() {
      return running;
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
      if (pauseCheckbox && pauseCheckboxChangeHandler) {
        pauseCheckbox.removeEventListener("change", pauseCheckboxChangeHandler);
      }
      if (pauseCheckboxLabel && pauseCheckboxLabel.parentElement) {
        pauseCheckboxLabel.parentElement.removeChild(pauseCheckboxLabel);
      }
      if (createdControls && createdControls.parentElement) {
        createdControls.parentElement.removeChild(createdControls);
      }
      pauseCheckbox = null;
      pauseCheckboxLabel = null;
      pauseCheckboxChangeHandler = null;
      createdControls = null;
    },
    renderer() {
      return renderer;
    },
  };
}
