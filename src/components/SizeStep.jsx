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
        Pick the document you need. Exact output pixels are derived from the
        size and resolution.
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
