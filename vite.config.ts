/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [['tests/ui/**', 'jsdom']],
    // Vitest replaces (not extends) the default exclude when set, so the
    // standard patterns are repeated here. The trailing `**/.claude/**`
    // entry stops `npm test` from descending into stale worktrees that
    // Claude Code leaves under `.claude/worktrees/` — without it, those
    // 30+ frozen project copies inflate the test count by 10k+.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/.claude/**',
    ],
  },
});
