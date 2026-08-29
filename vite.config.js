import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ersetzt __BUILD_ID__ im gebauten Service Worker durch einen Zeitstempel,
// damit jeder Build einen neuen Cache-Namen hat (Cache-Busting).
function serviceWorkerBuildId() {
  return {
    name: 'service-worker-build-id',
    apply: 'build',
    closeBundle() {
      const swPath = join('dist', 'service-worker.js')
      try {
        const src = readFileSync(swPath, 'utf8')
        writeFileSync(swPath, src.replace('__BUILD_ID__', Date.now().toString()))
      } catch (err) {
        this.warn(`Service-Worker Build-ID konnte nicht gesetzt werden: ${err.message}`)
      }
    },
  }
}

// Der Basis-Pfad ist '/Anjas_Kochzauberei/' für GitHub-Pages-Projektseiten,
// aber '/' im lokalen Dev-Modus, damit die Vorschau normal funktioniert.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Anjas_Kochzauberei/' : '/',
  plugins: [react(), serviceWorkerBuildId()],
}))
