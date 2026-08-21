import { useEffect, useRef, useState } from 'react';

// Custom searchable dropdown (native <select>/<datalist> aren't reliably
// filterable/styleable cross-browser). Type to filter `options` ({id, label}),
// click or Enter to pick, Escape/blur closes and snaps back to `value`.
export default function Combobox({ options, value, onChange, placeholder, id }) {
  const selected = options.find((o) => o.id === value) || null;
  const [query, setQuery] = useState(selected?.label || '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setQuery(selected?.label || '');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(selected?.label || '');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [selected]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

  function pick(opt) {
    onChange(opt);
    setQuery(opt.label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && activeIndex >= 0 && filtered[activeIndex]) pick(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(selected?.label || '');
    }
  }

  useEffect(() => {
    if (open && activeIndex >= 0) {
      listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  return (
    <div className="combobox" ref={rootRef}>
      <div className="search-row">
        <svg className="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          className="size-search"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <ul className="combobox-list" ref={listRef} role="listbox">
          {filtered.length === 0 && <li className="combobox-empty">No match</li>}
          {filtered.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              className={`combobox-option ${i === activeIndex ? 'active' : ''} ${o.id === value ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // keep input focus, avoid blur firing first
                pick(o);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
