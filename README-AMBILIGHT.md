# Daralla — YouTube Ambilight

This patch adds a real frame-based ambient projector to Daralla.

It does not sample one average color and paint the sidebar. The active YouTube frame is rendered into a small canvas, exposed as an image to the Zen chrome UI, then projected through enlarged blur/saturation layers. The selected tab receives a localized copy of the same frame.

The projector follows the side of the Zen vertical tab bar automatically: right-side tabs use the right side of the video; left-side tabs mirror the projection.

Default update rate is 15 FPS to keep GPU/CPU use reasonable. The source frame is only 96×54 pixels, so the expensive part is handled by the browser compositor rather than repeatedly pushing a full-resolution video frame into the UI.

The original YouTube Ambient Light extension also uses a low-resolution rendering path and recommends limiting its ambient-light rendering to about 30 FPS for performance. Its effect exposes blur, spread, filters, frame synchronization and directional edges; this patch reproduces the visual idea in the Zen chrome rather than modifying the YouTube page itself.
