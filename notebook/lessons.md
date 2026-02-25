# Lessons

What not to do. Read this every session.

- qr-code-styling .update() redraws the full canvas — debounce slider-driven updates or you get flicker.
- Don't use <details> for animated accordions — no smooth height transition. Use CSS grid 0fr→1fr with a custom component.
- Logo images stored as base64 in localStorage eat space fast (~50-200KB each). Will hit localStorage limit around 25-50 saved QRs with logos.
- ~~Subtle checkerboard transparency grids look like visual noise when contrast is too low — just use a flat color.~~ → Resolved in 0008 (checkerboard with white overlay works well)
- Preview QR must always render with transparent background. BG toggle is CSS-only (::before overlay). Including bgEnabled/bgColor in the update effect causes canvas redraw flicker that no CSS transition can fix.
- SVG export: use `backgroundOptions: {}` (empty) instead of `{ color: "transparent" }` — the library may still create a rect element with the transparent string. Post-process SVG to fix any white fills.
