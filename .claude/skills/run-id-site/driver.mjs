// Driver for the ID & Passport Photo Maker web app.
//
// One command: builds nothing (you build first), spins up `vite preview`,
// drives the running app headlessly with Playwright, screenshots it at a
// desktop size and a "senior phone" size, and runs a SENIOR-FRIENDLY UX AUDIT
// — the heuristics that decide whether an older, less tech-confident user can
// actually use the page: real text size, tap-target size, colour contrast,
// a visible keyboard-focus ring, and whether pinch-zoom is allowed.
//
// Usage:
//   NODE_PATH=$(npm root -g) node .claude/skills/run-id-site/driver.mjs
//   NODE_PATH=$(npm root -g) node .claude/skills/run-id-site/driver.mjs --url http://localhost:5173
//   NODE_PATH=$(npm root -g) node .claude/skills/run-id-site/driver.mjs --out ux-audit
//
// Output: PNG screenshots + report.md in the --out dir (default ./ux-audit),
// and a PASS/WARN/FAIL summary printed to stdout (non-zero exit if any FAIL).

import { spawn, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Playwright is installed globally in this container, not in the project.
// ESM bare imports ignore NODE_PATH, so resolve it from `npm root -g`.
let pw;
try {
  pw = await import('playwright');
} catch {
  const groot = execSync('npm root -g').toString().trim();
  pw = await import(pathToFileURL(join(groot, 'playwright', 'index.js')).href);
}
const chromium = pw.chromium ?? pw.default?.chromium;
if (!chromium) {
  console.error('Could not load Playwright chromium. Is `playwright` installed globally (npm ls -g playwright)?');
  process.exit(2);
}

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const outDir = resolve(getArg('--out', 'ux-audit'));
let url = getArg('--url', null);
const PORT = 4173;

// Senior-friendly thresholds (deliberately stricter than the WCAG floor).
const MIN_BODY_FONT = 16; // px; recommend >=18 for older eyes
const MIN_TAP = 44; // px; Apple HIG / WCAG 2.5.5 target size
const MIN_CONTRAST = 4.5; // WCAG AA normal text

mkdirSync(outDir, { recursive: true });

// --- optionally start the preview server ------------------------------------
let server = null;
async function waitFor(u, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(u);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

if (!url) {
  url = `http://localhost:${PORT}/`;
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    env: process.env,
  });
  const ok = await waitFor(url);
  if (!ok) {
    server.kill();
    console.error('Preview server did not come up. Did you run `npm run build`?');
    process.exit(2);
  }
}

// --- the in-page audit (runs in the browser) --------------------------------
// Returned to Node as plain JSON; no DOM objects cross the boundary.
const AUDIT_FN = (cfg) => {
  const lum = (rgb) => {
    const f = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const parse = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { rgb: [p[0], p[1], p[2]], a: p[3] === undefined ? 1 : p[3] };
  };
  const effectiveBg = (el) => {
    let n = el;
    while (n) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) return c.rgb;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const contrast = (fg, bg) => {
    const a = lum(fg) + 0.05;
    const b = lum(bg) + 0.05;
    return (Math.max(a, b) / Math.min(a, b));
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };

  const bodyFont = parseFloat(getComputedStyle(document.body).fontSize);

  // Interactive elements: tap-target size + label font size.
  const interactive = [...document.querySelectorAll('button, a, input, select, textarea, [role=button]')]
    .filter(visible);
  const smallTargets = [];
  const smallText = [];
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const label = (el.textContent || el.getAttribute('aria-label') || el.value || el.type || el.tagName).trim().slice(0, 40);
    if (Math.min(r.width, r.height) < cfg.MIN_TAP)
      smallTargets.push({ label, w: Math.round(r.width), h: Math.round(r.height) });
    if (fs && fs < cfg.MIN_BODY_FONT && el.tagName !== 'INPUT' && el.tagName !== 'SELECT')
      smallText.push({ label, fs: Math.round(fs) });
  }

  // Body-text contrast: sample paragraphs and hints.
  const lowContrast = [];
  for (const el of [...document.querySelectorAll('p, li, span, label, h1, h2, h3, button')].filter(visible)) {
    const txt = (el.textContent || '').trim();
    if (txt.length < 4) continue;
    const fg = parse(getComputedStyle(el).color);
    if (!fg) continue;
    const ratio = contrast(fg.rgb, effectiveBg(el));
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const big = fs >= 24 || (fs >= 18.66 && getComputedStyle(el).fontWeight >= 700);
    const need = big ? 3 : cfg.MIN_CONTRAST;
    if (ratio < need)
      lowContrast.push({ text: txt.slice(0, 40), ratio: Math.round(ratio * 100) / 100, fs: Math.round(fs) });
  }

  // Zoom: is the user allowed to pinch-zoom?
  const vp = document.querySelector('meta[name=viewport]')?.content || '';
  const zoomBlocked = /user-scalable\s*=\s*(no|0)/i.test(vp) || /maximum-scale\s*=\s*1(\.0)?\b/i.test(vp);

  return {
    bodyFont,
    counts: { interactive: interactive.length },
    smallTargets: smallTargets.slice(0, 30),
    smallText: smallText.slice(0, 30),
    lowContrast: lowContrast.slice(0, 30),
    zoomBlocked,
    viewport: vp,
  };
};

