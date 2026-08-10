import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Windows (antivirus, OneDrive, Explorer thumbnailing) briefly locks
      // newly-added or just-touched files. Vite's watcher throws an
      // uncaught EBUSY on that lock instead of retrying, which kills the
      // whole dev server — this is what "localhost randomly crashes" turned
      // out to be. Assets don't need hot-reload-on-edit the way source
      // files do, so excluding them removes the crash risk entirely.
      ignored: ['**/src/assets/**'],
    },
  },
})