import Icon from './Icon.jsx';

// `ready` switches the status pill from "On-device processing" (Photo/Size)
// to "Ready to print" (Edit/Details/Print) — a simple readiness signal, not
// a strict validation of the photo's actual print-readiness.
export default function TopBar({ ready, onNewPhoto, primary }) {
  return (
    <header className="topbar">
      <span className={`topbar-status ${ready ? 'ready' : ''}`}>
        <Icon name={ready ? 'check_circle' : 'shield_check'} fill />
        {ready ? (
          <span className="ts-copy">
            <span className="ts-title">Ready to print</span>
          </span>
        ) : (
          <span className="ts-copy">
            <span className="ts-title">On-device processing</span>
            <span className="ts-sub">Your photo never leaves your device.</span>
          </span>
        )}
      </span>

      <div className="topbar-actions">
        <button className="btn" onClick={onNewPhoto}>
          <Icon name="add_a_photo" /> New photo
        </button>
        {primary && (
          <button className="btn primary" disabled={primary.disabled} onClick={primary.onClick}>
            {primary.label} <Icon name={primary.icon || 'arrow_forward'} />
          </button>
        )}
      </div>
    </header>
  );
}
