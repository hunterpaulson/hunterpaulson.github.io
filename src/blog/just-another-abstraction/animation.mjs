import { SCENES } from "./data.mjs";
import { registerMediaExport } from "../shared/media_export.mjs";
import { attachViewportAnimationLifecycle } from "../shared/viewport_animation_lifecycle.mjs";
import {
  formatCompactPromptScene,
  shouldUseCompactPromptLayout,
} from "./prompt.mjs";

const REVERSE_INPUT_ID = "abstraction-reverse";
const SCREEN_ELEMENT_ID = "abstraction-screen";
const CURSOR = "█";
const CUT_DURATION_MS = 180;
const CURSOR_BLINK_MS = 450;
const LOOP_DURATION_MS = SCENES.reduce((totalDurationMs, scene) => {
  return totalDurationMs + scene.durationMs + scene.holdMs + CUT_DURATION_MS;
}, 0);

function measureCharacterCell(referenceElement) {
  const probe = document.createElement("span");
  probe.textContent = "M";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "pre";
  referenceElement.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  referenceElement.removeChild(probe);
  return {
    width: rect.width || 8,
  };
}

function computeAvailableColumns(screenElement) {
  const characterCell = measureCharacterCell(screenElement);
  const elementWidth = screenElement.clientWidth || screenElement.getBoundingClientRect().width;
  return Math.max(16, Math.floor(elementWidth / characterCell.width));
}

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
  const mediaExport = registerMediaExport({
    fps: 8,
    loopDurationMs: LOOP_DURATION_MS,
  });
  const reversedScenes = [...SCENES].reverse();
  const state = createAnimationState(reducedMotion, SCENES);
  let availableColumns = computeAvailableColumns(screenElement);
  let frameId = null;

  function stopAnimationFrame() {
    if (frameId === null) {
      return;
    }

    window.cancelAnimationFrame(frameId);
    frameId = null;
  }

  function startAnimationFrame() {
    if (frameId !== null) {
      return;
    }

    frameId = window.requestAnimationFrame(tick);
  }

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
    if (scene.kind === "prompt" && shouldUseCompactPromptLayout(availableColumns)) {
      screenElement.textContent = formatCompactPromptScene({
        typed: scene.typed.slice(0, typedLength),
        columns: availableColumns,
        cursorVisible: state.cursorVisible,
        cursor: CURSOR,
      });
      screenElement.scrollLeft = 0;
    } else {
      screenElement.textContent = sceneText(scene, typedLength, state.cursorVisible);
    }
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

  const onResize = () => {
    availableColumns = computeAvailableColumns(screenElement);
    render();
  };

  window.addEventListener("resize", onResize);

  attachViewportAnimationLifecycle({
    element: screenElement.closest(".art-section") ?? screenElement,
    pause() {
      stopAnimationFrame();
    },
    resume() {
      state.lastTimestamp = 0;
      startAnimationFrame();
    },
  });

  render();
  mediaExport.setReady({
    sceneCount: SCENES.length,
  });
}

bootAbstractionAnimation();
