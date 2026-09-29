// Daralla — YouTube Ambilight bridge
(() => {
  "use strict";

  const PREF_ENABLED = "daralla.ambilight.enabled";
  const PREF_FPS = "daralla.ambilight.fps";
  const PREF_BLUR = "daralla.ambilight.blur";
  const PREF_INTENSITY = "daralla.ambilight.intensity";
  const PREF_SATURATION = "daralla.ambilight.saturation";

  const DEFAULTS = {
    enabled: true,
    fps: 15,
    blur: 34,
    intensity: 0.72,
    saturation: 1.35,
  };

  let running = false;
  let timer = null;
  let lastUrl = "";
  let lastFrame = "";
  let sourceCanvas = null;
  let sourceCtx = null;
  let sourceDocument = null;

  const root = () => document.documentElement;

  function pref(name, fallback) {
    try {
      if (typeof Services !== "undefined" && Services.prefs.prefHasUserValue(name)) {
        const type = Services.prefs.getPrefType(name);
        if (type === Services.prefs.PREF_BOOL) return Services.prefs.getBoolPref(name);
        if (type === Services.prefs.PREF_INT) return Services.prefs.getIntPref(name);
        if (type === Services.prefs.PREF_STRING) return Services.prefs.getStringPref(name);
      }
    } catch {}
    return fallback;
  }

  function setVar(name, value) {
    root().style.setProperty(name, String(value));
  }

  function clearVars() {
    [
      "--daralla-ambilight-frame",
      "--daralla-ambilight-opacity",
      "--daralla-ambilight-blur",
      "--daralla-ambilight-saturation",
    ].forEach((name) => root().style.removeProperty(name));

    root().removeAttribute("daralla-ambilight-active");
  }

  function isYouTube(url) {
    try {
      const u = new URL(url);
      return (
        (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
        (u.pathname === "/watch" || u.pathname.startsWith("/live/"))
      );
    } catch {
      return false;
    }
  }

  function getVideo() {
    const browser = gBrowser?.selectedBrowser;
    if (!browser) return null;

    try {
      const win = browser.contentWindow;
      const doc = win?.document;
      return doc?.querySelector("video.html5-main-video") || doc?.querySelector("video");
    } catch {
      return null;
    }
  }

  function ensureCanvas(video) {
    const ownerDocument = video.ownerDocument;

    if (sourceCanvas && sourceDocument === ownerDocument) return true;

    try {
      sourceDocument = ownerDocument;
      sourceCanvas = ownerDocument.createElement("canvas");
      sourceCanvas.width = 96;
      sourceCanvas.height = 54;
      sourceCanvas.setAttribute("aria-hidden", "true");
      sourceCanvas.style.cssText =
        "position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;pointer-events:none;opacity:0;";
      ownerDocument.documentElement.appendChild(sourceCanvas);

      sourceCtx = sourceCanvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });

      return !!sourceCtx;
    } catch {
      sourceCanvas = null;
      sourceCtx = null;
      sourceDocument = null;
      return false;
    }
  }

  function frameData(video) {
    if (!ensureCanvas(video)) return null;
    if (video.readyState < 2 || video.videoWidth < 2 || video.videoHeight < 2) return null;

    try {
      sourceCtx.drawImage(video, 0, 0, 96, 54);
      return sourceCanvas.toDataURL("image/webp", 0.62);
    } catch (error) {
      if (error?.name === "SecurityError") {
        console.warn("[Daralla Ambilight] YouTube refused pixel access for this video.");
      }
      return null;
    }
  }

  function applyFrame(data) {
    if (!data || data === lastFrame) return;
    lastFrame = data;

    setVar("--daralla-ambilight-frame", `url("${data}")`);
    setVar("--daralla-ambilight-opacity", pref(PREF_INTENSITY, DEFAULTS.intensity));
    setVar("--daralla-ambilight-blur", `${pref(PREF_BLUR, DEFAULTS.blur)}px`);
    setVar("--daralla-ambilight-saturation", pref(PREF_SATURATION, DEFAULTS.saturation));
    root().setAttribute("daralla-ambilight-active", "true");
  }

  function resetCanvas() {
    try {
      sourceCanvas?.remove();
    } catch {}
    sourceCanvas = null;
    sourceCtx = null;
    sourceDocument = null;
  }

  function stop(clear = true) {
    running = false;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    resetCanvas();

    if (clear) {
      lastFrame = "";
      clearVars();
    }
  }

  function schedule() {
    if (!running) return;

    const fps = Math.max(
      5,
      Math.min(30, Number(pref(PREF_FPS, DEFAULTS.fps)) || DEFAULTS.fps),
    );

    timer = setTimeout(tick, Math.round(1000 / fps));
  }

  function tick() {
    if (!running) return;

    try {
      if (!pref(PREF_ENABLED, DEFAULTS.enabled)) {
        stop(true);
        return;
      }

      const browser = gBrowser?.selectedBrowser;
      const url = browser?.currentURI?.spec || "";

      if (!isYouTube(url)) {
        stop(true);
        return;
      }

      if (url !== lastUrl) {
        lastUrl = url;
        lastFrame = "";
        resetCanvas();
      }

      const video = getVideo();
      if (video) {
        const data = frameData(video);
        if (data) applyFrame(data);
      }
    } catch (error) {
      console.warn("[Daralla Ambilight] tick failed", error);
    }

    schedule();
  }

  function refresh() {
    if (!pref(PREF_ENABLED, DEFAULTS.enabled)) {
      stop(true);
      return;
    }

    if (!running) {
      running = true;
      tick();
    }
  }

  function resetForTab() {
    lastUrl = "";
    lastFrame = "";
    resetCanvas();
    refresh();
  }

  function init() {
    if (!window.gBrowser) return;

    root().setAttribute("daralla-ambilight-module", "true");

    gBrowser.tabContainer.addEventListener("TabSelect", resetForTab, true);

    gBrowser.addTabsProgressListener({
      onLocationChange() {
        resetForTab();
      },
    });

    refresh();

    window.addEventListener(
      "unload",
      () => {
        stop(true);
        gBrowser?.tabContainer?.removeEventListener("TabSelect", resetForTab, true);
      },
      { once: true },
    );
  }

  if (document.readyState === "loading") {
    window.addEventListener("load", init, { once: true });
  } else {
    init();
  }
})();
