# QR Designer

A local-first QR code designer with live preview, logo embedding, and a personal library. No accounts, no cloud — everything runs in your browser and saves to localStorage.

<div align="center">
  <img src="screenshot.png" alt="QR Designer" width="800" />
</div>

## Features

- **Dot styles** — square, dots, rounded, classy, classy-rounded, extra-rounded
- **Eye customization** — independent frame and dot styles
- **Color control** — separate dot and eye colors, optional background with color picker
- **Center logo** — upload any image, crop with drag-to-pan and zoom, adjustable corner radius, size, and margin
- **Error correction** — L / M / Q / H levels (default H for logo tolerance)
- **Library** — save, name, load, and update QR codes locally. Thumbnails, click-to-edit names, auto-incrementing IDs
- **Export** — PNG or SVG at 1024px. Logo margin scales proportionally so exports match the preview

## Quick Start

```bash
git clone https://github.com/wwwcolorcolor/qr-designer.git
cd qr-designer
npm install
npm run dev
```

Opens at `http://localhost:5199`.

## Usage

Design your QR in the left sidebar, see it live on the right. Click the name (QR-001) to rename. Hit **Save** to store it in your library — subsequent saves update in place. Click **New** to start fresh.

Library entries persist across sessions via localStorage. Click any saved QR to load it back with all settings intact, including logo crop position.

### Logo Workflow

1. Upload an image (click or drag-and-drop)
2. Drag to reposition within the crop area
3. Adjust zoom, corner radius, size, and margin
4. The cropped result feeds directly into the QR code

### Keyboard

| Key | Action |
|-----|--------|
| Enter | Confirm name edit |
| Esc | Cancel name edit |

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 7 |
| QR Engine | [qr-code-styling](https://github.com/nicholasgasior/qr-code-styling) |
| Font | [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) |
| Storage | localStorage (JSON + base64 thumbnails/logos) |

## Storage

Everything lives in localStorage under the key `qr-designer-library`. Each saved QR stores its full config, logo source, cropped logo, crop state (zoom/offset), and a 160px thumbnail.

Practical limit is roughly 25-50 saved QRs with logos before hitting the ~5-10MB localStorage cap. For personal use this is fine. If you need more, the upgrade path is IndexedDB.

## License

MIT
