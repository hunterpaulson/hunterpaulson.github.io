export function initializeGraphAnimations({
  root = document,
  windowObject = window,
} = {}) {
  const animations = root.querySelectorAll(".mono-graph-animation");

  animations.forEach((animation) => {
    if (animation.dataset.animationReady === "true") {
      return;
    }

    const frames = Array.from(animation.querySelectorAll(".mono-graph-animation__frame"));
    if (frames.length === 0) {
      return;
    }

    animation.dataset.animationReady = "true";

    const viewport = root.createElement("div");
    viewport.className = "mono-graph-animation__viewport";
    frames[0].before(viewport);
    frames.forEach((frame) => viewport.appendChild(frame));

    const controls = root.createElement("div");
    controls.className = "mono-graph-animation__controls";

    const previousButton = root.createElement("button");
    previousButton.type = "button";
    previousButton.textContent = "prev";

    const playButton = root.createElement("button");
    playButton.type = "button";

    const nextButton = root.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "next";

    const status = root.createElement("span");
    status.className = "mono-graph-animation__status";
    status.setAttribute("aria-live", "polite");

    controls.append(previousButton, playButton, nextButton, status);
    viewport.after(controls);

    const prefersReducedMotion = windowObject.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intervalMs = Number.parseInt(animation.dataset.interval || "1400", 10);
    const resolvedIntervalMs = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 1400;
    let activeIndex = 0;
    let isPlaying = !prefersReducedMotion;
    let timerId = null;

    function render() {
      frames.forEach((frame, frameIndex) => {
        const isActive = frameIndex === activeIndex;
        frame.classList.toggle("is-active", isActive);
        frame.setAttribute("aria-hidden", isActive ? "false" : "true");
      });
      playButton.textContent = isPlaying ? "pause" : "play";
      status.textContent = `${activeIndex + 1}/${frames.length}`;
    }

    function stopTimer() {
      if (timerId !== null) {
        windowObject.clearInterval(timerId);
        timerId = null;
      }
    }

    function startTimer() {
      stopTimer();
      timerId = windowObject.setInterval(() => {
        activeIndex = (activeIndex + 1) % frames.length;
        render();
      }, resolvedIntervalMs);
    }

    function syncTimer() {
      if (isPlaying) {
        startTimer();
      } else {
        stopTimer();
      }
    }

    function pausePlayback() {
      isPlaying = false;
      stopTimer();
    }

    previousButton.addEventListener("click", () => {
      pausePlayback();
      activeIndex = (activeIndex - 1 + frames.length) % frames.length;
      render();
    });

    playButton.addEventListener("click", () => {
      isPlaying = !isPlaying;
      render();
      syncTimer();
    });

    nextButton.addEventListener("click", () => {
      pausePlayback();
      activeIndex = (activeIndex + 1) % frames.length;
      render();
    });

    render();
    syncTimer();
  });
}
