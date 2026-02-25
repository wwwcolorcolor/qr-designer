# 0008: Preview QR Must Always Render Transparent — Background Is CSS-Only

**Type:** learning | **Date:** 2026-02-26

qr-code-styling .update() redraws the full canvas on every call. If `backgroundOptions` changes when toggling BG on/off, the canvas clears and redraws, causing a visible flicker that no CSS transition can mask.

Fix: preview QR always renders with `backgroundOptions: { color: "transparent" }`. The container handles the visual background via CSS (solid color overlay on ::before pseudo-element, checkerboard on the container itself). The update effect only depends on QR-affecting config values (not bgEnabled/bgColor), so toggling BG never triggers a canvas redraw.

Export creates its own QRCodeStyling instance with the correct bg options — preview and export are independent.
