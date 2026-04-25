import { spawn, type ChildProcess } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

export const DEV_URL = 'http://localhost:5180';

export interface DevServerHandle {
  process: ChildProcess | null;
  /** Whether we started the server (true) or attached to an existing one (false). */
  started: boolean;
  stop(): Promise<void>;
}

async function isUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.ok || res.status === 304;
  } catch {
    return false;
  }
}

async function waitFor(url: string, timeoutMs = 30_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp(url)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

/**
 * Ensure a dev server is reachable at DEV_URL. Attaches to an existing one if
 * already running, otherwise spawns `npm run dev` in the repo root.
 */
export async function ensureDevServer(): Promise<DevServerHandle> {
  if (await isUp(DEV_URL)) {
    return {
      process: null,
      started: false,
      async stop() {
        // Did not start it — leave it running.
      },
    };
  }

  const child = spawn('npm', ['run', 'dev'], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  // Drain output so the child doesn't block on a full pipe buffer.
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});

  const ok = await waitFor(DEV_URL, 30_000);
  if (!ok) {
    child.kill('SIGTERM');
    throw new Error(`Dev server did not become ready at ${DEV_URL} within 30s`);
  }

  return {
    process: child,
    started: true,
    async stop() {
      if (!child.killed) {
        child.kill('SIGTERM');
        await new Promise((r) => setTimeout(r, 500));
        if (!child.killed) child.kill('SIGKILL');
      }
    },
  };
}
