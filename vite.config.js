import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static SPA, no backend (Decision D1). Builds to /dist for any static host.
// GITHUB_PAGES is set by the deploy workflow so asset URLs resolve correctly
// under the project-page path (username.github.io/id-site/); everywhere else
// (local dev, other static hosts) it's served from the root.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/id-site/' : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
  },
});
