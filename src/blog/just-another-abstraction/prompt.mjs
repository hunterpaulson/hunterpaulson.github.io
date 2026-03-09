const COMPACT_PROMPT_HEADER = "* Compiling ...";
const COMPACT_PROMPT_FOOTER = "  ⏵⏵ bypass permissions";
const PROMPT_FIRST_LINE_PREFIX = "❯ ";
const PROMPT_CONTINUATION_PREFIX = "  ";
const RULE_CHARACTER = "─";
const MIN_COMPACT_PROMPT_COLUMNS = 16;

export const DESKTOP_PROMPT_RULE_WIDTH = 78;

export function shouldUseCompactPromptLayout(columns) {
  return columns < DESKTOP_PROMPT_RULE_WIDTH;
}

export function formatCompactPromptScene({
  typed,
  columns,
  cursorVisible,
  cursor,
}) {
  const promptColumns = Math.max(MIN_COMPACT_PROMPT_COLUMNS, columns);
  const promptText = `${typed}${cursorVisible ? cursor : ""}`;
  const wrappedPromptLines = wrapPromptLines(promptText, promptColumns);

  return [
    COMPACT_PROMPT_HEADER,
    RULE_CHARACTER.repeat(promptColumns),
    ...wrappedPromptLines,
    RULE_CHARACTER.repeat(promptColumns),
    truncateLine(COMPACT_PROMPT_FOOTER, promptColumns),
  ].join("\n");
}

function wrapPromptLines(text, columns) {
  const lines = [];
  const words = text.length === 0 ? [""] : text.split(" ");
  let currentPrefix = PROMPT_FIRST_LINE_PREFIX;
  let currentLine = currentPrefix;

  for (const word of words) {
    const separator = currentLine === currentPrefix ? "" : " ";
    const candidate = `${currentLine}${separator}${word}`;
    if (candidate.length <= columns) {
      currentLine = candidate;
      continue;
    }

    if (currentLine !== currentPrefix) {
      lines.push(currentLine);
      currentPrefix = PROMPT_CONTINUATION_PREFIX;
      currentLine = currentPrefix;
    }

    let remainingWord = word;
    while (remainingWord.length > columns - currentPrefix.length) {
      const sliceWidth = columns - currentPrefix.length;
      lines.push(`${currentPrefix}${remainingWord.slice(0, sliceWidth)}`);
      remainingWord = remainingWord.slice(sliceWidth);
      currentPrefix = PROMPT_CONTINUATION_PREFIX;
      currentLine = currentPrefix;
    }

    currentLine = `${currentPrefix}${remainingWord}`;
  }

  lines.push(currentLine);
  return lines;
}

function truncateLine(text, columns) {
  if (text.length <= columns) {
    return text;
  }
  return text.slice(0, columns);
}
