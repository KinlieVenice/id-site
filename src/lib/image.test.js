import { describe, it, expect } from 'vitest';
import { mmToPx, sheetCapacity } from './image.js';
import { presetPixels, PRESETS } from '../data/presets.js';

describe('mmToPx', () => {
  it('converts mm to px at a given dpi', () => {
    expect(mmToPx(25.4, 300)).toBe(300); // 1 inch at 300 dpi
    expect(mmToPx(51, 300)).toBe(602); // US 2x2
  });
});

describe('presetPixels', () => {
  it('derives exactly 600×600 px for the US 2×2 in passport preset', () => {
    const us = PRESETS.find((p) => p.id === 'us-passport');
    expect(presetPixels(us)).toEqual({ w: 600, h: 600 });
  });

  it('derives portrait pixels for the ICAO 35×45 mm standard', () => {
    const s = PRESETS.find((p) => p.id === 'eu-schengen');
    expect(presetPixels(s)).toEqual({ w: 413, h: 531 });
  });

  it('derives 300×300 px for the generic 1×1 in size', () => {
    const one = PRESETS.find((p) => p.id === 'id-1x1');
    expect(presetPixels(one)).toEqual({ w: 300, h: 300 });
  });
});

describe('sheetCapacity', () => {
  it('fits multiple 2x2 photos on 4R paper', () => {
    // 2x2 in (602px) on 4R (102x152mm) at 300dpi, 3mm gap, 5mm margin.
    const photo = { width: 602, height: 602 };
    const paper = { wmm: 102, hmm: 152 };
    const { capacity, cols, rows } = sheetCapacity(photo, paper, 300);
    expect(cols).toBe(1);
    expect(rows).toBe(2);
    expect(capacity).toBe(2);
  });

  it('returns zero capacity when the photo is larger than the sheet', () => {
    const photo = { width: 5000, height: 5000 };
    const paper = { wmm: 102, hmm: 152 };
    expect(sheetCapacity(photo, paper, 300).capacity).toBe(0);
  });
});
