import { useEffect, useState } from 'react';

const STORAGE_KEY = 'id-photo-maker:theme';

export const DEFAULT_HUE = 213; // hue of #2D78D2, the requested default blue
export const DEFAULT_MODE = 'light';

// ---- colour maths -----------------------------------------------------------

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Hue only — saturation/lightness of whatever colour the user picked are
// discarded, since the palette generator derives those itself for every
// token so contrast stays safe (see findLightness below).
export function hexToHue(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function hsl(h, s, l) {
  return rgbToHex(hslToRgb(h, s, l));
}

function lin(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLum([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(rgb1, rgb2) {
  const l1 = relLum(rgb1), l2 = relLum(rgb2);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

// Search for the lightness (at a fixed hue/saturation) that clears a target
// contrast ratio against `textRgb`, stepping from `start` toward `toward`
// ('darker' or 'lighter'). This is what keeps every derived colour readable
// at ANY hue the user picks — a fixed lightness reads far brighter at, say,
// yellow than at blue, so a constant can't be trusted across the wheel.
function findLightness(h, s, textRgb, target, start, toward, min, max, step = 1) {
  let l = start;
  for (let i = 0; i < 400; i++) {
    if (contrast(textRgb, hslToRgb(h, s, l)) >= target) return l;
    l += toward === 'darker' ? -step : step;
    if (l < min || l > max) break;
  }
  return toward === 'darker' ? min : max;
}

// ---- palette ------------------------------------------------------------

// Every CSS custom property the stylesheet reads, derived from one hue plus
// light/dark — the two axes are independent, so any colour can be combined
// with either mode. See styles.css's :root block for what each token is used
// for; values here are chosen to reproduce that same block at hue=336/light.
export function buildPalette(hue, mode) {
  const dark = mode === 'dark';
  const WHITE = [255, 255, 255];
  const DARK_TEXT = [28, 16, 36];
  const accentText = dark ? DARK_TEXT : WHITE;

  const accentSat = 65;
  const accentL = dark
    ? findLightness(hue, accentSat, DARK_TEXT, 4.5, 45, 'lighter', 5, 95)
    : findLightness(hue, accentSat, WHITE, 4.5, 55, 'darker', 5, 95);
  const accentHoverL = dark ? Math.max(5, accentL + 5) : Math.min(95, accentL + 6);
  const pinkHoverL = dark ? accentHoverL : Math.max(8, accentL - 10);

  // -80° lands roughly where the original hand-picked secondary accent sat
  // relative to the primary pink (purple relative to pink); kept as a fixed
  // offset so it generalises to any hue instead of needing per-hue tuning.
  const accent2Hue = hue - 80;
  const accent2L = dark
    ? findLightness(accent2Hue, 60, DARK_TEXT, 4.5, 65, 'lighter', 5, 95)
    : findLightness(accent2Hue, 60, WHITE, 4.5, 55, 'darker', 5, 95);

  const paperRgb = dark ? hslToRgb(hue, 22, 10) : hslToRgb(hue, 45, 97);
  const ink2L = dark
    ? findLightness(hue, 18, paperRgb, 4.5, 78, 'darker', 55, 95)
    : findLightness(hue, 20, paperRgb, 4.5, 40, 'darker', 20, 55);

  // "Soft" tint backgrounds (badges, active-nav highlights) sit BEHIND text
  // colored with the matching accent — a fixed lightness/saturation pairs
  // badly with some hues (fails 4.5:1 by a hair at certain points on the
  // wheel), so search for it directly against that accent, at a low enough
  // saturation that it always CAN reach a passing lightness before running
  // out of room at the 90/100 (or 4/30) ends of the range.
  const accentRgb = hslToRgb(hue, accentSat, accentL);
  const accent2Rgb = hslToRgb(accent2Hue, 60, accent2L);
  const softSat = dark ? 30 : 12;
  const accentSoftL = dark
    ? findLightness(hue, softSat, accentRgb, 4.5, 20, 'darker', 4, 30, 0.5)
    : findLightness(hue, softSat, accentRgb, 4.5, 94, 'lighter', 90, 100, 0.5);
  const accent2SoftL = dark
    ? findLightness(accent2Hue, softSat, accent2Rgb, 4.5, 20, 'darker', 4, 30, 0.5)
    : findLightness(accent2Hue, softSat, accent2Rgb, 4.5, 94, 'lighter', 90, 100, 0.5);

  return {
    '--paper': rgbToHex(paperRgb),
    '--paper-2': dark ? hsl(hue, 20, 14) : hsl(hue, 40, 92),
    '--ink': dark ? hsl(hue, 25, 93) : hsl(hue, 35, 20),
    '--ink-2': dark ? hsl(hue, 18, ink2L) : hsl(hue, 20, ink2L),
    '--ink-3': dark ? hsl(hue, 16, Math.min(95, ink2L + 4)) : hsl(hue, 18, Math.max(5, ink2L + 2)),
    '--line': dark ? hsl(hue, 20, 26) : hsl(hue, 45, 88),
    '--line-2': dark ? hsl(hue, 20, 34) : hsl(hue, 45, 78),
    '--accent': hsl(hue, accentSat, accentL),
    '--accent-ink': rgbToHex(accentText),
    '--accent-hover': hsl(hue, accentSat, accentHoverL),
    '--accent-soft': hsl(hue, softSat, accentSoftL),
    '--accent-2': rgbToHex(accent2Rgb),
    '--accent-2-soft': hsl(accent2Hue, softSat, accent2SoftL),
    '--white': dark ? hsl(hue, 20, 15) : '#ffffff',
    '--pink': hsl(hue, accentSat, accentL),
    '--pink-soft': hsl(hue, softSat, accentSoftL),
    '--pink-hover': hsl(hue, accentSat, pinkHoverL),
    '--hairline': dark ? hsl(hue, 18, 24) : hsl(hue, 20, 91),
    '--hairline-2': dark ? hsl(hue, 16, 20) : hsl(hue, 18, 86),
    '--success': dark ? '#4ade80' : '#16a34a',
    '--success-strong': '#22c55e',
    '--danger': dark ? '#ff6b81' : '#dc2626',
    '--danger-strong': '#ef4444',
    '--error': dark ? '#ff6fa8' : '#c0175a',
    '--checkerboard': dark
      ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='%23241d2d'/%3E%3Crect width='10' height='10' fill='%232f2638'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%232f2638'/%3E%3C/svg%3E\")"
      : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='%23fff'/%3E%3Crect width='10' height='10' fill='%23ffe4f1'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ffe4f1'/%3E%3C/svg%3E\")",
  };
}

export function applyPalette(hue, mode) {
  const palette = buildPalette(hue, mode);
  const root = document.documentElement.style;
  for (const [prop, value] of Object.entries(palette)) root.setProperty(prop, value);
  document.documentElement.style.colorScheme = mode;
}

export function getStoredThemeState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && typeof raw.hue === 'number' && (raw.mode === 'light' || raw.mode === 'dark')) return raw;
  } catch {
    // ignore malformed/missing storage
  }
  return { hue: DEFAULT_HUE, mode: DEFAULT_MODE };
}

function storeThemeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing / storage disabled — theme just won't persist.
  }
}

export function useTheme() {
  const [state, setState] = useState(getStoredThemeState);

  useEffect(() => {
    applyPalette(state.hue, state.mode);
    storeThemeState(state);
  }, [state]);

  const setHue = (hue) => setState((s) => ({ ...s, hue }));
  const setMode = (mode) => setState((s) => ({ ...s, mode }));

  return { hue: state.hue, mode: state.mode, setHue, setMode };
}
