import { defineConfig } from 'vite';

// Relative asset paths, so the built site works from any folder or sub-path
// (for example GitHub Pages at https://<user>.github.io/<repo>/). Modules use hash URLs,
// so no server-side routing is needed.
export default defineConfig({
  base: './',
});
