(() => {
  if (window.__darallaNativeNewTabLoaded) return;
  window.__darallaNativeNewTabLoaded = true;

  const OVERLAY_PREF = "daralla.newtab.overlay";
  const REPLACE_PREF = "zen.urlbar.replace-newtab";
  const BEHAVIOR_PREF = "zen.urlbar.behavior";
  const BLANK_PREF = "daralla.blank.transparent";
  const SAVED_BEHAVIOR_PREF = "daralla.newtab.overlay.saved-behavior";
  const SAVED_BEHAVIOR_FLAG = "daralla.newtab.overlay.saved-behavior-ready";
  const root = document.documentElement;

  function overlayEnabled() {
    return Services.prefs.getBoolPref(OVERLAY_PREF, true);
  }

  function applyNativeOverlayPreference() {
    try {
      const enabled = overlayEnabled();
      Services.prefs.setBoolPref(REPLACE_PREF, enabled);

      if (enabled) {
        if (!Services.prefs.getBoolPref(SAVED_BEHAVIOR_FLAG, false)) {
          let old = "float";
          try { old = Services.prefs.getStringPref(BEHAVIOR_PREF); } catch (_) {}
          Services.prefs.setStringPref(SAVED_BEHAVIOR_PREF, old);
          Services.prefs.setBoolPref(SAVED_BEHAVIOR_FLAG, true);
        }
        Services.prefs.setStringPref(BEHAVIOR_PREF, "float");
        root.setAttribute("daralla-native-newtab", "true");
      } else {
        if (Services.prefs.getBoolPref(SAVED_BEHAVIOR_FLAG, false)) {
          const old = Services.prefs.getStringPref(SAVED_BEHAVIOR_PREF, "float");
          Services.prefs.setStringPref(BEHAVIOR_PREF, old);
        }
        root.removeAttribute("daralla-native-newtab");
      }
    } catch (err) {
      console.error("[Daralla] Failed to configure native new-tab overlay:", err);
    }
  }

  function isBlankBrowser(browser) {
    if (!browser) return false;
    const tab = gBrowser.getTabForBrowser(browser);
    if (tab?.hasAttribute("zen-empty-tab")) return true;
    try {
      return browser.currentURI?.spec === "about:blank";
    } catch (_) {
      return false;
    }
  }

  function syncBlankTransparency(browser = gBrowser.selectedBrowser) {
    if (!browser) return;
    let enabled = true;
    try { enabled = Services.prefs.getBoolPref(BLANK_PREF, true); } catch (_) {}
    const shouldBeTransparent = enabled && isBlankBrowser(browser);

    if (shouldBeTransparent) {
      browser.setAttribute("transparent", "true");
      browser.setAttribute("daralla-set-transparent", "true");
    } else if (browser.getAttribute("daralla-set-transparent") === "true") {
      browser.removeAttribute("transparent");
      browser.removeAttribute("daralla-set-transparent");
    }

    if (browser === gBrowser.selectedBrowser) {
      root.toggleAttribute("daralla-blank-transparent", shouldBeTransparent);
    }
  }

  applyNativeOverlayPreference();
  syncBlankTransparency();

  Services.prefs.addObserver(OVERLAY_PREF, applyNativeOverlayPreference);
  Services.prefs.addObserver(BLANK_PREF, () => syncBlankTransparency());
  gBrowser.tabContainer.addEventListener("TabSelect", () => syncBlankTransparency());
  gBrowser.tabContainer.addEventListener("TabOpen", event => {
    setTimeout(() => syncBlankTransparency(event.target.linkedBrowser), 0);
  });
  gBrowser.addTabsProgressListener({
    onLocationChange(browser) {
      syncBlankTransparency(browser);
    },
  });

  window.addEventListener("unload", () => {
    Services.prefs.removeObserver(OVERLAY_PREF, applyNativeOverlayPreference);
    root.removeAttribute("daralla-native-newtab");
  });
})();
