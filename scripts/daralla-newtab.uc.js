(() => {
  if (window.__darallaNewTabOverlayLoaded) {
    return;
  }
  window.__darallaNewTabOverlayLoaded = true;

  const REPLACE_PREF = "zen.urlbar.replace-newtab";
  const BEHAVIOR_PREF = "zen.urlbar.behavior";
  const OVERLAY_PREF = "daralla.newtab.overlay";
  const BLANK_TRANSPARENT_PREF = "daralla.blank.transparent";
  const SAVED_FLAG_PREF = "daralla.newtab.overlay.saved";
  const SAVED_REPLACE_PREF = "daralla.newtab.overlay.saved-replace";
  const SAVED_BEHAVIOR_PREF = "daralla.newtab.overlay.saved-behavior";

  const root = document.documentElement;

  function getOverlayEnabled() {
    return Services.prefs.getBoolPref(OVERLAY_PREF, true);
  }

  function saveNativeUrlbarSettingsOnce() {
    if (Services.prefs.getBoolPref(SAVED_FLAG_PREF, false)) {
      return;
    }

    Services.prefs.setBoolPref(
      SAVED_REPLACE_PREF,
      Services.prefs.getBoolPref(REPLACE_PREF, true)
    );

    let behavior = "float";
    try {
      behavior = Services.prefs.getStringPref(BEHAVIOR_PREF);
    } catch (err) {
    }
    Services.prefs.setStringPref(SAVED_BEHAVIOR_PREF, behavior);
    Services.prefs.setBoolPref(SAVED_FLAG_PREF, true);
  }

  function restoreNativeUrlbarSettings() {
    if (!Services.prefs.getBoolPref(SAVED_FLAG_PREF, false)) {
      return;
    }

    Services.prefs.setBoolPref(
      REPLACE_PREF,
      Services.prefs.getBoolPref(SAVED_REPLACE_PREF, true)
    );
    Services.prefs.setStringPref(
      BEHAVIOR_PREF,
      Services.prefs.getStringPref(SAVED_BEHAVIOR_PREF, "float")
    );
  }

  function applyNewTabOverlayMode() {
    try {
      if (getOverlayEnabled()) {
        saveNativeUrlbarSettingsOnce();
        Services.prefs.setBoolPref(REPLACE_PREF, true);
        Services.prefs.setStringPref(BEHAVIOR_PREF, "float");
        root.setAttribute("daralla-newtab-overlay", "true");
      } else {
        restoreNativeUrlbarSettings();
        root.removeAttribute("daralla-newtab-overlay");
      }
    } catch (err) {
      console.error("[Daralla] Could not configure the new-tab overlay:", err);
    }
  }

  function isBlankBrowser(browser) {
    if (!browser) {
      return false;
    }
    const tab = gBrowser.getTabForBrowser(browser);
    if (tab?.hasAttribute("zen-empty-tab")) {
      return true;
    }
    try {
      return browser.currentURI?.spec === "about:blank";
    } catch (err) {
      return false;
    }
  }

  function setBlankTransparency(browser) {
    if (!browser) {
      return;
    }

    let transparent = false;
    try {
      transparent = Services.prefs.getBoolPref(BLANK_TRANSPARENT_PREF, true) && isBlankBrowser(browser);
    } catch (err) {
      transparent = isBlankBrowser(browser);
    }

    if (transparent) {
      browser.setAttribute("transparent", "true");
      browser.setAttribute("daralla-set-transparent", "true");
    } else if (browser.getAttribute("daralla-set-transparent") === "true") {
      browser.removeAttribute("transparent");
      browser.removeAttribute("daralla-set-transparent");
    }

    if (browser === gBrowser.selectedBrowser) {
      if (transparent) {
        root.setAttribute("daralla-blank-transparent", "true");
      } else {
        root.removeAttribute("daralla-blank-transparent");
      }
    }
  }

  function syncSelectedBlankTransparency() {
    try {
      setBlankTransparency(gBrowser.selectedBrowser);
    } catch (err) {
    }
  }

  applyNewTabOverlayMode();
  syncSelectedBlankTransparency();

  Services.prefs.addObserver(OVERLAY_PREF, applyNewTabOverlayMode);
  Services.prefs.addObserver(BLANK_TRANSPARENT_PREF, syncSelectedBlankTransparency);
  gBrowser.tabContainer.addEventListener("TabSelect", syncSelectedBlankTransparency);
  gBrowser.tabContainer.addEventListener("TabOpen", event => {
    setTimeout(() => setBlankTransparency(event.target.linkedBrowser), 0);
  });

  gBrowser.addTabsProgressListener({
    onLocationChange(browser) {
      setBlankTransparency(browser);
    },
  });

  window.addEventListener("unload", () => {
    Services.prefs.removeObserver(OVERLAY_PREF, applyNewTabOverlayMode);
    Services.prefs.removeObserver(BLANK_TRANSPARENT_PREF, syncSelectedBlankTransparency);
  });
})();
