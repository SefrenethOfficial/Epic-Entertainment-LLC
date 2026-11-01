import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Relative base so the build works at any GitHub Pages path.
export default defineConfig({
  base: './',
  logLevel: 'error',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [react()],
});
