import { SCENES } from "./abstraction_layers.mjs";

const REVERSE_INPUT_ID = "abstraction-reverse";
const SCREEN_ELEMENT_ID = "abstraction-screen";
const CURSOR = "█";
const CUT_DURATION_MS = 180;
const CURSOR_BLINK_MS = 450;

function sceneText(scene, typedLength, cursorVisible) {
  const prefix = scene.prefix ?? "";
  const suffix = scene.suffix ?? "";
  const typed = scene.typed.slice(0, typedLength);
  const cursor = cursorVisible ? CURSOR : "";
  return `${prefix}${typed}${cursor}${suffix}`;
}

function createAnimationState(reducedMotion, scenes) {
  return {
    sceneIndex: 0,
    phase: reducedMotion ? "hold" : "typing",
    typedProgress: reducedMotion ? scenes[0].typed.length : 0,
    holdElapsedMs: 0,
    cutElapsedMs: 0,
    cursorElapsedMs: 0,
    cursorVisible: true,
    lastTimestamp: 0,
  };
}

function bootAbstractionAnimation() {
  const reverseInput = document.getElementById(REVERSE_INPUT_ID);
  const screenElement = document.getElementById(SCREEN_ELEMENT_ID);
  if (!screenElement) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reversedScenes = [...SCENES].reverse();
  const state = createAnimationState(reducedMotion, SCENES);
  let frameId = null;

  function activeScenes() {
    if (reverseInput && reverseInput.checked) {
      return reversedScenes;
    }
    return SCENES;
  }

  function currentScene() {
    return activeScenes()[state.sceneIndex];
  }

  function resetForScene(index) {
    const scenes = activeScenes();
    state.sceneIndex = index;
    state.phase = reducedMotion ? "hold" : "typing";
    state.typedProgress = reducedMotion ? scenes[index].typed.length : 0;
    state.holdElapsedMs = 0;
    state.cutElapsedMs = 0;
  }

  function resetAnimation() {
    state.cursorElapsedMs = 0;
    state.cursorVisible = true;
    state.lastTimestamp = 0;
    resetForScene(0);
  }

  function advanceScene() {
    resetForScene((state.sceneIndex + 1) % activeScenes().length);
  }

  function render() {
    const scene = currentScene();

    if (state.phase === "cut") {
      screenElement.textContent = "";
      return;
    }

    const typedLength = Math.min(scene.typed.length, Math.floor(state.typedProgress));
    screenElement.textContent = sceneText(scene, typedLength, state.cursorVisible);
    screenElement.scrollTop = screenElement.scrollHeight;
  }

  function tick(timestamp) {
    if (state.lastTimestamp === 0) {
      state.lastTimestamp = timestamp;
    }

    const deltaMs = timestamp - state.lastTimestamp;
    state.lastTimestamp = timestamp;

    state.cursorElapsedMs += deltaMs;
    if (state.cursorElapsedMs >= CURSOR_BLINK_MS) {
      state.cursorElapsedMs = 0;
      state.cursorVisible = !state.cursorVisible;
    }

    const scene = currentScene();
    if (state.phase === "typing") {
      if (scene.typed.length === 0) {
        state.phase = "hold";
      } else {
        state.typedProgress += (deltaMs / scene.durationMs) * scene.typed.length;
        if (state.typedProgress >= scene.typed.length) {
          state.typedProgress = scene.typed.length;
          state.phase = "hold";
        }
      }
    } else if (state.phase === "hold") {
      state.holdElapsedMs += deltaMs;
      if (state.holdElapsedMs >= scene.holdMs) {
        state.phase = "cut";
        state.cutElapsedMs = 0;
      }
    } else {
      state.cutElapsedMs += deltaMs;
      if (state.cutElapsedMs >= CUT_DURATION_MS) {
        advanceScene();
      }
    }

    render();
    frameId = window.requestAnimationFrame(tick);
  }

  if (reverseInput) {
    reverseInput.addEventListener("change", () => {
      resetAnimation();
      render();
    });
  }

  render();
  frameId = window.requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }
  }, { once: true });
}

bootAbstractionAnimation();
