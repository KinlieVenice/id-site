// Attire library (Decision D4, FR16). Curated transparent overlays placed with
// affine handles — NOT warped or AI-composited. The owner will provide real
// transparent PNGs covering a range of body sizes; swap them in by replacing
// each entry's `src` with a path under /public/attire and dropping the files
// there. Until then these are clean, labelled SVG placeholders so the feature
// works end to end.
//
// Each entry: { id, group, label, src }. `group` is the body-size/type bucket.

// Build a stylised chest-up suit/blouse as an SVG data URL.
function suit({ jacket, shirt, tie, lapel, openCollar = false }) {
  const tieShape = tie
    ? `<rect x="193" y="183" width="14" height="14" fill="${tie}" transform="rotate(45 200 190)"/>
       <path d="M194,196 L206,196 L212,280 L188,280 Z" fill="${tie}"/>`
    : '';
  const collar = openCollar
    ? `<path d="M175,165 L200,188 L184,232 L160,196 Z" fill="${shirt}"/>
       <path d="M225,165 L200,188 L216,232 L240,196 Z" fill="${shirt}"/>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
    <path d="M0,280 V160 Q10,150 60,140 Q120,128 176,166 L200,186 L224,166 Q280,128 340,140 Q390,150 400,160 V280 Z" fill="${jacket}"/>
    <path d="M176,166 L200,186 L224,166 L218,280 L182,280 Z" fill="${shirt}"/>
    ${collar}
    <path d="M176,166 L200,186 L190,236 L166,198 Z" fill="${lapel}"/>
    <path d="M224,166 L200,186 L210,236 L234,198 Z" fill="${lapel}"/>
    ${tieShape}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function blouse({ body, collar }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
    <path d="M0,280 V165 Q10,152 70,142 Q130,132 180,176 Q200,196 220,176 Q270,132 330,142 Q390,152 400,165 V280 Z" fill="${body}"/>
    <path d="M180,176 Q200,210 220,176 L214,158 Q200,184 186,158 Z" fill="${collar}"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const ATTIRE = [
  {
    id: 'suit-navy',
    group: 'Suit & tie',
    label: 'Navy suit · red tie',
    src: suit({ jacket: '#1f2a44', lapel: '#172036', shirt: '#f4f6fb', tie: '#a5312b' }),
  },
  {
    id: 'suit-charcoal',
    group: 'Suit & tie',
    label: 'Charcoal suit · navy tie',
    src: suit({ jacket: '#33373d', lapel: '#26292e', shirt: '#dde8f2', tie: '#22335c' }),
  },
  {
    id: 'suit-black',
    group: 'Suit & tie',
    label: 'Black suit · silver tie',
    src: suit({ jacket: '#1c1c1e', lapel: '#101012', shirt: '#f6f6f6', tie: '#9aa0a6' }),
  },
  {
    id: 'blazer-open',
    group: 'Blazer (open collar)',
    label: 'Black blazer · open collar',
    src: suit({ jacket: '#1c1c1e', lapel: '#101012', shirt: '#f6f6f6', tie: null, openCollar: true }),
  },
  {
    id: 'blazer-grey-open',
    group: 'Blazer (open collar)',
    label: 'Grey blazer · open collar',
    src: suit({ jacket: '#5a5f66', lapel: '#494d53', shirt: '#eef1f4', tie: null, openCollar: true }),
  },
  {
    id: 'blouse-burgundy',
    group: 'Blouse',
    label: 'Burgundy blouse',
    src: blouse({ body: '#6b2233', collar: '#511a27' }),
  },
  {
    id: 'blouse-cream',
    group: 'Blouse',
    label: 'Cream blouse',
    src: blouse({ body: '#e9e2d2', collar: '#d4ccb8' }),
  },
];

export const ATTIRE_GROUPS = [...new Set(ATTIRE.map((a) => a.group))];
