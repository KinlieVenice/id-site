import { useMemo, useState } from 'react';
import CropMarks from './CropMarks.jsx';
import Icon from './Icon.jsx';
import Combobox from './Combobox.jsx';
import { PRESETS, presetPixels } from '../data/presets.js';

// Generic inch-defined ID formats get their own small cards, in inches — every
// other preset (all real national/ICAO passport specs, whatever unit they're
// legally defined in) lives behind the single "Passport" country combobox.
const ID_FORMAT_IDS = new Set(['id-1x1', 'id-1.5x1.5', 'id-2x2', 'asa-loan']);
const ID_FORMATS = PRESETS.filter((p) => ID_FORMAT_IDS.has(p.id));
const ID_ICONS = { 'id-1x1': 'crop_square', 'id-1.5x1.5': 'crop_square', 'id-2x2': 'aspect_ratio', 'asa-loan': 'aspect_ratio' };
const ID_DESCRIPTIONS = {
  'id-1x1': 'Common for local IDs and specific visa applications.',
  'id-1.5x1.5': 'Common for local IDs and specific applications.',
  'id-2x2': 'Common for local IDs and many visa applications worldwide.',
  'asa-loan': 'Landscape photo for ASA microfinance loan applications.',
};
// Formats an inch dimension the way these cards' labels read: whole numbers
// bare ("2"), fractional ones to one decimal ("1.5") — never "1.50" or "2.0".
// Snaps to the nearest 0.1 in first — mm/25.4 (e.g. 76.2/25.4) doesn't always
// land on an exact float, so "3 in" could otherwise render as "3.0000000004".
function fmtIn(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}

// Extract leading flag emoji (4 chars = two surrogate pairs for regional indicator flags).
function getFlag(label) {
  return label.charCodeAt(0) === 0xd83c ? label.slice(0, 4) : '';
}
function getCountryName(label) {
  const flag = getFlag(label);
  return label.slice(flag.length).split('·')[0].trim();
}

const DEFAULT_PASSPORT_ID = 'ph';
const PASSPORT_PRESETS = PRESETS.filter((p) => !ID_FORMAT_IDS.has(p.id)).sort((a, b) =>
  getCountryName(a.label).localeCompare(getCountryName(b.label)),
);

const UNIT_TO_MM = { mm: 1, cm: 10, in: 25.4 };

