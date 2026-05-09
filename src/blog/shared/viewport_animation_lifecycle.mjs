function parseRootMarginPx(rootMarginPx) {
  const parsed = Number(rootMarginPx);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isElementNearViewport(element, windowObject, rootMarginPx) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return true;
  }

  const viewportHeight = windowObject.innerHeight ?? 0;
  if (viewportHeight <= 0) {
    return true;
  }

  const rect = element.getBoundingClientRect();
  return rect.bottom >= -rootMarginPx && rect.top <= viewportHeight + rootMarginPx;
}

export function attachViewportAnimationLifecycle({
  element,
  pause,
  resume,
  rootMarginPx = 0,
  windowObject = window,
} = {}) {
  if (!element || typeof pause !== "function" || typeof resume !== "function") {
    return () => {};
  }

  const resolvedRootMarginPx = parseRootMarginPx(rootMarginPx);
  let pageActive = true;
  let viewportActive = isElementNearViewport(element, windowObject, resolvedRootMarginPx);
  let active = null;

  function syncLifecycle() {
    const nextActive = pageActive && viewportActive;
    if (active === nextActive) {
      return;
    }

    active = nextActive;
    if (active) {
      resume();
    } else {
      pause();
    }
  }

  const onPageHide = () => {
    pageActive = false;
    syncLifecycle();
  };

  const onPageShow = (event) => {
    if (!event.persisted) {
      return;
    }

    pageActive = true;
    if (!observer) {
      viewportActive = isElementNearViewport(element, windowObject, resolvedRootMarginPx);
    }
    syncLifecycle();
  };

  const canListenForPageTransitions = (
    typeof windowObject.addEventListener === "function" &&
    typeof windowObject.removeEventListener === "function"
  );
  if (canListenForPageTransitions) {
    windowObject.addEventListener("pagehide", onPageHide);
    windowObject.addEventListener("pageshow", onPageShow);
  }

  const Observer = windowObject.IntersectionObserver;
  let observer = null;
  if (typeof Observer === "function") {
    observer = new Observer((entries) => {
      viewportActive = entries.some((entry) => entry.isIntersecting);
      syncLifecycle();
    }, {
      rootMargin: `${resolvedRootMarginPx}px 0px`,
    });
    observer.observe(element);
  }

  syncLifecycle();

  return function detachViewportAnimationLifecycle() {
    if (observer) {
      observer.disconnect();
    }

    if (canListenForPageTransitions) {
      windowObject.removeEventListener("pagehide", onPageHide);
      windowObject.removeEventListener("pageshow", onPageShow);
    }
  };
}
