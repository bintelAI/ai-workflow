import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['components/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@ai-flow': path.resolve(__dirname, './'),
      '@ai-flow-src': path.resolve(__dirname, 'src'),
    },
  },
});
