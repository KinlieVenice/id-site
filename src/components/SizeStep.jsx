import { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import Combobox from './Combobox.jsx';
import { PRESETS, presetPixels } from '../data/presets.js';

// Generic inch-defined ID formats get their own small cards, in inches — every
// other preset (all real national/ICAO passport specs, whatever unit they're
// legally defined in) lives behind the "By country" combobox.
const ID_FORMAT_IDS = new Set(['id-1x1', 'id-1.5x1.5', 'id-2x2', 'asa-loan']);

function getFlag(label) {
  return label.charCodeAt(0) === 0xd83c ? label.slice(0, 4) : '';
}
function getCountryName(label) {
  const flag = getFlag(label);
  return label.slice(flag.length).split('·')[0].trim();
}
function fmtIn(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}

const DEFAULT_PASSPORT_ID = 'ph';
const PASSPORT_PRESETS = PRESETS.filter((p) => !ID_FORMAT_IDS.has(p.id)).sort((a, b) =>
  getCountryName(a.label).localeCompare(getCountryName(b.label)),
);
const VISA_PRESET = PRESETS.find((p) => p.id === 'id-2x2');
const SCHOOL_PRESET = PRESETS.find((p) => p.id === 'id-1.5x1.5');
const ID2X2_PRESET = PRESETS.find((p) => p.id === 'id-2x2');

const UNIT_TO_MM = { mm: 1, cm: 10, in: 25.4 };

export default function SizeStep({ imageSrc, selected, onSelect, onBack }) {
  const [tab, setTab] = useState('popular');
  const [passportId, setPassportId] = useState(DEFAULT_PASSPORT_ID);
  const passportPreset = PASSPORT_PRESETS.find((p) => p.id === passportId) || PASSPORT_PRESETS[0];

  const countryOptions = useMemo(
    () => PASSPORT_PRESETS.map((p) => ({ id: p.id, label: getCountryName(p.label), preset: p })),
    [],
  );

  const w = selected ? presetPixels(selected).w : null;
  const h = selected ? presetPixels(selected).h : null;

  return (
    <>
      <div className="page-head">
        <span className="step-badge">STEP 2 OF 5</span>
        <h1>Choose a size</h1>
        <p className="sub">Select the size you need. We&rsquo;ll set everything up for you.</p>
      </div>

      <div className="two-col">
        <div>
          <div className="tabbar">
            <button className={`tabbar-btn ${tab === 'popular' ? 'on' : ''}`} onClick={() => setTab('popular')}>
              Popular
            </button>
            <button className={`tabbar-btn ${tab === 'country' ? 'on' : ''}`} onClick={() => setTab('country')}>
              By country
            </button>
            <button className={`tabbar-btn ${tab === 'custom' ? 'on' : ''}`} onClick={() => setTab('custom')}>
              Custom size
            </button>
          </div>

          {tab === 'popular' && (
            <div className="size-grid">
              <SizeCard
                icon="globe"
                title="Passport"
                desc={getCountryName(passportPreset.label)}
                tag="Recommended"
                tagClass="official"
                preset={passportPreset}
                selected={selected?.id === passportPreset.id}
                onClick={() => onSelect(passportPreset)}
              />
              <SizeCard
                icon="crop_square"
                title="2 × 2 in"
                desc="Common for IDs and documents"
                tag="Common size"
                tagClass="common"
                preset={ID2X2_PRESET}
                selected={selected?.id === ID2X2_PRESET.id}
                onClick={() => onSelect(ID2X2_PRESET)}
              />
              <SizeCard
                icon="globe"
                title="Visa"
                desc="For visa applications"
                tag="Common size"
                tagClass="common"
                preset={VISA_PRESET}
                selected={selected?.id === 'visa-alias'}
                onClick={() => onSelect({ ...VISA_PRESET, id: 'visa-alias' })}
              />
              <SizeCard
                icon="school"
                title="School / Work ID"
                desc="For student or employee IDs"
                tag="Common size"
                tagClass="common"
                preset={SCHOOL_PRESET}
                selected={selected?.id === SCHOOL_PRESET.id}
                onClick={() => onSelect(SCHOOL_PRESET)}
              />
              <button className="size-card custom" onClick={() => setTab('custom')}>
                <Icon name="fit_screen" />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '10px 0 4px' }}>Custom size</h2>
                <p className="size-card-desc">Set your own dimensions</p>
                <span className="size-card-tags" style={{ marginTop: 8 }}>
                  <span>Define width, height and resolution</span>
                </span>
              </button>
            </div>
          )}

          {tab === 'country' && (
            <div>
              <div className="field">
                <span className="lbl">Country / region</span>
                <Combobox
                  options={countryOptions}
                  value={passportId}
                  onChange={(opt) => {
                    setPassportId(opt.id);
                    onSelect(opt.preset);
                  }}
                  placeholder="Type a country…"
                />
              </div>
              {selected && PASSPORT_PRESETS.some((p) => p.id === selected.id) && (
                <div className="notes">
                  {selected.notes}
                  {selected.source && <span className="src">Verify: {selected.source}</span>}
                </div>
              )}
            </div>
          )}

          {tab === 'custom' && <CustomSize selected={selected} onSelect={onSelect} />}

          <div className="help-banner">
            <Icon name="tune" className="hb-icon" />
            <span className="hb-copy">
              <span className="hb-title">Not sure which size to use?</span>
              <br />
              <span className="hb-sub">You can change this later. We&rsquo;ll help you get it right.</span>
            </span>
          </div>
        </div>

        <div className="card side-card">
          <h2>Preview</h2>
          <p className="sub">This is how your photo will be sized.</p>

          <div className="size-preview">
            {selected && <span className="size-preview-dim w">{Math.round(selected.wmm)} mm</span>}
            {selected && <span className="size-preview-dim h">{Math.round(selected.hmm)} mm</span>}
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Your photo"
                style={{
                  aspectRatio: selected ? `${selected.wmm} / ${selected.hmm}` : '1 / 1',
                  objectFit: 'cover',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: 220,
                }}
              />
            ) : (
              <Icon name="image" style={{ fontSize: 40, color: 'var(--ink-3)' }} />
            )}
          </div>

          {selected ? (
            <>
              <div className="about-rows">
                <div className="about-row">
                  <span>Size</span>
                  <span>
                    {Math.round(selected.wmm)} × {Math.round(selected.hmm)} mm
                  </span>
                </div>
                <div className="about-row">
                  <span>Pixels</span>
                  <span>
                    {w} × {h} px
                  </span>
                </div>
                <div className="about-row">
                  <span>Resolution</span>
                  <span>{selected.dpi} DPI</span>
                </div>
                <div className="about-row">
                  <span>Aspect ratio</span>
                  <span>{fmtIn(selected.wmm / gcd(selected.wmm, selected.hmm))} : {fmtIn(selected.hmm / gcd(selected.wmm, selected.hmm))}</span>
                </div>
              </div>
              <div className="requirement-badge">
                <Icon name="check_circle" fill />
                <span>
                  <span className="rb-title">Meets official requirements</span>
                  <br />
                  <span className="rb-sub">This size is accepted for official documents.</span>
                </span>
              </div>
            </>
          ) : (
            <p className="hint">Pick a size on the left to see a preview.</p>
          )}
        </div>
      </div>
    </>
  );
}

