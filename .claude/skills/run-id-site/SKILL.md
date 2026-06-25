---
name: run-id-site
description: Run, screenshot, and audit the ID & Passport Photo Maker web app for senior / elderly usability. Use when asked to run, start, preview, or screenshot the app, or to check that older / less tech-confident users ("oldies") can use it — text size, tap targets, colour contrast, keyboard focus, pinch-zoom.
---

# Run & senior-friendly UX audit — ID & Passport Photo Maker

This is a client-side React + Vite web app (no backend). It is driven headlessly
with **Playwright** (installed globally in this container) via the driver at
`.claude/skills/run-id-site/driver.mjs`. The driver starts a preview server,
loads the app in Chromium at a desktop and a "senior phone" size, takes
full-page screenshots, and scores the page against **elderly-usability
heuristics**: base text size, tap-target size (≥44px), text contrast (≥4.5:1),
a visible keyboard-focus ring, and whether pinch-zoom is allowed.

All paths below are relative to the project root (`<unit>/`). The driver lives at
`.claude/skills/run-id-site/driver.mjs`.

## Prerequisites

No `apt-get` needed — Playwright + Chromium are already present
(`/opt/pw-browsers`, `npm ls -g playwright` → `playwright@1.56.1`). Just install
project deps:

```bash
npm install
```

## Build

The driver previews the **production build**, so build first:

```bash
npm run build
```

## Run (agent path) — audit + screenshots

One command. It auto-starts `vite preview` on port 4173, drives the app, writes
`desktop.png`, `senior-phone.png`, and `report.md` to the `--out` dir, prints a
PASS/WARN/FAIL summary, and exits non-zero if any senior-usability check fails:

```bash
node .claude/skills/run-id-site/driver.mjs --out ux-audit
```

Then look at the screenshots and the report:

```bash
ls ux-audit
cat ux-audit/report.md
```

`ux-audit/` is git-ignored. To drive against an already-running server instead
of the auto-started preview, pass `--url` (e.g. a dev server on
`http://localhost:5173`); otherwise omit it and the driver manages the server.

### What the checks mean (and current results)

Running it on the current build reports, at **both** desktop and senior-phone:

- **PASS** — visible keyboard-focus ring; pinch-zoom allowed; base text 16px.
- **FAIL** — the stepper chips (`1 Upload … 6 Export`) are **12px**, **38px**
  tall, and **3.27:1** contrast; several muted hints/footnotes are **12–13px**
  at **~3.0–3.3:1**. These are the concrete things to enlarge / darken to make
  the app comfortable for older users. The report lists each offending element
  with its size and contrast ratio.

A non-zero exit means "there are senior-usability issues to fix," not "the app is
broken" — the app runs fine; the audit is intentionally strict.

## Run (human path)

`npm run dev` (or `npm run preview` after a build) serves the app at a localhost
URL for a real browser. Useless headless — for this container use the driver
above.

## Test

```bash
npm test
```

(Vitest unit tests for the image maths — `mm↔px`, preset pixels, tile capacity.)

## Gotchas

- **ESM can't `import 'playwright'` here.** Playwright is global, and ESM bare
  imports ignore `NODE_PATH`, so a plain `import { chromium } from 'playwright'`
  throws `ERR_MODULE_NOT_FOUND`. The driver resolves it from `npm root -g` and
  reads `chromium` off **either** the namespace **or** `.default` (Playwright is
  CommonJS, so under ESM interop the exports land on `default`). Reuse that
  pattern in any new Playwright script — don't `npm install playwright` into the
  project just to get the import to resolve.
- **Build before driving.** The driver runs `vite preview`, which serves
  `dist/`. If you skip `npm run build` it serves a stale or missing bundle; the
  driver prints "Preview server did not come up."
- **`--strictPort` on 4173.** If something already holds 4173 the preview fails
  fast instead of silently moving ports (which would leave the driver pointed at
  the wrong URL). Kill the stray server or pass `--url`.
- **The audit is stricter than WCAG on purpose.** It flags body/control text
  under 16px and targets under 44px because the goal is *older* users, not the
  bare accessibility floor. Treat FAILs as a senior-friendliness backlog.
- **Contrast walks ancestors for the real background.** Elements with a
  transparent `background-color` (most text) are scored against the first opaque
  ancestor, so the ratios reflect what's actually on screen, not `rgba(0,0,0,0)`.

## Troubleshooting

- `ERR_MODULE_NOT_FOUND: playwright` → you copied the import out of the driver;
  use the `npm root -g` + `.default` resolution the driver already does.
- `Cannot read properties of undefined (reading 'launch')` → you got the
  namespace but not `.default`; use `pw.chromium ?? pw.default?.chromium`.
- `Preview server did not come up` → run `npm run build` first, or free port
  4173 / pass `--url http://localhost:5173` after starting your own server.