export default function SizeStep({ selected, onSelect, onNext, onBack }) {
  const isPassport = selected && PASSPORT_PRESETS.some((p) => p.id === selected.id);
  const passportId = isPassport ? selected.id : DEFAULT_PASSPORT_ID;
  const passportPreset = PASSPORT_PRESETS.find((p) => p.id === passportId);
  const { w: pw, h: ph } = presetPixels(passportPreset);

  const countryOptions = useMemo(
    () => PASSPORT_PRESETS.map((p) => ({ id: p.id, label: getCountryName(p.label), preset: p })),
    [],
  );

  return (
    <section className="panel">
      <CropMarks />
      <h2>Choose a size</h2>
      <p className="sub">Pick a passport (by country) or a common ID size.</p>

      <div className="size-grid">
        <div
          className={`size-card passport-card ${isPassport ? 'selected' : ''}`}
          onClick={() => {
            if (!isPassport) onSelect(passportPreset);
          }}
        >
          {isPassport && <Icon name="check_circle" fill className="size-card-check" />}
          <div className="size-card-head">
            <Icon name="flag" />
            <h2>Passport</h2>
          </div>
          <label className="group-label" htmlFor="passport-country">
            Country / region
          </label>
          <Combobox
            id="passport-country"
            options={countryOptions}
            value={passportId}
            onChange={(opt) => onSelect(opt.preset)}
            placeholder="Type a country…"
          />
          <p className="passport-card-hint">
            <Icon name="info" />
            {Math.round(passportPreset.wmm)}×{Math.round(passportPreset.hmm)} mm · {pw}×{ph} px ·{' '}
            {passportPreset.dpi} dpi
          </p>
        </div>

        {ID_FORMATS.map((p) => {
          const { w, h } = presetPixels(p);
          const isSelected = selected?.id === p.id;
          const wIn = p.wmm / 25.4;
          const hIn = p.hmm / 25.4;
          return (
            <button
              key={p.id}
              className={`size-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(p)}
              aria-pressed={isSelected}
            >
              {isSelected && <Icon name="check_circle" fill className="size-card-check" />}
              <div className="size-card-head">
                <Icon name={ID_ICONS[p.id]} />
                <h2>
                  {fmtIn(wIn)}×{fmtIn(hIn)} in
                </h2>
              </div>
              <p className="size-card-desc">{ID_DESCRIPTIONS[p.id]}</p>
              <div className="size-card-tags">
                <span>
                  {fmtIn(wIn)} × {fmtIn(hIn)} in
                </span>
                <span>{p.dpi} dpi</span>
              </div>
            </button>
          );
        })}

        <CustomSize selected={selected} onSelect={onSelect} />
      </div>

      {selected && (
        <div className="notes">
          {selected.notes}
          {selected.source && <span className="src">Verify: {selected.source}</span>}
        </div>
      )}

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          <Icon name="arrow_back" /> Back
        </button>
        <span className="spacer" />
        <button className="btn primary" disabled={!selected} onClick={onNext}>
          Crop <Icon name="arrow_forward" />
        </button>
      </div>
    </section>
  );
}

function CustomSize({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState('35');
  const [h, setH] = useState('45');
  const [unit, setUnit] = useState('mm');
  const [dpi, setDpi] = useState('300');

  const isActive = selected?.id === 'custom';

  const derived = useMemo(() => {
    const wn = parseFloat(w);
    const hn = parseFloat(h);
    const dn = parseInt(dpi, 10);
    if (!(wn > 0) || !(hn > 0) || !(dn > 0)) return null;
    const wmm = wn * UNIT_TO_MM[unit];
    const hmm = hn * UNIT_TO_MM[unit];
    return {
      wmm,
      hmm,
      dpi: dn,
      px: { w: Math.round((wmm / 25.4) * dn), h: Math.round((hmm / 25.4) * dn) },
    };
  }, [w, h, unit, dpi]);

  function use() {
    if (!derived) return;
    onSelect({
      id: 'custom',
      group: 'Custom size',
      label: `Custom ${w}×${h} ${unit}`,
      wmm: derived.wmm,
      hmm: derived.hmm,
      dpi: derived.dpi,
      defaultBg: '#ffffff',
      notes: `Custom size: ${w}×${h} ${unit} at ${derived.dpi} dpi (${derived.px.w}×${derived.px.h} px). Double-check this matches your document's requirement.`,
      source: 'Custom size you entered',
    });
  }

  if (!open && !isActive) {
    return (
      <button className="size-card custom" onClick={() => setOpen(true)}>
        <Icon name="straighten" />
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '10px 0 4px' }}>Custom size</h2>
        <p className="size-card-desc" style={{ flex: 'none' }}>
          Define specific width, height, and resolution.
        </p>
      </button>
    );
  }

  return (
    <div className={`size-card custom-size-open ${isActive ? 'selected' : ''}`}>
      {isActive && <Icon name="check_circle" fill className="size-card-check" />}
      <div className="size-card-head">
        <Icon name="straighten" />
        <h2>Custom size</h2>
      </div>
      <div className="custom-fields">
        <label className="cf">
          <span className="lbl">Width</span>
          <input type="number" min="0" step="any" value={w} onChange={(e) => setW(e.target.value)} />
        </label>
        <span className="times mono">×</span>
        <label className="cf">
          <span className="lbl">Height</span>
          <input type="number" min="0" step="any" value={h} onChange={(e) => setH(e.target.value)} />
        </label>
        <label className="cf">
          <span className="lbl">Unit</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="in">inch</option>
          </select>
        </label>
        <label className="cf">
          <span className="lbl">DPI</span>
          <input type="number" min="0" step="1" value={dpi} onChange={(e) => setDpi(e.target.value)} />
        </label>
      </div>
      <div className="custom-foot">
        <span className="dims mono">
          {derived ? `${derived.px.w}×${derived.px.h} px` : 'enter a valid size'}
        </span>
        <button className={`btn ${isActive ? 'primary' : ''}`} disabled={!derived} onClick={use}>
          {isActive ? 'Custom size selected' : 'Use this size'}
        </button>
      </div>
    </div>
  );
}