function gcd(a, b) {
  a = Math.round(a * 10);
  b = Math.round(b * 10);
  while (b) [a, b] = [b, a % b];
  return a / 10 || 1;
}

function SizeCard({ icon, title, desc, tag, tagClass, preset, selected, onClick }) {
  const { w, h } = presetPixels(preset);
  return (
    <button className={`size-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      {selected && <Icon name="check_circle" fill className="size-card-check" />}
      <div className="size-card-head">
        <Icon name={icon} />
        <h2>{title}</h2>
      </div>
      <p className="size-card-desc">{desc}</p>
      <p className="passport-card-hint" style={{ margin: 0 }}>
        {Math.round(preset.wmm)} × {Math.round(preset.hmm)} mm · {w} × {h} px @ {preset.dpi} DPI
      </p>
      <div className="size-card-tags">
        <span className={tagClass}>{tag}</span>
      </div>
    </button>
  );
}

function CustomSize({ selected, onSelect }) {
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

  return (
    <div className={`custom-size ${isActive ? 'selected' : ''}`}>
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
        <span className="dims mono">{derived ? `${derived.px.w}×${derived.px.h} px` : 'enter a valid size'}</span>
        <button className={`btn ${isActive ? 'primary' : ''}`} disabled={!derived} onClick={use}>
          {isActive ? 'Custom size selected' : 'Use this size'}
        </button>
      </div>
    </div>
  );
}
