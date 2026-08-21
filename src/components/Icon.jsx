// Thin wrapper around the Material Symbols Outlined icon font (loaded in index.html).
export default function Icon({ name, fill = false, className = '', style }) {
  return (
    <span
      className={`icon material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}`, ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
