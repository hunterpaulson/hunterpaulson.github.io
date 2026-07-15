import { initializeFrameAnimations } from "./frame-animation.mjs";
import { renderMonoCharts } from "./mono-chart/render.mjs";
import { renderMonoGraphs } from "./mono-graph/render.mjs";

export function initializeVisualizations({
  root = document,
  documentObject = root.ownerDocument || root,
  windowObject = window,
  getCellDimensions,
} = {}) {
  if (typeof getCellDimensions !== "function") {
    throw new TypeError("initializeVisualizations requires getCellDimensions");
  }

  const render = () => {
    const options = {
      root,
      documentObject,
      windowObject,
      getCellDimensions,
    };
    renderMonoGraphs(options);
    renderMonoCharts(options);
  };

  render();
  windowObject.addEventListener("load", render);
  windowObject.addEventListener("resize", render);
  if (documentObject.fonts && documentObject.fonts.ready) {
    documentObject.fonts.ready.then(render);
  }

  initializeFrameAnimations({ root, windowObject });

  return { render };
}
