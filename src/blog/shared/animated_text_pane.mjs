function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function fitLine(text, width) {
  return String(text).slice(0, width).padEnd(width, " ");
}

function hashStringToUint32(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createMulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), state | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function easeInOut(progress) {
  return 0.5 - (Math.cos(Math.PI * progress) / 2);
}

function normalizeDocumentLines({ lines, text }) {
  if (Array.isArray(lines)) {
    return lines.map((line) => String(line));
  }
  if (typeof text === "string") {
    return text.split("\n");
  }
  return [];
}

function hasDocumentInput({ lines, text }) {
  return lines !== undefined || text !== undefined;
}

function buildPaddedDocument(lines, lineWidth, lineCount) {
  const paddedLines = [];
  for (let index = 0; index < lineCount; index += 1) {
    paddedLines.push(fitLine(lines[index] ?? "", lineWidth));
  }
  return paddedLines.join("\n");
}

const transitionOrderCache = new Map();

function getTransitionOrder(sourceText, targetText, cacheKey) {
  const cachedOrder = transitionOrderCache.get(cacheKey);
  if (cachedOrder) {
    return cachedOrder;
  }

  const mutableIndices = [];
  for (let index = 0; index < sourceText.length; index += 1) {
    if (sourceText[index] !== "\n" && targetText[index] !== "\n") {
      mutableIndices.push(index);
    }
  }

  const random = createMulberry32(hashStringToUint32(cacheKey));
  for (let index = mutableIndices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = mutableIndices[index];
    mutableIndices[index] = mutableIndices[swapIndex];
    mutableIndices[swapIndex] = current;
  }

  transitionOrderCache.set(cacheKey, mutableIndices);
  return mutableIndices;
}

export function renderDiffusedDocumentLines({
  fromLines,
  fromText,
  toLines,
  toText,
  progress,
  lineWidth,
  minimumLineCount = 0,
}) {
  const sourceLines = normalizeDocumentLines({ lines: fromLines, text: fromText });
  const targetResolvedLines = normalizeDocumentLines({ lines: toLines, text: toText });
  const targetLinesOrSource = hasDocumentInput({ lines: toLines, text: toText })
    ? targetResolvedLines
    : sourceLines;

  if (progress <= 0) {
    return buildPaddedDocument(
      sourceLines,
      lineWidth,
      Math.max(minimumLineCount, sourceLines.length, 1),
    ).split("\n");
  }
  if (progress >= 1) {
    return buildPaddedDocument(
      targetLinesOrSource,
      lineWidth,
      Math.max(minimumLineCount, targetLinesOrSource.length, 1),
    ).split("\n");
  }

  const lineCount = Math.max(minimumLineCount, sourceLines.length, targetLinesOrSource.length, 1);
  const sourceDocument = buildPaddedDocument(sourceLines, lineWidth, lineCount);
  const targetDocument = buildPaddedDocument(targetLinesOrSource, lineWidth, lineCount);

  const characters = sourceDocument.split("");
  const transitionOrder = getTransitionOrder(
    sourceDocument,
    targetDocument,
    `${hashStringToUint32(sourceDocument)}:${hashStringToUint32(targetDocument)}:${lineWidth}`,
  );
  const revealCount = Math.floor(transitionOrder.length * easeInOut(progress));

  for (let index = 0; index < revealCount; index += 1) {
    const transitionIndex = transitionOrder[index];
    characters[transitionIndex] = targetDocument[transitionIndex];
  }

  return characters.join("").split("\n");
}

function resolveScrollbarRows(totalLineCount, viewportLineCount, scrollOffset) {
  if (totalLineCount <= viewportLineCount) {
    return new Set();
  }

  const thumbHeight = Math.max(
    1,
    Math.round((viewportLineCount / totalLineCount) * viewportLineCount),
  );
  const maximumThumbTop = viewportLineCount - thumbHeight;
  const maximumScrollOffset = Math.max(0, totalLineCount - viewportLineCount);
  const thumbTop = maximumScrollOffset === 0
    ? 0
    : Math.round((scrollOffset / maximumScrollOffset) * maximumThumbTop);

  return new Set(Array.from({ length: thumbHeight }, (_, index) => thumbTop + index));
}

export function preserveScrollOffset({
  fromScrollOffset,
  fromTotalLineCount,
  toTotalLineCount,
  viewportLineCount,
}) {
  const fromMaxScrollOffset = Math.max(0, fromTotalLineCount - viewportLineCount);
  const toMaxScrollOffset = Math.max(0, toTotalLineCount - viewportLineCount);

  if (fromMaxScrollOffset === 0 || toMaxScrollOffset === 0) {
    return 0;
  }

  const ratio = clamp(fromScrollOffset / fromMaxScrollOffset, 0, 1);
  return Math.round(ratio * toMaxScrollOffset);
}

export function renderAnimatedTextPane({
  width,
  viewportLineCount,
  documentLines,
  documentText,
  fromLines,
  fromText,
  toLines,
  toText,
  progress = 0,
  scrollOffset = 0,
  scrollbarCharacter = "█",
  showScrollbar = true,
}) {
  const resolvedWidth = Math.max(4, width);
  const resolvedViewportLineCount = Math.max(1, viewportLineCount);
  const innerWidth = resolvedWidth - 2;
  const reserveScrollbarColumn = showScrollbar ? 1 : 0;
  const contentWidth = Math.max(1, innerWidth - reserveScrollbarColumn);
  const resolvedDocumentLines = documentLines ?? normalizeDocumentLines({ text: documentText });
  const hasAnimatedInput = hasDocumentInput({ lines: fromLines, text: fromText })
    || hasDocumentInput({ lines: toLines, text: toText });

  const renderedDocumentLines = hasAnimatedInput
    ? renderDiffusedDocumentLines({
      fromLines: fromLines ?? resolvedDocumentLines,
      fromText,
      toLines,
      toText,
      progress,
      lineWidth: contentWidth,
    })
    : normalizeDocumentLines({ lines: resolvedDocumentLines, text: documentText }).map((line) => {
      return fitLine(line, contentWidth);
    });

  const paddedDocumentLines = renderedDocumentLines.length === 0
    ? [fitLine("", contentWidth)]
    : renderedDocumentLines;
  const maximumScrollOffset = Math.max(0, paddedDocumentLines.length - resolvedViewportLineCount);
  const resolvedScrollOffset = clamp(scrollOffset, 0, maximumScrollOffset);
  const scrollbarRows = showScrollbar
    ? resolveScrollbarRows(paddedDocumentLines.length, resolvedViewportLineCount, resolvedScrollOffset)
    : new Set();
  const visibleLines = [];

  for (let index = 0; index < resolvedViewportLineCount; index += 1) {
    visibleLines.push(
      paddedDocumentLines[resolvedScrollOffset + index] ?? fitLine("", contentWidth),
    );
  }

  const paneLines = [`┌${"─".repeat(innerWidth)}┐`];
  for (let index = 0; index < resolvedViewportLineCount; index += 1) {
    const scrollbarCell = showScrollbar
      ? (scrollbarRows.has(index) ? scrollbarCharacter : " ")
      : "";
    paneLines.push(`│${fitLine(visibleLines[index], contentWidth)}${scrollbarCell}│`);
  }
  paneLines.push(`└${"─".repeat(innerWidth)}┘`);

  return paneLines.join("\n");
}
