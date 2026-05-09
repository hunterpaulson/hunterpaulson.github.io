const DEFAULT_MEDIA_EXPORT_ID = "default";

export function registerMediaExport(initialMetadata = {}) {
  const exportId = initialMetadata.id || initialMetadata.exportId || DEFAULT_MEDIA_EXPORT_ID;
  const controller = {
    ready: false,
    ...initialMetadata,
    id: exportId,
  };

  if (typeof window !== "undefined") {
    window.__mediaExports = window.__mediaExports || {};
    window.__mediaExports[exportId] = controller;

    if (exportId === DEFAULT_MEDIA_EXPORT_ID || !window.__mediaExport) {
      window.__mediaExport = controller;
    }
  }

  return {
    controller,
    update(nextMetadata = {}) {
      Object.assign(controller, nextMetadata);
    },
    setReady(nextMetadata = {}) {
      Object.assign(controller, nextMetadata);
      controller.ready = true;
    },
  };
}
