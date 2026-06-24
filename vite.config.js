import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static SPA, no backend (Decision D1). Builds to /dist for any static host.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
  },
});
