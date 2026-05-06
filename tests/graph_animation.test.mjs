import assert from "node:assert/strict";
import test from "node:test";

import { initializeGraphAnimations } from "../src/graph_animation.mjs";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(className, force) {
    if (force) {
      this.values.add(className);
    } else {
      this.values.delete(className);
    }
  }

  contains(className) {
    return this.values.has(className);
  }
}

class FakeElement extends EventTarget {
  constructor(tagName = "div") {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.classList = new FakeClassList();
    this.className = "";
    this.textContent = "";
    this.type = "";
    this.parent = null;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  before(element) {
    if (!this.parent) {
      return;
    }
    const index = this.parent.children.indexOf(this);
    element.parent = this.parent;
    this.parent.children.splice(index, 0, element);
  }

  after(element) {
    if (!this.parent) {
      return;
    }
    const index = this.parent.children.indexOf(this);
    element.parent = this.parent;
    this.parent.children.splice(index + 1, 0, element);
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  querySelectorAll(selector) {
    const matches = [];
    const className = selector.startsWith(".") ? selector.slice(1) : null;

    function visit(element) {
      if (className && element.className.split(/\s+/).includes(className)) {
        matches.push(element);
      }
      element.children.forEach(visit);
    }

    visit(this);
    return matches;
  }
}

class FakeDocument extends FakeElement {
  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

function createFakeWindow() {
  const intervals = new Map();
  let nextIntervalId = 1;

  return {
    matchMedia() {
      return { matches: false };
    },
    setInterval(callback, intervalMs) {
      const id = nextIntervalId;
      nextIntervalId += 1;
      intervals.set(id, { callback, intervalMs });
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
    tick(intervalMs) {
      for (const interval of Array.from(intervals.values())) {
        if (interval.intervalMs === intervalMs) {
          interval.callback();
        }
      }
    },
  };
}

function activeFrameIndex(frames) {
  return frames.findIndex((frame) => frame.classList.contains("is-active"));
}

function createGraphAnimationFixture() {
  const document = new FakeDocument();
  const animation = document.createElement("div");
  animation.className = "mono-graph-animation";
  animation.dataset.interval = "1400";
  const frames = [document.createElement("figure"), document.createElement("figure")];
  frames.forEach((frame) => {
    frame.className = "mono-graph mono-graph-animation__frame";
    animation.appendChild(frame);
  });
  document.appendChild(animation);

  const windowObject = createFakeWindow();

  initializeGraphAnimations({ root: document, windowObject });

  const [viewport] = animation.querySelectorAll(".mono-graph-animation__viewport");
  const [controls] = animation.querySelectorAll(".mono-graph-animation__controls");
  const [previousButton, playButton, nextButton] = controls.children;

  return {
    animation,
    frames,
    nextButton,
    playButton,
    previousButton,
    viewport,
    windowObject,
  };
}

test("graph animation keeps playing when scroll places the pointer over the viewport", () => {
  const { frames, viewport, windowObject } = createGraphAnimationFixture();

  assert.equal(activeFrameIndex(frames), 0);

  viewport.dispatchEvent(new Event("mouseenter"));
  windowObject.tick(1400);

  assert.equal(activeFrameIndex(frames), 1);
});

test("graph animation keeps playing while focused", () => {
  const { frames, viewport, windowObject } = createGraphAnimationFixture();

  assert.equal(activeFrameIndex(frames), 0);

  viewport.dispatchEvent(new Event("focusin"));
  windowObject.tick(1400);

  assert.equal(activeFrameIndex(frames), 1);
});

test("manual frame navigation pauses until play is pressed", () => {
  const { frames, nextButton, playButton, windowObject } = createGraphAnimationFixture();

  nextButton.dispatchEvent(new Event("click"));
  assert.equal(activeFrameIndex(frames), 1);

  windowObject.tick(1400);
  assert.equal(activeFrameIndex(frames), 1);

  playButton.dispatchEvent(new Event("click"));
  windowObject.tick(1400);
  assert.equal(activeFrameIndex(frames), 0);
});
