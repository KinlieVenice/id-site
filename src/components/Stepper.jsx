import Icon from './Icon.jsx';

// The app still runs internally on 6 steps (Upload, Size, Crop, Background,
// Editor, Export — see App.jsx) but the sidebar shows the 5 stages from the
// new design: Photo, Size, Edit, Details, Print. Crop+Background fold into
// "Edit" and Editor (attire/name/signature) becomes "Details" here — a
// presentational bridge until those internal steps are actually merged.
const RAIL_STEPS = [
  { title: 'Photo', sub: 'Upload your photo', icon: 'add_a_photo' },
  { title: 'Size', sub: 'Choose the right size', icon: 'crop' },
  { title: 'Edit', sub: 'Background, retouch and more', icon: 'auto_fix_high' },
  { title: 'Details', sub: 'Outfit, name, signature', icon: 'person' },
  { title: 'Print', sub: 'Arrange and download', icon: 'print' },
];

// internal step (0-5) -> rail index (0-4)
const RAIL_FOR_STEP = [0, 1, 2, 2, 3, 4];
// rail index (0-4) -> internal step to jump to when clicked
const STEP_FOR_RAIL = [0, 1, 2, 4, 5];

export default function Stepper({ current, maxReached, onGo }) {
  const active = RAIL_FOR_STEP[current];
  const maxRail = RAIL_FOR_STEP[maxReached];

  return (
    <nav className="rail-steps" aria-label="Progress">
      {RAIL_STEPS.map((s, i) => {
        const state = i === active ? 'active' : i < maxRail ? 'done' : '';
        const reachable = i <= maxRail;
        return (
          <button
            key={s.title}
            type="button"
            className={`rail-step ${state} ${reachable ? 'clickable' : ''}`}
            disabled={!reachable}
            aria-current={i === active ? 'step' : undefined}
            onClick={() => reachable && onGo(STEP_FOR_RAIL[i])}
          >
            <span className="rail-line" aria-hidden="true" />
            <span className="rail-status">{state === 'done' ? <Icon name="check" /> : i + 1}</span>
            <span className="rail-step-body">
              <span className="rail-topic-icon">
                <Icon name={s.icon} />
              </span>
              <span className="rail-step-text">
                <span className="rail-step-title">{s.title}</span>
                <br />
                <span className="rail-step-sub">{s.sub}</span>
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
