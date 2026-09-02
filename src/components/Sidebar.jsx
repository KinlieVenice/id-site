import Icon from './Icon.jsx';

export const RAIL_STEPS = [
  { icon: 'add_a_photo', title: 'Photo' },
  { icon: 'crop', title: 'Size' },
  { icon: 'auto_fix_high', title: 'Edit' },
  { icon: 'person', title: 'Details' },
  { icon: 'print', title: 'Print' },
];

// Left rail: Photo / Size / Edit / Details / Print. `active` and `maxReached`
// are rail indices (0-4) — Edit (2) and Details (3) both point at the same
// underlying screen, distinguished by which internal tab is active; see
// App.jsx's railIndex computation.
export default function Sidebar({ active, maxReached, subs, onGo }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Icon name="sparkles" /> ID Photo Maker
      </div>

      <nav className="rail-steps" aria-label="Progress">
        {RAIL_STEPS.map((s, i) => {
          const state = i === active ? 'active' : i < maxReached ? 'done' : '';
          const reachable = i <= maxReached;
          return (
            <button
              key={s.title}
              type="button"
              className={`rail-step ${state} ${reachable ? 'clickable' : ''}`}
              disabled={!reachable}
              aria-current={i === active ? 'step' : undefined}
              onClick={() => reachable && onGo(i)}
            >
              <span className="rail-line" aria-hidden="true" />
              <span className="rail-status">
                {state === 'done' ? <Icon name="check" /> : i + 1}
              </span>
              <span className="rail-step-body">
                <span className="rail-topic-icon">
                  <Icon name={s.icon} />
                </span>
                <span className="rail-step-text">
                  <span className="rail-step-title">{s.title}</span>
                  <br />
                  <span className="rail-step-sub">{subs[i]}</span>
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-privacy">
        <span className="sidebar-privacy-head">
          <Icon name="lock" /> Your privacy is important to us
        </span>
        <p>Your photo is processed on your device and never uploaded.</p>
      </div>
    </aside>
  );
}
