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
  it('derives exact output pixels for the US 2x2 preset', () => {
    const us = PRESETS.find((p) => p.id === 'us-2x2');
    expect(presetPixels(us)).toEqual({ w: 602, h: 602 });
  });

  it('derives portrait pixels for Schengen 35x45', () => {
    const s = PRESETS.find((p) => p.id === 'schengen-35x45');
    expect(presetPixels(s)).toEqual({ w: 413, h: 531 });
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
