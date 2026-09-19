
# Daralla Theme Configuration

## Preferences Implementation

This theme implements customizable preferences using Zen Browser's preference system. Preferences are defined in `preferences.json` and can be accessed through Zen Browser's preferences interface.

## Available Preferences

### Boolean Preferences

1. `zen.view.use-single-toolbar` - Use single toolbar layout
2. `daralla.animations.enabled` - Enable animations in Daralla theme
3. `daralla.borders.squared` - Use squared borders
4. `daralla.urlbar.position.top` - Position URL bar at the top (for multiple and collapsed toolbar only)
5. `daralla.macos.controls` - Disable macOS style window controls
6. `zen.view.experimental-force-window-controls-left` - Force window controls to the left (for macOS style controls only)
7. `daralla.blank.theme` - Change color scheme for about:blank
8. `daralla.blank.content` - Remove logo from about:blank
9. `daralla.controls.reverse` - Reverse window controls
10. `daralla.toolbar.hide` - Auto hide toolbar buttons (Reveal on hover)
11. `daralla.navigation.hide` - Disable navigation buttons
12. `daralla.statusbar.disable` - Disable status bar
13. `daralla.compact.siderbar.transparent` - Make sidebar transparent in compact mode
14. `zen.theme.essentials-favicon-bg` - Disable favicon background for essentials
15. `daralla.audio.indicator.disable` - Disable audio indicator on tab

### Dropdown Preferences

1. `daralla.webview.border-radius` - Border radius for webview (e.g., 0px, 4px, 8px, 12px)
2. `daralla.macos.controls.radius` - Change macOS window control radius (square, squircle, circle)
3. `daralla.webview.border_radius` - Border radius for webview (0px, 4px, 8px, 12px, 16px, 20px)
4. `daralla.window.border_radius` - Border radius for window (0px, 4px, 8px, 12px, 16px, 20px, 24px)
5. `daralla.tab.border_radius` - Border radius for tabs (0px, 4px, 8px, 12px, 16px, 20px, 24px)
6. `daralla.essentials.border_radius` - Border radius for essentials (0px, 4px, 8px, 12px, 16px, 20px, 24px, circle)
7. `daralla.font` - Font selection (SF-Pro, Bricolage, GeistMono, JetBrainsMono, SUSE, SUSEMono)

### String Preferences

1. `wf-border-color` - Change color for window border (currently not working)

## How Preferences Work

  /* Styles when preference is enabled */
  
```

### Implementation Example
For the URL bar position preference, we've implemented a single boolean preference:

- When `daralla.urlbar.position.top` is enabled, the URL bar appears at the top
- When `daralla.urlbar.position.top` is disabled (default), the URL bar appears at the bottom

```css
/* URL bar position preference - TOP */
@media (-moz-bool-pref: "daralla.urlbar.position.top") {
  #zen-appcontent-wrapper {
    flex-direction: column;
  }
}

/* URL bar position preference - BOTTOM (default) */
@media not (-moz-bool-pref: "daralla.urlbar.position.top") {
  #zen-appcontent-wrapper {
    flex-direction: column-reverse;
  }
}
```

## Adding New Preferences

To add new preferences to the theme:

1. Add the preference definition to `preferences.json`
2. Implement the CSS rules in the appropriate module file
3. Update the README.md file to document the new preference
4. Test the preference to ensure it works correctly

## Preference Best Practices

1. Use descriptive names that clearly indicate what the preference does
2. Provide clear descriptions for each preference
3. Set sensible default values
4. Group related preferences logically
5. Test preferences thoroughly to ensure they work as expected

## New Features in Daralla

### Border Radius Controls
Daralla introduces comprehensive border radius controls for different UI elements:
- Webview border radius: Control the corner radius of the web content area
- Window border radius: Adjust the corner radius of the browser window
- Tab border radius: Customize the corner radius of browser tabs
- Essentials border radius: Modify the corner radius of essential UI elements like bookmarks and extensions

### Typography Options
The theme now supports multiple font options with the `daralla.font` preference:
- SF-Pro: Apple's system font
- Bricolage: Bricolage Grotesque font
- GeistMono: Clean monospace font
- JetBrainsMono: Developer-focused monospace font
- SUSE: Clean sans-serif font
- SUSEMono: Monospace variant of SUSE

### Favicon Background Control
You can now disable the background for favicons in the essentials toolbar using the `zen.theme.essentials-favicon-bg` preference.

### Window Control Radius
Enhanced customization options for macOS style window controls with the `daralla.macos.controls.radius` preference.

### Fullscreen and Maximized Mode Fixes
Fixed border radius issues when the browser is in fullscreen and maximized modes, ensuring consistent styling across all window states.