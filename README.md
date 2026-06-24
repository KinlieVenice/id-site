# ID &amp; Passport Photo Maker

A client-side web app that takes a photo from upload to a print-ready, correctly
sized ID/passport photo — and a tiled print sheet — without anything leaving the
device. Free and ad-supportable by design: **no backend, no database, no API
keys** (Decision D1).

## Phase 1 (this build) — the shippable core

- **Upload** (FR1) — JPG/PNG via file picker or drag-and-drop.
- **Size presets** (FR2) — grouped by country/use; output pixels derived from
  mm + DPI. Presets are plain data in `src/data/presets.js` (Decision D8 — verify
  against official sources before launch).
- **Crop** (FR3) — aspect-locked to the preset, rendered to exact output pixels.
- **Background removal** (FR4) — in-browser model via `@imgly/background-removal`
  (Decision D3); lazy-loaded only when toggled on.
- **Background colour** (FR5) and **cutting border** (FR6).
- **Download single** (FR7) — PNG or JPG at the preset's exact pixels.
- **Tile / print sheet** (FR8–FR11) — pick paper size and copies; the app packs
  a grid sized to the paper at the export DPI and shows capacity (Decision D7).
- **Privacy / mobile / a11y floor** (FR18–FR20).

Phases 2–4 (name strip + signature, mask brush, attire overlay) are scoped in
the plan and not yet built; the architecture leaves room for them.

## Design

Corner registration ticks as the recurring motif, a monospace face for all
measurements, and an ink/paper palette with a single signal-orange for active
state and cut lines (design note in the plan).

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the image maths
npm run build    # static build to /dist
```

## Deploy

Static build — deploy `dist/` to any static host (Cloudflare Pages, Netlify,
Vercel). No server, no secrets, no database. The background-removal model assets
are bundled and lazy-loaded; to self-host them reliably, see the library's
`publicPath` option (noted as a launch hardening step in the plan).

## Structure

```
src/
  App.jsx              flow state + active step
  components/          UploadStep, SizeStep, CropStep, BackgroundStep,
                       ExportStep, Stepper, CropMarks, Guide
  lib/image.js         pure canvas maths: mm↔px, crop, cutout, composite,
                       border, tile, export  (unit-tested)
  data/presets.js      size presets (verify per D8)
  data/paper.js        paper sizes for the print sheet
```
