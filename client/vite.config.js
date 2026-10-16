import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The /api proxy lets the client call the backend without CORS headaches in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
