import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { CHROMIUM_ARGS, resolveChromium, startPreview } from './serve.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const evidence = path.join(root, 'docs', 'evidence');

const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) {
  console.error('Build failed; no screenshots written.');
  process.exit(build.status ?? 1);
}

await mkdir(evidence, { recursive: true });
const server = await startPreview();
const browser = await chromium.launch({
  executablePath: resolveChromium(),
  args: CHROMIUM_ARGS,
  headless: true,
});

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(`${server.url}?still=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__openMovement !== undefined, null, { timeout: 60_000 });
  await page.evaluate(() => window.__openMovement.ready);
  await page.waitForFunction(() => document.querySelector('#app')?.getAttribute('data-ready') === 'true');
  await page.waitForTimeout(1400);

  await page.screenshot({ path: path.join(evidence, 'hero.png') });
  console.log('wrote docs/evidence/hero.png');

  await page.evaluate(() => {
    window.__openMovement.preview('balance-wheel');
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(evidence, 'hover.png') });
  console.log('wrote docs/evidence/hover.png');

  await page.evaluate(() => {
    window.__openMovement.clear();
    window.__openMovement.setExplode(1);
    // The slider deliberately does not hijack the camera. The capture takes a
    // clean side view so the separated layers read as a stack.
    window.__openMovement.setView([168, -34, 34], [0.6, -0.9, 5.2]);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(evidence, 'exploded.png') });
  console.log('wrote docs/evidence/exploded.png');

  const stats = await page.evaluate(() => window.__openMovement.stats());
  console.log(`render: ${stats.drawCalls} draw calls, ${stats.triangles} triangles`);

  if (consoleErrors.length > 0) {
    console.error('Console errors during capture:');
    for (const error of consoleErrors) console.error(`  ${error}`);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
  server.stop();
}
