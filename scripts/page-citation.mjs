import { parseFrontMatter } from "./content-page.mjs";
import { markdownToPlainText } from "./page-metadata.mjs";

const CITATION_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9:_-]*$/;
const MONTH_NAMES = Object.freeze([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

function parseCitationDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!MONTH_NAMES[monthIndex] || day < 1 || day > 31) {
    return null;
  }

  return {
    month: MONTH_NAMES[monthIndex],
    year: match[1],
  };
}

function escapeBibTeXText(value) {
  const replacements = {
    "\\": "\\textbackslash{}",
    "{": "\\{",
    "}": "\\}",
    "&": "\\&",
    "%": "\\%",
    "#": "\\#",
    "_": "\\_",
    "$": "\\$",
    "^": "\\^{}",
    "~": "\\~{}",
    '"': '{"}',
  };

  return String(value).replace(/[\\{}&%#_$^~"]/g, (character) => replacements[character]);
}

export function buildPageCitationMetadata(markdown) {
  const frontMatter = parseFrontMatter(markdown).data;
  const citationKey = frontMatter["citation-key"];
  if (!citationKey) {
    return {};
  }

  if (!CITATION_KEY_PATTERN.test(citationKey)) {
    throw new Error(
      `invalid citation-key "${citationKey}"; expected a stable key without spaces`,
    );
  }

  const date = parseCitationDate(frontMatter.date);
  if (!frontMatter.title || !frontMatter.author || !date || !frontMatter["canonical-url"]) {
    throw new Error(
      `${citationKey} citation requires author, date in YYYY-MM-DD format, and canonical-url`,
    );
  }

  const title = escapeBibTeXText(markdownToPlainText(frontMatter.title));
  const author = escapeBibTeXText(markdownToPlainText(frontMatter.author));

  return {
    "citation-author": author,
    "citation-month": date.month,
    "citation-title": title,
    "citation-url": frontMatter["canonical-url"],
    "citation-year": date.year,
  };
}
