import { attachBfcacheAnimationLifecycle } from "../shared/bfcache_animation_lifecycle.mjs";

const SCREEN_ELEMENT_ID = "printing-press-screen";
const TARGET_FPS = 12;
const STAGE_WIDTH = 46;
const STAGE_HEIGHT = 16;
const STAMP_UP_Y = 0;
const STAMP_DOWN_Y = 6;
const BOOK_Y = STAGE_HEIGHT - 7;

const INTRO_MS = 1800;
const PRE_PRESS_MS = 450;
const PRESS_DOWN_MS = 900;
const PRESS_HOLD_MS = 520;
const PRESS_UP_MS = 980;
const BOOK_GAP = 3;
const SWAP_MS = 1900;
const LOOP_MS = PRE_PRESS_MS + PRESS_DOWN_MS + PRESS_HOLD_MS + PRESS_UP_MS + SWAP_MS;

const SPINNER = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
const SPINNER_STEP_MS = 180;
const VERB_CHANGE_SPINNER_LOOPS = 2;
const VERB_CHANGE_MS = SPINNER_STEP_MS * SPINNER.length * VERB_CHANGE_SPINNER_LOOPS;
const VERBS = [
  "Accomplishing",
  "Architecting",
  "Baking",
  "Bootstrapping",
  "Calculating",
  "Choreographing",
  "Clauding",
  "Cogitating",
  "Combobulating",
  "Cooking",
  "Crafting",
  "Discombobulating",
  "Doodling",
  "Embellishing",
  "Flibbertigibbeting",
  "Generating",
  "Gitifying",
  "Hyperspacing",
  "Ideating",
  "Improvising",
  "Noodling",
  "Orchestrating",
  "Percolating",
  "Pondering",
  "Prestidigitating",
  "Processing",
  "Recombobulating",
  "Reticulating",
  "Ruminating",
  "Shenaniganing",
  "Synthesizing",
  "Thinking",
  "Transmuting",
  "Unfurling",
  "Vibing",
  "Whirring",
  "Working",
  "Zigzagging",
];
const VERB_SEQUENCE = shuffle(VERBS);

export const BOOK_BLANK = [
  "     __...--~~~~~-._   _.-~~~~~--...__",
  "   //               `V'               \\\\ ",
  "  //                 |                 \\\\ ",
  " //__...--~~~~~~-._  |  _.-~~~~~~--...__\\\\ ",
  "//__.....----~~~~._\\ | /_.~~~~----.....__\\\\",
  "===================\\\\|//===================",
  "                   `---`",
];

const BOOK_WIDTH = Math.max(...BOOK_BLANK.map((line) => line.length));

export function createPrintedBook(leftTop, leftBottom, rightTop, rightBottom) {
  return assertBookLineLengthsMatchBlank([
    "     __...--~~~~~-._   _.-~~~~~--...__",
    `   //  ${fixedWidth(leftTop, 12)} \`V'  ${fixedWidth(rightTop, 12)} \\\\ `,
    `  //  ${fixedWidth(leftBottom, 12)}  |    ${fixedWidth(rightBottom, 10)}    \\\\ `,
    " //__...--~~~~~~-._  |  _.-~~~~~~--...__\\\\ ",
    "//__.....----~~~~._\\ | /_.~~~~----.....__\\\\",
    "===================\\\\|//===================",
    "                   `---`",
  ], "printed book");
}

