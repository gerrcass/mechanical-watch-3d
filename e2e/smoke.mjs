import { chromium } from 'playwright-core';
import { CHROMIUM_ARGS, resolveChromium, startPreview } from '../scripts/serve.mjs';

/**
 * Browser smoke test at the top seam: the built artefact boots, the canvas has
 * a real drawing buffer, the debug API drives inspection, and the page reports
 * no console errors.
 */
const server = await startPreview(4174);
const browser = await chromium.launch({
  executablePath: resolveChromium(),
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
  // The loading veil is still fading and would intercept the first hover.
  await page.waitForFunction(() => document.querySelector('#veil')?.classList.contains('is-gone'));
  await page.waitForTimeout(2200);

  const buffer = await page.evaluate(() => {
    const canvas = document.querySelector('#scene');
    return { width: canvas.width, height: canvas.height };
  });
  check(buffer.width > 0 && buffer.height > 0, 'canvas has a non-zero drawing buffer');

  // Real pointer path: the crystal must not eat the pick.
  const balancePoint = await page.evaluate(() => window.__openMovement.projectPart('balance-wheel'));
  if (balancePoint) {
    await page.mouse.move(balancePoint.x, balancePoint.y, { steps: 4 });
    await page.waitForTimeout(1200);
    await page.mouse.move(balancePoint.x + 1, balancePoint.y + 1, { steps: 2 });
    await page.waitForFunction(
      () => window.__openMovement.getState().inspection.id !== null,
      null,
      { timeout: 15_000 },
    );
    const hovered = await page.evaluate(() => window.__openMovement.getState());
    check(
      hovered.inspection.id !== null && hovered.inspection.id !== 'crystal',
      `real pointer reaches a movement part through the crystal (got ${hovered.inspection.id})`,
    );
  } else {
    check(false, 'balance-wheel anchor projects on screen');
  }

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
  check(stats.drawCalls > 0 && stats.drawCalls <= 250, `scene draw calls within budget (${stats.drawCalls} <= 250)`);
  check(stats.triangles > 0 && stats.triangles <= 350_000, `triangles within budget (${stats.triangles} <= 350000)`);

  await page.evaluate(() => window.__openMovement.locate('balance-wheel'));
  await page.waitForFunction(() => window.__openMovement.cameraState().flying === false, null, { timeout: 15_000 });
  const located = await page.evaluate(() => window.__openMovement.cameraState());
  await page.evaluate(() => window.__openMovement.reset());
  await page.waitForFunction(() => window.__openMovement.cameraState().flying === false, null, { timeout: 15_000 });
  const reset = await page.evaluate(() => window.__openMovement.cameraState());
  check(located.distance < 80, `locate frames the part (${located.distance.toFixed(0)} mm)`);
  check(reset.distance > 100, `reset restores a hero-scale camera (${reset.distance.toFixed(0)} mm)`);

  check(errors.length === 0, `no console errors${errors.length ? `: ${errors[0]}` : ''}`);

  const count = await page.evaluate(() => window.__openMovement.partCount);
  check(count >= 24, `${count} catalogue parts`);

  /* Mobile: the inspector is a bottom sheet, not a clipped card. */
  await page.close();
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobileErrors = [];
  mobile.on('console', (message) => {
    if (message.type() === 'error') mobileErrors.push(message.text());
  });
  mobile.on('pageerror', (error) => mobileErrors.push(String(error)));
  await mobile.goto(server.url, { waitUntil: 'networkidle' });
  await mobile.waitForFunction(() => window.__openMovement !== undefined, null, { timeout: 90_000 });
  await mobile.waitForFunction(() => document.querySelector('#app')?.getAttribute('data-ready') === 'true');
  await mobile.waitForFunction(() => document.querySelector('#veil')?.classList.contains('is-gone'));
  await mobile.waitForTimeout(1200);

  const barrelPoint = await mobile.evaluate(() => window.__openMovement.projectPart('barrel'));
  if (barrelPoint) {
    await mobile.touchscreen.tap(barrelPoint.x, barrelPoint.y);
    await mobile.waitForTimeout(500);
    const first = await mobile.evaluate(() => window.__openMovement.getState());
    check(first.inspection.mode === 'preview' && first.inspection.id !== null, 'touch previews a part');
    await mobile.touchscreen.tap(barrelPoint.x, barrelPoint.y);
    await mobile.waitForTimeout(500);
    const pinned = await mobile.evaluate(() => window.__openMovement.getState());
    check(pinned.inspection.mode === 'pinned', 'second touch pins the part');

    const otherPoint = await mobile.evaluate(() => window.__openMovement.projectPart('third-wheel'));
    if (otherPoint) {
      await mobile.touchscreen.tap(otherPoint.x, otherPoint.y);
      await mobile.waitForTimeout(500);
      const moved = await mobile.evaluate(() => window.__openMovement.getState());
      check(
        moved.inspection.mode === 'pinned' && moved.inspection.id !== pinned.inspection.id,
        'tapping another part moves the pin',
      );
    }

    const box = await mobile.locator('#inspector').boundingBox();
    const locateBox = await mobile.locator('#inspector button').boundingBox();
    check(Boolean(box && box.y >= 0 && box.y + box.height <= 844), 'mobile inspector fits the viewport');
    check(Boolean(locateBox && locateBox.y + locateBox.height <= 844), 'mobile Locate stays on screen');
    const scrollable = await mobile.locator('#inspector').evaluate(
      (node) => node.scrollHeight <= node.clientHeight + 2 || getComputedStyle(node).overflowY === 'auto',
    );
    check(scrollable, 'mobile inspector scrolls rather than clips');
  } else {
    check(false, 'barrel anchor projects on the mobile viewport');
  }
  check(mobileErrors.length === 0, `no mobile console errors${mobileErrors.length ? `: ${mobileErrors[0]}` : ''}`);
  await mobile.close();

  /* No-JS: a static, readable page rather than a stuck loading veil. */
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 900, height: 700 } });
  const staticPage = await noJs.newPage();
  await staticPage.goto(server.url, { waitUntil: 'networkidle' });
  const fallback = await staticPage.locator('.noscript').boundingBox();
  const appHidden = await staticPage.locator('#app').evaluate((node) => getComputedStyle(node).display === 'none');
  check(Boolean(fallback && fallback.height > 100), 'no-JS fallback renders');
  check(appHidden, 'no-JS hides the loading shell');
  await noJs.close();
} finally {
  await browser.close();
  await server.stop();
}

if (failures > 0) {
  console.error(`${failures} smoke check(s) failed.`);
  process.exit(1);
}
console.log('Smoke test passed.');
