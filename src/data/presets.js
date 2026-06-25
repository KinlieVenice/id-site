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
//
// Units note: inch-defined formats (US 2×2, generic 1×1/2×2) are stored at exact
// millimetres (1 in = 25.4 mm) so the derived pixels land on clean values —
// e.g. 2 in = 50.8 mm → 600 px @ 300 dpi. The UI rounds the mm for display
// (50.8 → 51) to match how these are commonly written.

export const DEFAULT_DPI = 300;
const DPI = DEFAULT_DPI;

const WHITE = '#ffffff';
const GREY = '#f2f2f2';

// All entries below are PASSPORT photo formats unless the label says otherwise.

// ---- ICAO standard: 35×45 mm ----------------------------------------------
// The most widely used passport format (ICAO Doc 9303). Same dimensions, but
// background rules vary slightly by country, so each carries its own note.
const ICAO = 'ICAO standard · 35×45 mm';
function icao(id, label, defaultBg, bgNote) {
  return {
    id,
    group: ICAO,
    label,
    wmm: 35,
    hmm: 45,
    dpi: DPI,
    defaultBg,
    notes: `${bgNote} Portrait 35×45 mm; face fills roughly 70–80% of the frame height.`,
    source: 'ICAO Doc 9303 / national passport authority',
  };
}

