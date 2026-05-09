import { attachViewportAnimationLifecycle } from "../blog/shared/viewport_animation_lifecycle.mjs";

const DONUT_ELEMENT_ID = "d";
const FRAME_INTERVAL_MS = 50;
const HEIGHT = 45;
const WIDTH = 80;
const LUMINANCE = ".,-~:;=!*#$@";

function renderDonutFrame(element, state) {
  state.a += 0.07;
  state.b += 0.03;

  const zBuffer = [];
  const frameBuffer = [];
  const cosA = Math.cos(state.a);
  const sinA = Math.sin(state.a);
  const cosB = Math.cos(state.b);
  const sinB = Math.sin(state.b);

  for (let theta = 0; theta < 6.28; theta += 0.07) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let phi = 0; phi < 6.2; phi += 0.02) {
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const radius = cosTheta + 2;
      const depth = 1 / ((sinPhi * radius * sinA) + (sinTheta * cosA) + 5);
      const yBasis = (sinPhi * radius * cosA) - (sinTheta * sinA);
      const x = (WIDTH / 2) + (WIDTH * 0.375 * depth * ((cosPhi * radius * cosB) - (yBasis * sinB))) | 0;
      const y = (HEIGHT / 2) + (HEIGHT * 0.35 * depth * ((cosPhi * radius * sinB) + (yBasis * cosB))) | 0;
      const offset = x + (WIDTH * y);

      if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || depth <= (zBuffer[offset] || 0)) {
        continue;
      }

      const luminanceIndex = 8 * (
        ((sinTheta * sinA) - (sinPhi * cosTheta * cosA)) * cosB -
        (sinPhi * cosTheta * sinA) -
        (sinTheta * cosA) -
        (cosPhi * cosTheta * sinB)
      ) | 0;
      zBuffer[offset] = depth;
      frameBuffer[offset] = LUMINANCE[luminanceIndex < 0 ? 0 : luminanceIndex];
    }
  }

  let frame = "";
  for (let index = 0; index < WIDTH * HEIGHT; index += 1) {
    frame += frameBuffer[index] || " ";
    if (index % WIDTH === WIDTH - 1 && index < (WIDTH * HEIGHT) - 1) {
      frame += "\n";
    }
  }

  element.textContent = frame;
}

function bootDonutAnimation() {
  const element = document.getElementById(DONUT_ELEMENT_ID);
  if (!element) {
    return;
  }

  const state = {
    a: 0,
    b: 0,
  };
  let intervalId = null;

  function stopTimer() {
    if (intervalId === null) {
      return;
    }

    window.clearInterval(intervalId);
    intervalId = null;
  }

  function startTimer() {
    if (intervalId !== null) {
      return;
    }

    intervalId = window.setInterval(() => {
      renderDonutFrame(element, state);
    }, FRAME_INTERVAL_MS);
  }

  renderDonutFrame(element, state);
  attachViewportAnimationLifecycle({
    element,
    pause() {
      stopTimer();
    },
    resume() {
      startTimer();
    },
  });
}

bootDonutAnimation();
