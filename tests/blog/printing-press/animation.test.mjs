import assert from "node:assert/strict";
import test from "node:test";

import {
  BOOK_BLANK,
  PRINTED_BOOKS,
  assertBookLineLengthsMatchBlank,
  createPrintedBook,
} from "../../../src/blog/printing-press/animation.mjs";

function expectBookLineLengthsToMatchBlank(book) {
  assert.equal(book.length, BOOK_BLANK.length);

  for (const [lineIndex, line] of book.entries()) {
    assert.equal(
      line.length,
      BOOK_BLANK[lineIndex].length,
      `book line ${lineIndex} should match the blank book line length`,
    );
  }
}

test("printed books preserve the blank book line lengths", () => {
  for (const book of PRINTED_BOOKS) {
    expectBookLineLengthsToMatchBlank(book);
  }
});

test("new printed book text cannot change the book line lengths", () => {
  expectBookLineLengthsToMatchBlank(createPrintedBook(
    "intentionally long left text",
    "short",
    "right side keeps going",
    "tiny",
  ));
});

test("book line length assertion rejects malformed sprites", () => {
  const malformedBook = BOOK_BLANK.slice();
  malformedBook[2] = malformedBook[2].slice(0, -1);

  assert.throws(
    () => assertBookLineLengthsMatchBlank(malformedBook, "malformed book"),
    /malformed book row 2 is 41 columns; expected 42/,
  );
});