export const PRESETS = [
  // ICAO 35×45 mm
  icao('eu-schengen', '🇪🇺 Schengen visa', GREY, 'Light grey or off-white background.'),
  icao('uk', '🇬🇧 United Kingdom', GREY, 'Plain light grey or cream background. Head (crown to chin) 29–34 mm.'),
  icao('de', '🇩🇪 Germany', WHITE, 'White or light grey background.'),
  icao('ch', '🇨🇭 Switzerland', WHITE, 'White background.'),
  icao('at', '🇦🇹 Austria', GREY, 'Light grey or white background.'),
  icao('fr', '🇫🇷 France', WHITE, 'White or off-white background.'),
  icao('it', '🇮🇹 Italy', WHITE, 'White or light grey background.'),
  icao('nl', '🇳🇱 Netherlands', WHITE, 'White or off-white background.'),
  icao('be', '🇧🇪 Belgium', WHITE, 'White or light grey background.'),
  icao('pl', '🇵🇱 Poland', WHITE, 'White or light grey background.'),
  icao('pt', '🇵🇹 Portugal', WHITE, 'White or off-white background.'),
  icao('ie', '🇮🇪 Ireland', WHITE, 'White background.'),
  icao('au', '🇦🇺 Australia', WHITE, 'White or light grey background.'),
  icao('nz', '🇳🇿 New Zealand', WHITE, 'Plain light background.'),
  icao('in', '🇮🇳 India', WHITE, 'White background.'),
  icao('jp', '🇯🇵 Japan', WHITE, 'Plain white background.'),
  icao('kr', '🇰🇷 South Korea', WHITE, 'Plain white background (not grey).'),
  icao('sg', '🇸🇬 Singapore', WHITE, 'White background only.'),
  icao('my', '🇲🇾 Malaysia', WHITE, 'White background.'),
  icao('mx', '🇲🇽 Mexico', WHITE, 'White background.'),
  icao('za', '🇿🇦 South Africa', WHITE, 'White or off-white background.'),
  icao('sa', '🇸🇦 Saudi Arabia', WHITE, 'White background.'),
  icao('qa', '🇶🇦 Qatar', WHITE, 'White background.'),
  icao('ph', '🇵🇭 Philippines', WHITE, 'White background. (Philippine IDs and many local applications use 2×2 in — see Square & inch formats.)'),
  icao('ae-visa', '🇦🇪 UAE visa', WHITE, 'White background. (UAE passports use 40×60 mm — see below.)'),

  // Square & inch formats
  {
    id: 'us-passport',
    group: 'Square & inch formats',
    label: '🇺🇸 United States · 2×2 in',
    wmm: 50.8,
    hmm: 50.8,
    dpi: DPI,
    defaultBg: WHITE,
    notes:
      'Square 2×2 in (51×51 mm → 600×600 px @ 300 dpi). White background. Head 25–35 mm (1–1⅜ in) of the height. No glasses (since 2016). Used for US passports, visas and Green Card. NOT accepted for a 35×45 mm Schengen visa.',
    source: 'travel.state.gov — U.S. passport photo requirements',
  },
  {
    id: 'pe-passport',
    group: 'Square & inch formats',
    label: '🇵🇪 Peru · 40×40 mm',
    wmm: 40,
    hmm: 40,
    dpi: DPI,
    defaultBg: WHITE,
    notes:
      'Square 40×40 mm (472×472 px @ 300 dpi). White background. Used for Peruvian passports and the DNI. A separate 35×45 mm photo is needed for a Schengen visa.',
    source: 'RENIEC — Peru',
  },
  {
    id: 'ar-passport',
    group: 'Square & inch formats',
    label: '🇦🇷 Argentina · 40×40 mm',
    wmm: 40,
    hmm: 40,
    dpi: DPI,
    defaultBg: WHITE,
    notes: 'Square 40×40 mm (472×472 px @ 300 dpi). White background.',
    source: 'RENAPER — Argentina',
  },
  {
    id: 'id-1x1',
    group: 'Square & inch formats',
    label: 'Generic ID · 1×1 in',
    wmm: 25.4,
    hmm: 25.4,
    dpi: DPI,
    defaultBg: WHITE,
    notes: 'Square 1×1 in (25×25 mm → 300×300 px @ 300 dpi). White background. Common for local IDs and document photos.',
    source: 'Generic 1×1 inch ID size',
  },
  {
    id: 'id-2x2',
    group: 'Square & inch formats',
    label: 'Generic ID · 2×2 in',
    wmm: 50.8,
    hmm: 50.8,
    dpi: DPI,
    defaultBg: WHITE,
    notes: 'Square 2×2 in (51×51 mm → 600×600 px @ 300 dpi). White background. Common for IDs and visa applications worldwide.',
    source: 'Generic 2×2 inch ID size',
  },

  // Other national formats
  {
    id: 'ca-passport',
    group: 'Other national formats',
    label: '🇨🇦 Canada · 50×70 mm',
    wmm: 50,
    hmm: 70,
    dpi: DPI,
    defaultBg: WHITE,
    notes:
      'Tall 50×70 mm (591×827 px @ 300 dpi). White or light background. Head (chin to crown) 31–36 mm. IRCC needs two identical prints; a guarantor signs one.',
    source: 'canada.ca (IRCC) — passport photo specifications',
  },
  {
    id: 'cn-passport',
    group: 'Other national formats',
    label: '🇨🇳 China · 33×48 mm',
    wmm: 33,
    hmm: 48,
    dpi: DPI,
    defaultBg: WHITE,
    notes: 'Narrow 33×48 mm (390×567 px @ 300 dpi). Plain white background. Unique NIA/PSB format.',
    source: 'NIA / PSB — China',
  },
  {
    id: 'br-passport',
    group: 'Other national formats',
    label: '🇧🇷 Brazil · 30×40 mm',
    wmm: 30,
    hmm: 40,
    dpi: DPI,
    defaultBg: WHITE,
    notes: 'Small 30×40 mm (354×472 px @ 300 dpi). White background. Smaller than the ICAO standard.',
    source: 'Polícia Federal — Brazil',
  },
  {
    id: 'gr-passport',
    group: 'Other national formats',
    label: '🇬🇷 Greece · 40×60 mm',
    wmm: 40,
    hmm: 60,
    dpi: DPI,
    defaultBg: WHITE,
    notes: 'Large 40×60 mm (472×709 px @ 300 dpi). White or light background. Hellenic Police standard.',
    source: 'Hellenic Police — Greece',
  },
  {
    id: 'ae-passport',
    group: 'Other national formats',
    label: '🇦🇪 UAE passport · 40×60 mm',
    wmm: 40,
    hmm: 60,
    dpi: DPI,
    defaultBg: WHITE,
    notes: 'Large 40×60 mm (472×709 px @ 300 dpi). White background. Note: UAE visas use 35×45 mm instead.',
    source: 'ICP — United Arab Emirates',
  },
];

export const PRESET_GROUPS = [...new Set(PRESETS.map((p) => p.group))];

// Derive exact output pixels from millimetres and DPI.
export function presetPixels(preset) {
  const w = Math.round((preset.wmm / 25.4) * preset.dpi);
  const h = Math.round((preset.hmm / 25.4) * preset.dpi);
  return { w, h };
}
