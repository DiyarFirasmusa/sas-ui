import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const registrySrc = (path: string) =>
  fileURLToPath(new URL(`../../packages/registry/src/${path}`, import.meta.url));

// The docs render the registry sources directly (the same files the CLI copies),
// so what you see here is exactly what a project gets.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\//, replacement: `${registrySrc('ui')}/` },
      { find: /^@\/lib\//, replacement: `${registrySrc('lib')}/` },
      { find: /^@\/hooks\//, replacement: `${registrySrc('hooks')}/` },
      { find: /^@\/test\//, replacement: `${registrySrc('test')}/` },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: ['../..'] } },
});
