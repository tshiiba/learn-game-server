import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cognito': {
        target: 'http://localhost:9229',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cognito/, ''),
      },
    },
  },
})
