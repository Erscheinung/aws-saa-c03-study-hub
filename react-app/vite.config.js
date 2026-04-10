import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/aws-saa-c03-study-hub/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split three.js into its own cacheable chunk separate from
          // CloudWalker3D so the page logic doesn't bloat the 3D vendor lib.
          if (id.includes('node_modules/three')) return 'vendor-three'
        },
      },
    },
  },
})
