// Size presets (Decision D8).
//
// IMPORTANT: These are stored as plain DATA, not as authoritative facts. Before
// launch, every value here — dimensions, DPI, default background, and the
// requirement notes — MUST be verified against the CURRENT official source for
// that country/document. Wrong specs get users rejected at embassies. Treat the
// `notes` field as guidance to confirm, and keep the `source` field pointing at
// where to check.
//
// Output pixels are DERIVED, never stored: px = round(mm / 25.4 * dpi).

export const DEFAULT_DPI = 300;

export const PRESETS = [
  {
    id: 'us-2x2',
    group: 'United States',
    label: 'Passport / Visa 2×2 in',
    wmm: 51,
    hmm: 51,
    dpi: 300,
    defaultBg: '#ffffff',
    notes:
      'Square 2×2 in (51×51 mm). Plain white or off-white background. Head height roughly 25–35 mm (about 50–69% of frame). Neutral expression, eyes open.',
    source: 'travel.state.gov — U.S. passport photo requirements',
  },
  {
    id: 'schengen-35x45',
    group: 'Schengen / EU',
    label: 'Visa / Passport 35×45 mm',
    wmm: 35,
    hmm: 45,
    dpi: 300,
    defaultBg: '#f2f2f2',
    notes:
      'Portrait 35×45 mm. Light grey or off-white background. Face fills ~70–80% of frame height. No glasses glare, neutral expression.',
    source: 'Official Schengen visa photo specification (per consulate)',
  },
  {
    id: 'uk-35x45',
    group: 'United Kingdom',
    label: 'Passport 35×45 mm',
    wmm: 35,
    hmm: 45,
    dpi: 300,
    defaultBg: '#f2f2f2',
    notes:
      'Portrait 35×45 mm. Plain light-grey or cream background. Head (crown to chin) 29–34 mm.',
    source: 'gov.uk — passport photo rules',
  },
  {
    id: 'ph-2x2',
    group: 'Philippines',
    label: 'Passport / ID 2×2 in',
    wmm: 51,
    hmm: 51,
    dpi: 300,
    defaultBg: '#ffffff',
    notes:
      'Square 2×2 in (51×51 mm). White background is the common requirement. Widely used for local IDs and applications.',
    source: 'DFA Philippines — passport photo requirements',
  },
  {
    id: 'ph-1x1',
    group: 'Philippines',
    label: 'ID 1×1 in',
    wmm: 25,
    hmm: 25,
    dpi: 300,
    defaultBg: '#ffffff',
    notes:
      'Square 1×1 in (25×25 mm). White background. Common for local ID and document photos.',
    source: 'Common PH local-ID requirement',
  },
  {
    id: 'india-2x2',
    group: 'India',
    label: 'Visa 2×2 in',
    wmm: 51,
    hmm: 51,
    dpi: 300,
    defaultBg: '#ffffff',
    notes:
      'Square 2×2 in (51×51 mm). Plain white background. Face centred, covering ~70–80% of frame.',
    source: 'Indian visa photo specification',
  },
  {
    id: 'canada-50x70',
    group: 'Canada',
    label: 'Passport 50×70 mm',
    wmm: 50,
    hmm: 70,
    dpi: 300,
    defaultBg: '#ffffff',
    notes:
      'Portrait 50×70 mm. Plain white background. Head (chin to crown) 31–36 mm. Note: Canadian passport rules are strict on dimensions.',
    source: 'canada.ca — passport photo specifications',
  },
  {
    id: 'china-33x48',
    group: 'China',
    label: 'Visa 33×48 mm',
    wmm: 33,
    hmm: 48,
    dpi: 300,
    defaultBg: '#ffffff',
    notes:
      'Portrait 33×48 mm. Plain white background. Head width 15–22 mm, head height 28–33 mm.',
    source: 'Chinese visa photo specification',
  },
];

export const PRESET_GROUPS = [...new Set(PRESETS.map((p) => p.group))];

// Derive exact output pixels from millimetres and DPI.
export function presetPixels(preset) {
  const w = Math.round((preset.wmm / 25.4) * preset.dpi);
  const h = Math.round((preset.hmm / 25.4) * preset.dpi);
  return { w, h };
}