export const PRINTED_BOOKS = [
  createPrintedBook("System.out", ".println(", "\"Hello,", "world!\");"),
  createPrintedBook("SELECT *", "FROM ideas", "WHERE useful", "LIMIT 10;"),
  createPrintedBook("mov rax,60", "xor rdi,rdi", "syscall", "; exit"),
  createPrintedBook("01001000", "01101001", "0x48 0x69", "\"Hi\""),
  createPrintedBook("uvicorn app", "--reload", "FastAPI()", "@app.get"),
  createPrintedBook("int main()", "printf(\"hi\")", "return 0;", "}"),
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fixedWidth(text, width) {
  if (text.length > width) {
    return text.slice(0, width);
  }
  return text.padEnd(width, " ");
}

export function assertBookLineLengthsMatchBlank(book, label = "book") {
  if (book.length !== BOOK_BLANK.length) {
    throw new Error(`${label} has ${book.length} rows; expected ${BOOK_BLANK.length}`);
  }

  for (let row = 0; row < book.length; row += 1) {
    const expectedLength = BOOK_BLANK[row].length;
    if (book[row].length !== expectedLength) {
      throw new Error(`${label} row ${row} is ${book[row].length} columns; expected ${expectedLength}`);
    }
  }

  return book;
}

function shuffle(items) {
  const shuffled = items.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createCanvas() {
  return Array.from(
    { length: STAGE_HEIGHT },
    () => Array.from({ length: STAGE_WIDTH }, () => " "),
  );
}

function drawSprite(canvas, sprite, x, y, { opaque = false } = {}) {
  for (let row = 0; row < sprite.length; row += 1) {
    const targetY = y + row;
    if (targetY < 0 || targetY >= canvas.length) {
      continue;
    }

    const line = sprite[row];
    for (let column = 0; column < line.length; column += 1) {
      const targetX = x + column;
      if (targetX < 0 || targetX >= canvas[targetY].length) {
        continue;
      }

      const character = line[column];
      if (!opaque && character === " ") {
        continue;
      }
      canvas[targetY][targetX] = character;
    }
  }
}

function renderCanvas(canvas) {
  return canvas.map((line) => line.join("").trimEnd()).join("\n");
}

function spinnerText(elapsedMs) {
  const spinner = SPINNER[Math.floor(elapsedMs / SPINNER_STEP_MS) % SPINNER.length];
  const verb = VERB_SEQUENCE[Math.floor(elapsedMs / VERB_CHANGE_MS) % VERB_SEQUENCE.length];
  return `${spinner} ${verb}`;
}

function createStamp(elapsedMs) {
  const status = fixedWidth(spinnerText(elapsedMs), 35);
  return [
    "   __________________________________________",
    "  /                                         /|",
    " /                                         / |",
    "/_________________________________________/  |",
    "|                                         |  |",
    `|   ${status}   | /`,
    "|_________________________________________|/",
    "'-----------------------------------------'",
  ];
}

function lerpInteger(from, to, progress) {
  return Math.round(from + (to - from) * clamp(progress, 0, 1));
}

function activePrintedBook(loopIndex) {
  return PRINTED_BOOKS[loopIndex % PRINTED_BOOKS.length];
}

function renderIntro(elapsedMs) {
  const progress = elapsedMs / INTRO_MS;
  const canvas = createCanvas();
  drawSprite(canvas, BOOK_BLANK, lerpInteger(-BOOK_BLANK[0].length, 0, progress), BOOK_Y);
  drawSprite(canvas, createStamp(elapsedMs), 0, STAMP_UP_Y, { opaque: true });
  return renderCanvas(canvas);
}

function renderPressLoop(loopElapsedMs, loopIndex, elapsedMs) {
  const canvas = createCanvas();
  let stampY = STAMP_UP_Y;
  let bookSprite = BOOK_BLANK;
  let bookX = 0;
  let nextBookX = null;
  let time = loopElapsedMs;

  if (time < PRE_PRESS_MS) {
    // blank book waits under the press
  } else {
    time -= PRE_PRESS_MS;
    if (time < PRESS_DOWN_MS) {
      stampY = lerpInteger(STAMP_UP_Y, STAMP_DOWN_Y, time / PRESS_DOWN_MS);
    } else {
      time -= PRESS_DOWN_MS;
      if (time < PRESS_HOLD_MS) {
        stampY = STAMP_DOWN_Y;
      } else {
        time -= PRESS_HOLD_MS;
        bookSprite = activePrintedBook(loopIndex);
        if (time < PRESS_UP_MS) {
          stampY = lerpInteger(STAMP_DOWN_Y, STAMP_UP_Y, time / PRESS_UP_MS);
        } else {
          time -= PRESS_UP_MS;
          stampY = STAMP_UP_Y;
          bookX = lerpInteger(0, BOOK_WIDTH + BOOK_GAP, time / SWAP_MS);
          nextBookX = bookX - BOOK_WIDTH - BOOK_GAP;
        }
      }
    }
  }

  drawSprite(canvas, bookSprite, bookX, BOOK_Y);
  if (nextBookX !== null) {
    drawSprite(canvas, BOOK_BLANK, nextBookX, BOOK_Y);
  }
  drawSprite(canvas, createStamp(elapsedMs), 0, stampY, { opaque: true });
  return renderCanvas(canvas);
}

function frameAt(elapsedMs, reducedMotion) {
  if (reducedMotion) {
    const canvas = createCanvas();
    drawSprite(canvas, activePrintedBook(0), 0, BOOK_Y);
    drawSprite(canvas, createStamp(elapsedMs), 0, STAMP_UP_Y, { opaque: true });
    return renderCanvas(canvas);
  }

  if (elapsedMs < INTRO_MS) {
    return renderIntro(elapsedMs);
  }

  const loopElapsedTotal = elapsedMs - INTRO_MS;
  const loopIndex = Math.floor(loopElapsedTotal / LOOP_MS);
  const loopElapsedMs = loopElapsedTotal % LOOP_MS;
  return renderPressLoop(loopElapsedMs, loopIndex, elapsedMs);
}

function bootPrintingPressAnimation() {
  const screenElement = document.getElementById(SCREEN_ELEMENT_ID);
  if (!screenElement) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frameDurationMs = 1000 / TARGET_FPS;
  let intervalId = null;
  const startedAt = performance.now();

  function render() {
    screenElement.textContent = frameAt(performance.now() - startedAt, reducedMotion);
    screenElement.scrollLeft = 0;
    screenElement.scrollTop = 0;
  }

  function stopTimer() {
    if (intervalId === null) {
      return;
    }
    window.clearInterval(intervalId);
    intervalId = null;
  }

  function startTimer() {
    if (reducedMotion || intervalId !== null) {
      return;
    }
    intervalId = window.setInterval(render, frameDurationMs);
  }

  attachBfcacheAnimationLifecycle({
    pause: stopTimer,
    resume() {
      render();
      startTimer();
    },
  });

  render();
  startTimer();
}

if (typeof document !== "undefined") {
  bootPrintingPressAnimation();
}
