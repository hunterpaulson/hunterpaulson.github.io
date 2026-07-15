import path from "node:path";

export const CONTENT_STATUSES = Object.freeze(["draft", "published"]);
export const DEFAULT_CONTENT_STATUS = "draft";

const FRONT_MATTER_DELIMITER = "---";

function stripMatchingQuotes(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];
  if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseFrontMatter(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== FRONT_MATTER_DELIMITER) {
    return {
      closeIndex: -1,
      data: {},
      hasFrontMatter: false,
      lines,
    };
  }

  const data = {};
  let closeIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === FRONT_MATTER_DELIMITER) {
      closeIndex = index;
      break;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    data[key] = stripMatchingQuotes(rawValue.trim());
  }

  if (closeIndex === -1) {
    return {
      closeIndex: -1,
      data: {},
      hasFrontMatter: false,
      lines,
    };
  }

  return {
    closeIndex,
    data,
    hasFrontMatter: true,
    lines,
  };
}

export function parseBooleanValue(rawValue, fallback) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return fallback;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function resolveContentStatus(frontMatter, sourcePath = "content page") {
  const status = String(frontMatter.status || DEFAULT_CONTENT_STATUS).trim().toLowerCase();
  if (!CONTENT_STATUSES.includes(status)) {
    throw new Error(
      `${sourcePath} has invalid status "${frontMatter.status}"; expected ${CONTENT_STATUSES.join(" or ")}`,
    );
  }

  return status;
}

function resolveContentPathParts(inputPath, rootDirectory) {
  const contentDirectory = path.join(rootDirectory, "content");
  const relativePath = path.relative(contentDirectory, path.resolve(inputPath));

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`content path must be inside ${contentDirectory}: ${inputPath}`);
  }

  const routeParts = relativePath.split(path.sep);
  const fileName = routeParts.at(-1);
  if (!fileName?.endsWith(".md")) {
    throw new Error(`content path must be a markdown file: ${inputPath}`);
  }

  return { fileName, routeParts };
}

export function resolveContentRoute(inputPath, rootDirectory = process.cwd()) {
  const { fileName, routeParts } = resolveContentPathParts(inputPath, rootDirectory);

  if (fileName === "index.md") {
    const directoryParts = routeParts.slice(0, -1);
    if (directoryParts.length === 0) {
      return "/";
    }

    return `/${directoryParts.join("/")}/`;
  }

  const stem = fileName.slice(0, -3);
  if (routeParts.length === 1) {
    return `/${stem}.html`;
  }

  return `/${[...routeParts.slice(0, -1), stem].join("/")}/`;
}

export function resolveContentOutputPath(inputPath, rootDirectory = process.cwd()) {
  const { fileName, routeParts } = resolveContentPathParts(inputPath, rootDirectory);

  if (fileName === "index.md") {
    return [...routeParts.slice(0, -1), "index.html"].join("/");
  }

  const stem = fileName.slice(0, -3);
  if (routeParts.length === 1) {
    return `${stem}.html`;
  }

  return [...routeParts.slice(0, -1), stem, "index.html"].join("/");
}
