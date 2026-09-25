import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { applyPalette, getStoredThemeState } from './lib/theme.js';

const theme = getStoredThemeState();
applyPalette(theme.hue, theme.mode);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
