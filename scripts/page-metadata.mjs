import fs from "node:fs";
import path from "node:path";

import { parseFrontMatter, resolveContentRoute } from "./content-page.mjs";

export { parseFrontMatter, resolveContentRoute } from "./content-page.mjs";

export const DEFAULT_SITE_NAME = "hunter paulson";
export const DEFAULT_SITE_URL = "https://hunterpaulson.dev";
export const DEFAULT_DESCRIPTION = "Hunter Paulson's personal website for writing, art, projects, and experiments in computer science.";
export const DEFAULT_SOCIAL_IMAGE = "/assets/social/home-blackhole.gif";
export const DEFAULT_SOCIAL_IMAGE_ALT = "ASCII black hole animation from Hunter Paulson's personal website.";

const FRONT_MATTER_DELIMITER = "---";

function normalizeSiteUrl(siteUrl) {
  return (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function toAbsoluteUrl(value, siteUrl = DEFAULT_SITE_URL) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  if (value.startsWith("/")) {
    return `${normalizedSiteUrl}${value}`;
  }

  return `${normalizedSiteUrl}/${value}`;
}

function formatPageTitle({ route, title, date }) {
  if (!title) {
    return DEFAULT_SITE_NAME;
  }

  const plainTitle = markdownToPlainText(title);
  if (route === "/" || !date) {
    return `${DEFAULT_SITE_NAME} | ${plainTitle}`;
  }

  return `${plainTitle} | ${DEFAULT_SITE_NAME}`;
}

export function markdownToPlainText(value) {
  return String(value)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/([*_~]{1,3})([^*_~]+)\1/g, "$2")
    .replace(/\\([\\`*_\[\]{}()#+\-.!])/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveLocalAssetPath(assetUrl, rootDirectory) {
  if (/^https?:\/\//i.test(assetUrl)) {
    return null;
  }

  const relativeAssetPath = assetUrl.startsWith("/") ? assetUrl.slice(1) : assetUrl;
  return path.join(rootDirectory, relativeAssetPath);
}

function readGifDimensions(buffer) {
  if (buffer.length < 10 || buffer.toString("ascii", 0, 3) !== "GIF") {
    return null;
  }

  return {
    height: buffer.readUInt16LE(8),
    type: "image/gif",
    width: buffer.readUInt16LE(6),
  };
}

function readPngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    return null;
  }

  return {
    height: buffer.readUInt32BE(20),
    type: "image/png",
    width: buffer.readUInt32BE(16),
  };
}

function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2) {
      return null;
    }

    if (
      marker >= 0xc0
      && marker <= 0xc3
      && offset + segmentLength + 2 <= buffer.length
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        type: "image/jpeg",
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += segmentLength + 2;
  }

  return null;
}

export function readImageMetadata(assetUrl, rootDirectory = process.cwd()) {
  const localPath = resolveLocalAssetPath(assetUrl, rootDirectory);
  if (!localPath || !fs.existsSync(localPath)) {
    return null;
  }

  const buffer = fs.readFileSync(localPath);
  return readGifDimensions(buffer)
    ?? readPngDimensions(buffer)
    ?? readJpegDimensions(buffer);
}

export function buildPageMetadata(inputPath, markdown, options = {}) {
  const rootDirectory = options.rootDirectory ?? process.cwd();
  const siteUrl = normalizeSiteUrl(options.siteUrl ?? process.env.SITE_URL);
  const frontMatter = parseFrontMatter(markdown).data;
  const route = resolveContentRoute(inputPath, rootDirectory);
  const description = markdownToPlainText(frontMatter.description || DEFAULT_DESCRIPTION);
  const socialImage = frontMatter["social-image"] || DEFAULT_SOCIAL_IMAGE;
  const imageMetadata = readImageMetadata(socialImage, rootDirectory);
  const isArticle = Boolean(frontMatter.date) && route.startsWith("/blog/") && route !== "/blog/";

  return {
    "canonical-url": toAbsoluteUrl(route, siteUrl),
    "description": description,
    "og-type": frontMatter["og-type"] || (isArticle ? "article" : "website"),
    "site-name": DEFAULT_SITE_NAME,
    "social-description": markdownToPlainText(frontMatter["social-description"] || description),
    "social-image-alt": markdownToPlainText(frontMatter["social-image-alt"] || DEFAULT_SOCIAL_IMAGE_ALT),
    "social-image-height": imageMetadata?.height ?? "",
    "social-image-type": imageMetadata?.type ?? "",
    "social-image-url": toAbsoluteUrl(socialImage, siteUrl),
    "social-image-width": imageMetadata?.width ?? "",
    "social-title": markdownToPlainText(frontMatter["social-title"] || formatPageTitle({
      date: frontMatter.date,
      route,
      title: frontMatter.title,
    })),
    "twitter-card": frontMatter["twitter-card"] || "summary_large_image",
    ...(isArticle ? { "article-published-time": frontMatter.date } : {}),
  };
}

function formatYamlValue(value) {
  if (typeof value === "number") {
    return String(value);
  }

  if (value === "") {
    return "\"\"";
  }

  return JSON.stringify(String(value));
}

function metadataLines(metadata, existingKeys) {
  return Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, value]) => `${key}: ${formatYamlValue(value)}`);
}

export function injectPageMetadata(markdown, metadata) {
  const parsed = parseFrontMatter(markdown);
  const existingKeys = new Set(Object.keys(parsed.data));
  const linesToInsert = metadataLines(metadata, existingKeys);

  if (linesToInsert.length === 0) {
    return markdown;
  }

  if (!parsed.hasFrontMatter) {
    return [
      FRONT_MATTER_DELIMITER,
      ...linesToInsert,
      FRONT_MATTER_DELIMITER,
      "",
      markdown,
    ].join("\n");
  }

  const lines = [...parsed.lines];
  lines.splice(parsed.closeIndex, 0, ...linesToInsert);
  return lines.join("\n");
}
