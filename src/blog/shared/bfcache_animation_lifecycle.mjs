export function attachBfcacheAnimationLifecycle({
  target = window,
  pause,
  resume,
}) {
  function onPageHide() {
    pause();
  }

  function onPageShow(event) {
    if (!event.persisted) {
      return;
    }

    resume();
  }

  target.addEventListener("pagehide", onPageHide);
  target.addEventListener("pageshow", onPageShow);

  return function detachBfcacheAnimationLifecycle() {
    target.removeEventListener("pagehide", onPageHide);
    target.removeEventListener("pageshow", onPageShow);
  };
}
