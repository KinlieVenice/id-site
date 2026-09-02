// Inline-SVG icon set — deliberately NOT a web-font icon. This app's whole
// pitch is "nothing leaves your device", and a blocked/slow font request
// would otherwise flash its raw ligature name (e.g. "add_photo_alternate")
// as if it were real copy instead of a glyph — reproduced and confirmed in
// this app's own build. Same {name, fill, className, style} API as before,
// so every call site (`<Icon name="..." />`) needed zero changes.
const S = { fill: 'none', stroke: 'currentColor' };
const F = { fill: 'currentColor', stroke: 'none' };

const ICONS = {
  help: [
    ['circle', { cx: 12, cy: 12, r: 9, ...S }],
    ['path', { d: 'M9.1 9a3 3 0 1 1 4.6 2.6c-1 .6-1.7 1.1-1.7 2.4', ...S }],
    ['circle', { cx: 12, cy: 17, r: 0.9, ...F }],
  ],
  expand_more: [['path', { d: 'M6 9l6 6 6-6', ...S }]],
  lock: [
    ['rect', { x: 5, y: 11, width: 14, height: 9, rx: 2, ...S }],
    ['path', { d: 'M8 11V7a4 4 0 0 1 8 0v4', ...S }],
  ],
  add_a_photo: [
    ['path', { d: 'M3 8h3l1.5-2h5L14 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', ...S }],
    ['circle', { cx: 9, cy: 13.5, r: 3, ...S }],
    ['path', { d: 'M18 2v6M15 5h6', ...S }],
  ],
  check_circle: [
    ['circle', { cx: 12, cy: 12, r: 10, ...F }],
    ['path', { d: 'M7.5 12.5l3 3 6-6.5', fill: 'none', stroke: '#fff', strokeWidth: 2.2 }],
  ],
  flag: [['path', { d: 'M6 3v18M6 4h12l-2.2 4L18 12H6', ...S }]],
  info: [
    ['circle', { cx: 12, cy: 12, r: 9, ...S }],
    ['path', { d: 'M12 11v5.5', ...S }],
    ['circle', { cx: 12, cy: 7.7, r: 0.9, ...F }],
  ],
  arrow_back: [['path', { d: 'M19 12H5M11 18l-6-6 6-6', ...S }]],
  arrow_forward: [['path', { d: 'M5 12h14M13 6l6 6-6 6', ...S }]],
  straighten: [
    ['rect', { x: 3, y: 9, width: 18, height: 6, rx: 1.5, ...S }],
    ['path', { d: 'M7.5 9v2.4M12 9v3.2M16.5 9v2.4', ...S }],
  ],
  block: [
    ['circle', { cx: 12, cy: 12, r: 9, ...S }],
    ['path', { d: 'M5.8 18.2L18.2 5.8', ...S }],
  ],
  chevron_left: [['path', { d: 'M15 6l-6 6 6 6', ...S }]],
  chevron_right: [['path', { d: 'M9 6l6 6-6 6', ...S }]],
  check: [['path', { d: 'M5 13l4 4L19 7', ...S }]],
  upload: [['path', { d: 'M12 15.5V4M7.5 8.5L12 4l4.5 4.5M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3', ...S }]],
  sync: [
    ['path', { d: 'M17.5 2.5l3.5 3.5-3.5 3.5', ...S }],
    ['path', { d: 'M3 12.5v-2a4 4 0 0 1 4-4h14', ...S }],
    ['path', { d: 'M6.5 21.5L3 18l3.5-3.5', ...S }],
    ['path', { d: 'M21 11.5v2a4 4 0 0 1-4 4H3', ...S }],
  ],
  zoom_in: [
    ['circle', { cx: 10.5, cy: 10.5, r: 7, ...S }],
    ['path', { d: 'M20.5 20.5l-4.35-4.35M10.5 7.5v6M7.5 10.5h6', ...S }],
  ],
  crop: [['path', { d: 'M6 2v14a2 2 0 0 0 2 2h14', ...S }], ['path', { d: 'M18 22V8a2 2 0 0 0-2-2H2', ...S }]],
  brush: [
    ['path', {
      d: 'M9.1 12L17 4.1a2.2 2.2 0 1 1 3.1 3.1L12.2 15M7 15c-1.7 0-3 1.3-3 3 0 1.4-2 1.6-1.7 2.1C3.4 21.3 4.9 22 6.5 22 8.7 22 10.5 20.2 10.5 18A3 3 0 0 0 7 15z',
      ...S,
    }],
  ],
  undo: [['path', { d: 'M3 7v6h6', ...S }], ['path', { d: 'M21 17a9 9 0 0 0-15-6.7L3 13', ...S }]],
  draw: [['path', { d: 'M17 3.5a2.5 2.5 0 0 1 3.5 3.5L8 19.5 2.5 21 4 15.5 17 3.5z', ...S }], ['path', { d: 'M14.5 6L18 9.5', ...S }]],
  delete: [
    ['path', { d: 'M3.5 6h17', ...S }],
    ['path', { d: 'M8.5 6V4a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 4v2', ...S }],
    ['path', { d: 'M18.5 6l-.9 13.5a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5.5 6', ...S }],
  ],
  download: [['path', { d: 'M12 3v12M7 10l5 5 5-5', ...S }], ['path', { d: 'M5 21h14', ...S }]],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18', ...S }]],
  print: [
    ['path', { d: 'M6.5 9V2.5h11V9', ...S }],
    ['rect', { x: 3.5, y: 9, width: 17, height: 8, rx: 1.5, ...S }],
    ['rect', { x: 7.5, y: 14, width: 9, height: 7.5, ...S }],
  ],
  light_mode: [
    ['circle', { cx: 12, cy: 12, r: 4.2, ...S }],
    ['path', { d: 'M12 2.5v2.3M12 19.2v2.3M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.4 19.6L6 18M18 6l1.6-1.6', ...S }],
  ],
  contrast: [
    ['circle', { cx: 12, cy: 12, r: 9, ...S }],
    ['path', { d: 'M12 3a9 9 0 0 1 0 18z', ...F }],
  ],
  blur_on: [
    ['circle', { cx: 12, cy: 12, r: 2.3, ...F }],
    ['circle', { cx: 7, cy: 8, r: 1.4, ...F }],
    ['circle', { cx: 17, cy: 8, r: 1.7, ...F }],
    ['circle', { cx: 7, cy: 17, r: 1.7, ...F }],
    ['circle', { cx: 17, cy: 17, r: 1.4, ...F }],
  ],
  add_photo_alternate: [
    ['rect', { x: 2, y: 6, width: 15, height: 13.5, rx: 2, ...S }],
    ['circle', { cx: 7.3, cy: 11, r: 1.4, ...S }],
    ['path', { d: 'M3.5 17l3.6-3.6a1.5 1.5 0 0 1 2.1 0l2.6 2.6 1.8-1.8a1.5 1.5 0 0 1 2.1 0l1.4 1.4', ...S }],
    ['path', { d: 'M19.5 2v6M16.5 5h6', ...S }],
  ],
  crop_square: [['rect', { x: 4, y: 4, width: 16, height: 16, rx: 2, ...S }]],
  aspect_ratio: [
    ['rect', { x: 2.5, y: 5, width: 19, height: 14, rx: 1.5, ...S }],
    ['path', { d: 'M7 15v-4h4M17 9v4h-4', ...S }],
  ],
  apparel: [
    ['circle', { cx: 12, cy: 3.3, r: 1, ...F }],
    ['path', {
      d: 'M12 4.3L4.8 9.4a1.8 1.8 0 0 0 1 3.3h12.4a1.8 1.8 0 0 0 1-3.3L12 4.3z',
      ...S,
    }],
    ['path', { d: 'M4.5 16.5h15', ...S }],
  ],
  badge: [
    ['rect', { x: 5, y: 6.5, width: 14, height: 15, rx: 2, ...S }],
    ['rect', { x: 9.5, y: 2.5, width: 5, height: 4, rx: 1, ...S }],
    ['circle', { cx: 12, cy: 12.7, r: 2.2, ...S }],
    ['path', { d: 'M8.3 19c.3-1.9 1.9-3.3 3.7-3.3s3.4 1.4 3.7 3.3', ...S }],
  ],
  auto_fix_high: [
    ['path', { d: 'M4.5 20.5L18 7', ...S }],
    ['path', { d: 'M14.5 11l4 4', ...S }],
    ['path', { d: 'M7 2.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z', ...F }],
    ['path', { d: 'M19 13.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z', ...F }],
  ],
  tune: [
    ['path', { d: 'M4 6h10M17 6h3M4 12h3M9 12h11M4 18h13M20 18h0', ...S }],
    ['circle', { cx: 14, cy: 6, r: 2, ...F }],
    ['circle', { cx: 6, cy: 12, r: 2, ...F }],
    ['circle', { cx: 16, cy: 18, r: 2, ...F }],
  ],
  sparkles: [
    ['path', { d: 'M9 2l1.2 3 3 1.2-3 1.2L9 10.4 7.8 7.4 4.8 6.2l3-1.2L9 2z', ...F }],
    ['path', { d: 'M17.5 12l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z', ...F }],
  ],
  person: [
    ['circle', { cx: 12, cy: 8, r: 3.5, ...S }],
    ['path', { d: 'M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6', ...S }],
  ],
};

// `fill` is accepted for API compatibility with existing call sites
// (`<Icon name="check_circle" fill />`) but unused: every shape below
// already declares its own explicit fill/stroke via the S/F markers, so
// there's nothing left for a top-level default to control.
export default function Icon({ name, fill: _fill, className = '', style }) {
  const shapes = ICONS[name] || ICONS.help;
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {shapes.map(([Tag, props], i) => (
        <Tag key={i} {...props} />
      ))}
    </svg>
  );
}
