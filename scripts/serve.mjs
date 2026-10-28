import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const root = path.resolve(new URL('..', import.meta.url).pathname);

/**
 * Start the production preview server for screenshots and the browser smoke
 * test. The local Vite binary is spawned directly so SIGTERM reaches the
 * server process (npx would leave an orphan holding the port).
 */
export async function startPreview(port = 4173) {
  const child = spawn(
    path.join(root, 'node_modules', '.bin', 'vite'),
    ['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
  );
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += String(chunk);
  });
  child.stderr.on('data', (chunk) => {
    output += String(chunk);
  });

  const url = `http://127.0.0.1:${port}/`;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return {
          url,
          child,
          stop: async () => {
            child.kill('SIGTERM');
            await delay(120);
            if (!child.killed) child.kill('SIGKILL');
          },
        };
      }
    } catch {
      // Server not up yet.
    }
    await delay(200);
  }
  child.kill('SIGTERM');
  throw new Error(`Preview server did not start.\n${output}`);
}

/** Find a usable Chromium: CI env override, common system paths, then Playwright's own. */
export function resolveChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      // keep looking
    }
  }
  return undefined; // chromium.launch() will use Playwright's managed browser
}

export const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-dev-shm-usage',
  '--disable-gpu-vsync',
  '--force-color-profile=srgb',
];


