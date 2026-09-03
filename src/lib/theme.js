import { useEffect, useState } from 'react';

const STORAGE_KEY = 'id-photo-maker:theme';

// Swatch colours here are just for the picker buttons — the actual palette
// lives in styles.css as [data-theme="..."] blocks (see comment there).
// "pink" needs no data-theme value to apply — it's the plain :root default,
// same as the inline no-flash script in index.html assumes.
export const THEMES = [
  { id: 'pink', label: 'Pink', swatch: '#c41f63' },
  { id: 'ocean', label: 'Ocean', swatch: '#0a6d97' },
  { id: 'forest', label: 'Forest', swatch: '#187a43' },
  { id: 'dark', label: 'Dark', swatch: '#ff5fa0' },
];

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'pink';
  } catch {
    return 'pink';
  }
}

function applyTheme(id) {
  if (id === 'pink') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', id);
  }
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private browsing / storage disabled — theme just won't persist.
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return [theme, setTheme];
}
