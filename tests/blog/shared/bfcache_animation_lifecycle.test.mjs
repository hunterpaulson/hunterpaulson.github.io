import assert from "node:assert/strict";
import test from "node:test";

import { attachBfcacheAnimationLifecycle } from "../../../src/blog/shared/bfcache_animation_lifecycle.mjs";

function dispatchPageTransition(target, type, persisted) {
  const event = new Event(type);
  Object.defineProperty(event, "persisted", {
    value: persisted,
    configurable: true,
  });
  target.dispatchEvent(event);
}

test("bfcache restore resumes an animation after pagehide", () => {
  const target = new EventTarget();
  const lifecycleEvents = [];

  attachBfcacheAnimationLifecycle({
    target,
    pause() {
      lifecycleEvents.push("pause");
    },
    resume() {
      lifecycleEvents.push("resume");
    },
  });

  dispatchPageTransition(target, "pagehide", false);
  dispatchPageTransition(target, "pageshow", false);
  dispatchPageTransition(target, "pageshow", true);

  assert.deepEqual(lifecycleEvents, ["pause", "resume"]);
});

test("detaching the bfcache lifecycle removes both listeners", () => {
  const target = new EventTarget();
  const lifecycleEvents = [];
  const detachLifecycle = attachBfcacheAnimationLifecycle({
    target,
    pause() {
      lifecycleEvents.push("pause");
    },
    resume() {
      lifecycleEvents.push("resume");
    },
  });

  detachLifecycle();
  dispatchPageTransition(target, "pagehide", false);
  dispatchPageTransition(target, "pageshow", true);

  assert.deepEqual(lifecycleEvents, []);
});
