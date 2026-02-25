# Notes Index

Project trail — read this first on context recovery.

QR Designer: Vite + React + TypeScript tool using qr-code-styling library. IBM Plex Mono, #e2e1dc palette, all-caps UI. Sidebar with collapsible accordion sections (custom grid-animated, not <details>). Preview panel with centered QR in rounded white card. Logo cropper with drag-to-pan and zoom slider. Library saves to localStorage.

- 0001 decision: Used qr-code-styling lib — handles all QR rendering, dot/eye styles, logo overlay, error correction, PNG/SVG export
- 0002 constraint: qr-code-styling always centers logos — no custom logo positioning within the QR matrix
- 0003 decision: Custom accordion component using CSS grid 0fr→1fr instead of native <details> — enables smooth height animation
- 0004 learning: QR updates debounced at 80ms to prevent canvas flicker when dragging slider thumbs
- 0005 decision: Logo cropper pre-composites to hidden canvas with rounded-rect clip, feeds processed data URL to qr-code-styling
- 0006 decision: Library stored in localStorage as JSON — configs + base64 logo data URLs + thumbnails. ~5-10MB limit, fine for personal use
- 0007 decision: Auto-naming system QR-001, QR-002... with click-to-edit inline rename
- 0008 ⚑ learning: Preview QR always renders transparent bg — container CSS handles visual background. Changing bgEnabled/bgColor must NOT trigger canvas update or it flickers.
