(() => {
  if (window.__darallaNativeNewTabLoaded) {
    return;
  }
  window.__darallaNativeNewTabLoaded = true;

  const OVERLAY_PREF = "daralla.newtab.overlay";
  const BLANK_TRANSPARENT_PREF = "daralla.blank.transparent";
  const REPLACE_PREF = "zen.urlbar.replace-newtab";
  const BEHAVIOR_PREF = "zen.urlbar.behavior";

  const root = document.documentElement;

  function overlayEnabled() {
    return Services.prefs.getBoolPref(OVERLAY_PREF, true);
  }

  function blankTransparencyEnabled() {
    return Services.prefs.getBoolPref(BLANK_TRANSPARENT_PREF, true);
  }

  function configureNativeNewTab() {
    try {
      if (overlayEnabled()) {
        Services.prefs.setBoolPref(REPLACE_PREF, true);
        Services.prefs.setStringPref(BEHAVIOR_PREF, "float");
        root.setAttribute("daralla-newtab-overlay", "true");
      } else {
        root.removeAttribute("daralla-newtab-overlay");
      }
    } catch (err) {
      console.error("[Daralla] Could not configure native new-tab overlay:", err);
    }
  }

  function currentSpec(browser) {
    try {
      return browser?.currentURI?.spec || "";
    } catch (err) {
      return "";
    }
  }

  function isActuallyBlank(browser) {
    if (!browser) {
      return false;
    }
    const tab = gBrowser.getTabForBrowser(browser);
    if (!tab?.hasAttribute("zen-empty-tab")) {
      return false;
    }
    const spec = currentSpec(browser);
    return spec === "about:blank" || spec === "about:newtab";
  }

  function applyBlankTransparency(browser) {
    if (!browser) {
      return;
    }

    const shouldBeTransparent = blankTransparencyEnabled() && isActuallyBlank(browser);

    if (shouldBeTransparent) {
      browser.setAttribute("transparent", "true");
      browser.setAttribute("daralla-set-transparent", "true");
    } else if (browser.getAttribute("daralla-set-transparent") === "true") {
      browser.removeAttribute("transparent");
      browser.removeAttribute("daralla-set-transparent");
    }

    if (browser === gBrowser.selectedBrowser) {
      if (shouldBeTransparent) {
        root.setAttribute("daralla-blank-transparent", "true");
      } else {
        root.removeAttribute("daralla-blank-transparent");
      }
    }
  }

  function syncSelected() {
    try {
      const browser = gBrowser.selectedBrowser;
      applyBlankTransparency(browser);
    } catch (err) {
    }
  }

  function deferSync(browser) {
    window.requestAnimationFrame(() => {
      applyBlankTransparency(browser);
      window.setTimeout(() => applyBlankTransparency(browser), 0);
    });
  }

  configureNativeNewTab();
  syncSelected();

  Services.prefs.addObserver(OVERLAY_PREF, configureNativeNewTab);
  Services.prefs.addObserver(BLANK_TRANSPARENT_PREF, syncSelected);

  gBrowser.tabContainer.addEventListener("TabSelect", syncSelected);
  gBrowser.tabContainer.addEventListener("TabOpen", event => {
    deferSync(event.target.linkedBrowser);
  });

  gBrowser.addTabsProgressListener({
    onLocationChange(browser) {
      deferSync(browser);
    },
    onStateChange(browser, webProgress, request, stateFlags) {
      if (stateFlags & Ci.nsIWebProgressListener.STATE_IS_WINDOW) {
        deferSync(browser);
      }
    },
  });

  window.addEventListener("unload", () => {
    Services.prefs.removeObserver(OVERLAY_PREF, configureNativeNewTab);
    Services.prefs.removeObserver(BLANK_TRANSPARENT_PREF, syncSelected);
  });
})();