// --- focus-ring check (needs real keyboard focus) ---------------------------
async function focusRingVisible(page) {
  const btn = page.locator('button, a, input').first();
  if ((await btn.count()) === 0) return true;
  await btn.focus();
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    const s = getComputedStyle(el);
    const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
    const ring = s.boxShadow && s.boxShadow !== 'none';
    return outline || ring;
  });
}

// --- run --------------------------------------------------------------------
const browser = await chromium.launch();
const results = {};
const screenshots = [];

const profiles = [
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
  { name: 'senior-phone', viewport: { width: 390, height: 844 }, mobile: true },
];

let exitCode = 0;
try {
  for (const p of profiles) {
    const ctx = await browser.newContext({
      viewport: p.viewport,
      deviceScaleFactor: 2,
      isMobile: !!p.mobile,
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const shot = resolve(outDir, `${p.name}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    screenshots.push(shot);

    const audit = await page.evaluate(AUDIT_FN, { MIN_BODY_FONT, MIN_TAP, MIN_CONTRAST });
    audit.focusRing = await focusRingVisible(page);
    results[p.name] = audit;
    await ctx.close();
  }
} finally {
  await browser.close();
  if (server) server.kill();
}

// --- score + report ---------------------------------------------------------
const lines = [];
const log = (s = '') => {
  lines.push(s);
  console.log(s);
};
const verdict = (cond) => (cond ? 'PASS' : 'FAIL');

log(`# Senior-friendly UX audit — ID & Passport Photo Maker`);
log(`URL: ${url}`);
log('');

for (const [name, a] of Object.entries(results)) {
  log(`## ${name} (${name === 'desktop' ? '1280×900' : '390×844'})`);
  log(`- Screenshot: ${name}.png`);

  const bodyOk = a.bodyFont >= MIN_BODY_FONT;
  log(`- [${verdict(bodyOk)}] Base text size: ${a.bodyFont}px (need ≥ ${MIN_BODY_FONT}px; ≥18 ideal for older eyes)`);
  if (!bodyOk) exitCode = 1;

  const tapOk = a.smallTargets.length === 0;
  log(`- [${verdict(tapOk)}] Tap targets ≥ ${MIN_TAP}px: ${tapOk ? 'all OK' : `${a.smallTargets.length} too small`}`);
  for (const t of a.smallTargets) log(`    · "${t.label}" — ${t.w}×${t.h}px`);
  if (!tapOk) exitCode = 1;

  const textOk = a.smallText.length === 0;
  log(`- [${verdict(textOk)}] Control label size ≥ ${MIN_BODY_FONT}px: ${textOk ? 'all OK' : `${a.smallText.length} small`}`);
  for (const t of a.smallText) log(`    · "${t.label}" — ${t.fs}px`);
  if (!textOk) exitCode = 1;

  const contrastOk = a.lowContrast.length === 0;
  log(`- [${verdict(contrastOk)}] Text contrast ≥ ${MIN_CONTRAST}:1: ${contrastOk ? 'all OK' : `${a.lowContrast.length} low`}`);
  for (const c of a.lowContrast) log(`    · "${c.text}" — ${c.ratio}:1 @ ${c.fs}px`);
  if (!contrastOk) exitCode = 1;

  log(`- [${verdict(a.focusRing)}] Visible keyboard-focus ring on first control`);
  if (!a.focusRing) exitCode = 1;

  log(`- [${verdict(!a.zoomBlocked)}] Pinch-zoom allowed (viewport: "${a.viewport || '—'}")`);
  if (a.zoomBlocked) exitCode = 1;
  log('');
}

log(exitCode === 0 ? '✅ All senior-usability checks passed.' : '⚠️  Some checks FAILED — see above.');

writeFileSync(resolve(outDir, 'report.md'), lines.join('\n'));
console.log(`\nReport + screenshots written to: ${outDir}`);
process.exit(exitCode);
