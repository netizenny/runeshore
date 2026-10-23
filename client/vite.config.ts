import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  server: { port: 5173, proxy: { '/ws': { target: 'ws://localhost:3001', ws: true } } },
});
