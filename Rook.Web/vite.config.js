import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Feature-based structure (see README.md) — these exist so an import
      // never has to become '../../../../shared/components/Button' just
      // because a page moved. Only shared/ and services/ are meant to be
      // imported across module boundaries; @modules/* is here mainly for
      // app/routes.jsx wiring up each module's own route table.
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
      // dev/ holds developer-only tooling (the component playground) that
      // never ships to production — see dev/playground and app/routes.jsx.
      '@dev': fileURLToPath(new URL('./src/dev', import.meta.url)),
    },
  },
})
