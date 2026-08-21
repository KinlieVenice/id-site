# ID &amp; Passport Photo Maker

A client-side web app that takes a photo from upload to a print-ready, correctly
sized ID/passport photo — and a tiled print sheet — without anything leaving the
device. Free and ad-supportable by design: **no backend, no database, no API
keys** (Decision D1).

## Features

**Upload → Size → Crop → Background → Extras → Export**

- **Upload** (FR1) — JPG/PNG via file picker or drag-and-drop.
- **Size** (FR2) — a single "Passport" card with a searchable country combobox
  (defaults to Philippines) covering dozens of official specs, plus 1×1in/2×2in
  generic ID cards and a custom size field. Presets are plain data in
  `src/data/presets.js` (Decision D8 — verify against official sources before
  launch).
- **Crop** (FR3) — aspect-locked to the preset, rendered to exact output pixels.
- **Background removal** (FR4) — in-browser model via `@imgly/background-removal`
  (Decision D3), lazy-loaded only when toggled on — plus a manual erase/restore
  brush (FR15) for hair/glasses misses, and brightness/contrast/smoothen touch-up.
- **Background colour** (FR5). The **cutting border** (FR6) is applied at the
  Export step so it sits on top of any name strip / attire, not behind them.
- **Extras** (optional) — corporate attire overlay (stock PNGs in
  `public/attire/`, grouped Men/Women, plus your own upload), a typed name
  strip, and a signature (drawn on a smoothed pad or uploaded as an image),
  all placed with move/scale/rotate handles (`react-konva`). The photo itself
  can be re-cropped or edge-refined again from here without losing any of that
  placement work — an "also affect the suit/name/signature" toggle controls
  whether that re-crop/refine flattens the overlays in or leaves them alone.
- **Download single** (FR7) — PNG or JPG at the preset's exact pixels.
- **Print sheet** (FR8–FR11) — pick paper size and copies; a shelf packer
  tiles the sheet, stacking smaller tiles into the leftover height next to
  taller ones. Combo printing (mixing 1×1in and 2×2in copies on one sheet) is
  available only between those two generic ID sizes — passport and custom
  sizes are single-size only.
- **Privacy / mobile / a11y floor** (FR18–FR20).

## Design

Follows `design.md` — the "Studio Precision" system: cool blue-white surfaces,
a navy Action Blue accent, Inter + JetBrains Mono, a tight 4/8px radius scale,
and tonal-layer elevation (1px borders, not shadows, except for popovers).
Corner registration ticks remain the recurring motif on every panel.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the image maths
npm run build    # static build to /dist
```

## Deploy

Static build — no server, no secrets, no database. `.github/workflows/deploy.yml`
builds and publishes `dist/` to GitHub Pages on every push to `main` (via
GitHub Actions' official Pages deploy action). Enable it once under
**Settings → Pages → Source: GitHub Actions**. Any other static host
(Cloudflare Pages, Netlify, Vercel) works too — just point it at `dist/`.

## Structure

```
src/
  App.jsx              flow state + active step (Editor lazy-loaded)
  components/          UploadStep, SizeStep, CropStep, BackgroundStep,
                       MaskBrush, Editor, AttirePicker, SignaturePad,
                       ExportStep, Stepper, Combobox, Icon, CropMarks, Guide
  lib/image.js         pure canvas maths: mm↔px, crop, cutout, composite,
                       border, tile packing, trim, export  (unit-tested)
  lib/useImage.js      tiny image loader for react-konva sources
  data/presets.js      size presets (verify per D8)
  data/paper.js        paper sizes for the print sheet
  data/attire.js       attire manifest — files live in public/attire/
public/
  attire/              stock attire PNGs (Men1–9, Women1–9)
```

Flow: Upload → Size → Crop → Background (+ mask brush + touch-up) → Extras
(attire / name strip / signature, with photo re-crop/refine) → Export (cutting
border + single photo + print sheet). Extras is optional — Export works
straight from the Background output — and all progress is preserved if you
navigate back to any earlier step.

A senior-usability check (text size, tap targets, contrast, focus, zoom) lives in
the `/run-id-site` skill — see `.claude/skills/run-id-site/`.
