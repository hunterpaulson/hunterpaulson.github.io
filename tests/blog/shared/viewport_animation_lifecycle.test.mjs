import assert from "node:assert/strict";
import test from "node:test";

import { attachViewportAnimationLifecycle } from "../../../src/blog/shared/viewport_animation_lifecycle.mjs";

class FakeIntersectionObserver {
  static instances = [];

  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observedElements = [];
    this.disconnected = false;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element) {
    this.observedElements.push(element);
  }

  disconnect() {
    this.disconnected = true;
  }

  setIntersecting(isIntersecting) {
    if (this.disconnected) {
      return;
    }

    this.callback([{ isIntersecting }]);
  }
}

function createWindowObject({ innerHeight = 100 } = {}) {
  const target = new EventTarget();
  return {
    IntersectionObserver: FakeIntersectionObserver,
    addEventListener: target.addEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    innerHeight,
    removeEventListener: target.removeEventListener.bind(target),
  };
}

function createElement({ top, bottom }) {
  return {
    getBoundingClientRect() {
      return { top, bottom };
    },
  };
}

function dispatchPageTransition(target, type, persisted) {
  const event = new Event(type);
  Object.defineProperty(event, "persisted", {
    value: persisted,
    configurable: true,
  });
  target.dispatchEvent(event);
}

test("pauses initially when the element is outside the viewport margin", () => {
  FakeIntersectionObserver.instances = [];
  const windowObject = createWindowObject();
  const lifecycleEvents = [];

  attachViewportAnimationLifecycle({
    element: createElement({ top: 800, bottom: 900 }),
    pause() {
      lifecycleEvents.push("pause");
    },
    resume() {
      lifecycleEvents.push("resume");
    },
    rootMarginPx: 50,
    windowObject,
  });

  assert.deepEqual(lifecycleEvents, ["pause"]);
});

test("resumes and pauses when intersection changes", () => {
  FakeIntersectionObserver.instances = [];
  const windowObject = createWindowObject();
  const lifecycleEvents = [];

  attachViewportAnimationLifecycle({
    element: createElement({ top: 0, bottom: 20 }),
    pause() {
      lifecycleEvents.push("pause");
    },
    resume() {
      lifecycleEvents.push("resume");
    },
    windowObject,
  });

  const [observer] = FakeIntersectionObserver.instances;
  observer.setIntersecting(false);
  observer.setIntersecting(true);

  assert.deepEqual(lifecycleEvents, ["resume", "pause", "resume"]);
});

test("does not resume from bfcache while the element remains offscreen", () => {
  FakeIntersectionObserver.instances = [];
  const windowObject = createWindowObject();
  const lifecycleEvents = [];

  attachViewportAnimationLifecycle({
    element: createElement({ top: 0, bottom: 20 }),
    pause() {
      lifecycleEvents.push("pause");
    },
    resume() {
      lifecycleEvents.push("resume");
    },
    windowObject,
  });

  const [observer] = FakeIntersectionObserver.instances;
  observer.setIntersecting(false);
  dispatchPageTransition(windowObject, "pagehide", false);
  dispatchPageTransition(windowObject, "pageshow", true);

  assert.deepEqual(lifecycleEvents, ["resume", "pause"]);
});

test("detaches viewport and page lifecycle listeners", () => {
  FakeIntersectionObserver.instances = [];
  const windowObject = createWindowObject();
  const lifecycleEvents = [];

  const detachLifecycle = attachViewportAnimationLifecycle({
    element: createElement({ top: 0, bottom: 20 }),
    pause() {
      lifecycleEvents.push("pause");
    },
    resume() {
      lifecycleEvents.push("resume");
    },
    windowObject,
  });

  const [observer] = FakeIntersectionObserver.instances;
  detachLifecycle();
  observer.setIntersecting(false);
  dispatchPageTransition(windowObject, "pagehide", false);

  assert.equal(observer.disconnected, true);
  assert.deepEqual(lifecycleEvents, ["resume"]);
});
