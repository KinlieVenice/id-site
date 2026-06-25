# ID &amp; Passport Photo Maker

A client-side web app that takes a photo from upload to a print-ready, correctly
sized ID/passport photo — and a tiled print sheet — without anything leaving the
device. Free and ad-supportable by design: **no backend, no database, no API
keys** (Decision D1).

## Features (all four phases)

**Phase 1 — core maker + print sheet**
- **Upload** (FR1) — JPG/PNG via file picker or drag-and-drop.
- **Size presets** (FR2) — grouped by country/use; output pixels derived from
  mm + DPI. Presets are plain data in `src/data/presets.js` (Decision D8 — verify
  against official sources before launch).
- **Crop** (FR3) — aspect-locked to the preset, rendered to exact output pixels.
- **Background removal** (FR4) — in-browser model via `@imgly/background-removal`
  (Decision D3); lazy-loaded only when toggled on.
- **Background colour** (FR5). The **cutting border** (FR6) is applied at the
  Export step so it sits on top of any name strip / attire, not behind them.
- **Download single** (FR7) — PNG or JPG at the preset's exact pixels.
- **Tile / print sheet** (FR8–FR11) — pick paper size and copies; the app packs
  a grid sized to the paper at the export DPI and shows capacity (Decision D7).
- **Privacy / mobile / a11y floor** (FR18–FR20).

**Phase 2 — name strip + signature** (in the Extras step)
- **Name strip** (FR12) — optional white strip below the photo.
- **Typed name** (FR13) — font, alignment, strip height.
- **Signature** (FR14) — drawn on a smoothed pad (`signature_pad`, Decision D5),
  placed with move/scale/rotate handles (`react-konva` Transformer, Decision D6).

**Phase 3 — manual mask brush** (in the Background step)
- **Erase / restore brush** (FR15) — fix background-removal misses on hair,
  glasses and edges at full resolution (Decision D3).

**Phase 4 — attire overlay** (in the Extras step)
- **Attire library** (FR16) — curated, transparent overlays grouped by type.
  Ships with swappable SVG placeholders; drop real PNGs in `public/attire` and
  point `src/data/attire.js` at them.
- **Place attire** (FR17) — affine move/scale/rotate only; perspective warp is
  explicitly out of scope and attire is labelled a fun add-on (Decision D4).

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
  App.jsx              flow state + active step (Editor lazy-loaded)
  components/          UploadStep, SizeStep, CropStep, BackgroundStep,
                       MaskBrush, Editor, AttirePicker, SignaturePad,
                       ExportStep, Stepper, CropMarks, Guide
  lib/image.js         pure canvas maths: mm↔px, crop, cutout, composite,
                       border, tile, trim, export  (unit-tested)
  lib/useImage.js      tiny image loader for react-konva sources
  data/presets.js      size presets (verify per D8)
  data/paper.js        paper sizes for the print sheet
  data/attire.js       attire manifest (swap placeholders for real PNGs)
```

Flow: Upload → Size → Crop → Background (+ mask brush) → Extras (attire / name
strip / signature) → Export (cutting border + single + print sheet). The Extras
step is optional — Export works straight from the Background output, and Extras
work is preserved if you navigate back to it.

A senior-usability check (text size, tap targets, contrast, focus, zoom) lives in
the `/run-id-site` skill — see `.claude/skills/run-id-site/`.
