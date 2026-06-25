import { useMemo, useState } from 'react';
import CropMarks from './CropMarks.jsx';
import { PRESETS, PRESET_GROUPS, presetPixels } from '../data/presets.js';

// FR2 — pick a size preset, grouped by country/use. Output pixels are derived
// from mm + DPI and shown to the user (true to the monospace/measurement motif).
export default function SizeStep({ selected, onSelect, onNext, onBack }) {
  return (
    <section className="panel">
      <CropMarks />
      <h2>Choose a size</h2>
      <p className="sub">
        Pick the document you need, or enter a custom size. Exact output pixels
        are derived from the size and resolution.
      </p>

      {PRESET_GROUPS.map((group) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          <div className="preset-grid">
            {PRESETS.filter((p) => p.group === group).map((p) => {
              const { w, h } = presetPixels(p);
              return (
                <button
                  key={p.id}
                  className={`preset-card ${selected?.id === p.id ? 'selected' : ''}`}
                  onClick={() => onSelect(p)}
                  aria-pressed={selected?.id === p.id}
                >
                  <span className="label">{p.label}</span>
                  <span className="dims mono">
                    {Math.round(p.wmm)}×{Math.round(p.hmm)} mm · {p.dpi} dpi
                  </span>
                  <span className="dims mono">
                    {w}×{h} px
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <CustomSize selected={selected} onSelect={onSelect} />

      {selected && (
        <div className="notes">
          {selected.notes}
          {selected.source && <span className="src">Verify: {selected.source}</span>}
        </div>
      )}

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
        <span className="spacer" />
        <button className="btn primary" disabled={!selected} onClick={onNext}>
          Crop →
        </button>
      </div>
    </section>
  );
}

const UNIT_TO_MM = { mm: 1, cm: 10, in: 25.4 };

// Custom size: enter width/height in mm, cm or inches at a chosen DPI. Built into
// a preset-shaped object so the rest of the pipeline treats it like any preset.
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
    <div>
      <div className="group-label">Custom size</div>
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
          <span className="dims mono">
            {derived ? `${derived.px.w}×${derived.px.h} px` : 'enter a valid size'}
          </span>
          <button className={`btn ${isActive ? 'primary' : ''}`} disabled={!derived} onClick={use}>
            {isActive ? 'Custom size selected' : 'Use this size'}
          </button>
        </div>
      </div>
    </div>
  );
}
