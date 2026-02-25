# Lessons

What not to do. Read this every session.

- qr-code-styling .update() redraws the full canvas — debounce slider-driven updates or you get flicker.
- Don't use <details> for animated accordions — no smooth height transition. Use CSS grid 0fr→1fr with a custom component.
- Logo images stored as base64 in localStorage eat space fast (~50-200KB each). Will hit localStorage limit around 25-50 saved QRs with logos.
- Subtle checkerboard transparency grids look like visual noise when contrast is too low — just use a flat color.
