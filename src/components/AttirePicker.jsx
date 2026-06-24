import { ATTIRE, ATTIRE_GROUPS } from '../data/attire.js';

// FR16 (Phase 4) — browse the curated attire set, grouped by type/body size.
// Selecting one drops it onto the editor canvas to position with handles.
export default function AttirePicker({ selectedId, onSelect }) {
  return (
    <div>
      <button
        className={`btn ${!selectedId ? 'primary' : ''}`}
        style={{ marginBottom: 12 }}
        onClick={() => onSelect(null)}
      >
        No attire
      </button>
      {ATTIRE_GROUPS.map((group) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          <div className="attire-grid">
            {ATTIRE.filter((a) => a.group === group).map((a) => (
              <button
                key={a.id}
                className={`attire-card ${selectedId === a.id ? 'selected' : ''}`}
                onClick={() => onSelect(a.id)}
                title={a.label}
              >
                <img src={a.src} alt={a.label} />
                <span className="cap">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
