import { chromium } from 'playwright-core';
import { CHROMIUM_ARGS, CHROMIUM_PATH, startPreview } from '../scripts/serve.mjs';

/**
 * Browser smoke test at the top seam: the built artefact boots, the canvas has
 * a real drawing buffer, the debug API drives inspection, and the page reports
 * no console errors.
 */
const server = await startPreview(4174);
const browser = await chromium.launch({
  executablePath: CHROMIUM_PATH,
  args: CHROMIUM_ARGS,
  headless: true,
});

let failures = 0;
const check = (condition, label) => {
  if (condition) {
    console.log(`  ok  ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto(server.url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__openMovement !== undefined, null, { timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector('#app')?.getAttribute('data-ready') === 'true');

  const buffer = await page.evaluate(() => {
    const canvas = document.querySelector('#scene');
    return { width: canvas.width, height: canvas.height };
  });
  check(buffer.width > 0 && buffer.height > 0, 'canvas has a non-zero drawing buffer');

  await page.evaluate(() => window.__openMovement.inspect('balance-wheel'));
  const state = await page.evaluate(() => window.__openMovement.getState());
  check(state.inspection.id === 'balance-wheel', 'debug API pins a known part');
  check(state.inspection.mode === 'pinned', 'inspection is pinned');
  const inspectorText = (await page.textContent('#inspector')) ?? '';
  check(inspectorText.includes('Balance wheel'), 'inspector names the pinned part');
  check(inspectorText.includes('270°'), 'inspector shows the technical spec');

  await page.keyboard.press('Escape');
  const cleared = await page.evaluate(() => window.__openMovement.getState());
  check(cleared.inspection.id === null, 'Escape clears the pin without focusing the canvas');

  await page.focus('#scene');
  await page.keyboard.press(']');
  const cycled = await page.evaluate(() => window.__openMovement.getState());
  check(cycled.inspection.id === 'main-plate', 'bracket key cycles the catalogue from idle');

  await page.evaluate(() => window.__openMovement.setExplode(1));
  const exploded = await page.evaluate(() => window.__openMovement.getState());
  check(exploded.explode === 1, 'explosion is exposed on the debug API');

  const stats = await page.evaluate(() => window.__openMovement.stats());
  check(stats.drawCalls > 0, `draw calls measured (${stats.drawCalls})`);
  check(stats.triangles > 0, `triangles measured (${stats.triangles})`);

  check(errors.length === 0, `no console errors${errors.length ? `: ${errors[0]}` : ''}`);

  const count = await page.evaluate(() => window.__openMovement.partCount);
  check(count >= 24, `${count} catalogue parts`);
} finally {
  await browser.close();
  await server.stop();
}

if (failures > 0) {
  console.error(`${failures} smoke check(s) failed.`);
  process.exit(1);
}
console.log('Smoke test passed.');
