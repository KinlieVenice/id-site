// Progress through the flow: upload → size → crop → background → export.
const STEPS = ['Upload', 'Size', 'Crop', 'Background', 'Extras', 'Export'];

export default function Stepper({ current, maxReached, onGo }) {
  return (
    <nav className="stepper" aria-label="Progress">
      {STEPS.map((label, i) => {
        const state = i === current ? 'active' : i < current ? 'done' : '';
        const reachable = i <= maxReached;
        return (
          <button
            key={label}
            className={`step-chip ${state} ${reachable ? 'clickable' : ''}`}
            disabled={!reachable}
            aria-current={i === current ? 'step' : undefined}
            onClick={() => reachable && onGo(i)}
          >
            <span className="idx">{i + 1}</span>
            <span className="label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
