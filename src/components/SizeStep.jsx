import { useMemo, useState } from 'react';
import { PRESETS, presetPixels } from '../data/presets.js';

// Group presets by physical dimensions — same size = one merged card.
function buildSizeGroups() {
  const map = new Map();
  PRESETS.forEach((p) => {
    const key = `${p.wmm}x${p.hmm}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  });
  return [...map.values()].map((members) => ({
    key: `${members[0].wmm}x${members[0].hmm}`,
    members,
    canonical: members[0],
  }));
}

const SIZE_GROUPS = buildSizeGroups();

// Extract leading flag emoji (4 chars = two surrogate pairs for regional indicator flags).
function getFlag(label) {
  return label.charCodeAt(0) === 0xd83c ? label.slice(0, 4) : '';
}

function getCountryName(label) {
  const flag = getFlag(label);
  return label.slice(flag.length).split('·')[0].trim();
}

function renderCountrySummary(members) {
  if (members.length === 1) {
    const flag = getFlag(members[0].label);
    return flag ? `${flag} ${getCountryName(members[0].label)}` : members[0].label;
  }
  if (members.length <= 3) {
    return members
      .map((m) => {
        const flag = getFlag(m.label);
        return flag ? `${flag} ${getCountryName(m.label)}` : getCountryName(m.label);
      })
      .join(' · ');
  }
  const flags = members
    .slice(0, 8)
    .map((m) => getFlag(m.label))
    .filter(Boolean)
    .join('');
  const extra = members.length > 8 ? ` +${members.length - 8} more` : '';
  return flags + extra;
}

const UNIT_TO_MM = { mm: 1, cm: 10, in: 25.4 };

export default function SizeStep({ selected, onSelect, onNext, onBack }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SIZE_GROUPS;
    return SIZE_GROUPS.filter((g) =>
      g.members.some(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q) ||
          `${Math.round(p.wmm)}x${Math.round(p.hmm)}`.includes(q) ||
          `${Math.round(p.wmm)}×${Math.round(p.hmm)}`.includes(q),
      ),
    );
  }, [query]);

  const selectedGroup = selected
    ? SIZE_GROUPS.find((g) => g.members.some((m) => m.id === selected.id))
    : null;

  return (
    <section className="panel">
      <h2>Choose a size</h2>
      <p className="sub">
        Select your ID or passport format. Same-size countries are grouped together.
      </p>

      <div className="search-row">
        <svg className="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="size-search"
          placeholder="Search country or size… e.g. Philippines, 35×45"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="hint" style={{ margin: '16px 0' }}>
          No matching format found. Try a different search or use Custom size below.
        </p>
      )}

      <div className="preset-grid" style={{ marginTop: 14 }}>
        {filtered.map((g) => {
          const { w, h } = presetPixels(g.canonical);
          const isSelected = selected && g.members.some((m) => m.id === selected.id);
          const summary = renderCountrySummary(g.members);

          return (
            <button
              key={g.key}
              className={`preset-card ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                const keep = selected && g.members.find((m) => m.id === selected.id);
                onSelect(keep || g.canonical);
              }}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <svg className="card-check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" fill="currentColor" />
                  <path
                    d="M6.5 10.2l2.3 2.3 4.7-4.9"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span className="card-size mono">
                {Math.round(g.canonical.wmm)}×{Math.round(g.canonical.hmm)}{' '}
                <span className="card-unit">mm</span>
              </span>
              <span className="card-countries">{summary}</span>
              <span className="dims mono">
                {w}×{h} px · {g.canonical.dpi} dpi
              </span>
            </button>
          );
        })}
      </div>

      <CustomSize selected={selected} onSelect={onSelect} />

      {selectedGroup && selectedGroup.members.length > 1 && (
        <div className="variant-row">
          <span className="lbl">Country / format requirements</span>
          <select
            value={selected?.id || ''}
            onChange={(e) => {
              const p = selectedGroup.members.find((m) => m.id === e.target.value);
              if (p) onSelect(p);
            }}
          >
            {selectedGroup.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

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
    <div style={{ marginTop: 20 }}>
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
