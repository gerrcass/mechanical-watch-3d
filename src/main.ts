import './styles/main.css';
import { CATALOGUE, partById } from './calibre/catalogue';
import { CALIBRE } from './calibre/constants';
import { currentStop, TOUR_STOPS } from './calibre/tour';
import { selectQuality } from './calibre/quality';
import { Engine } from './core/engine';
import { Exhibit } from './watch/exhibit';
import { buildPlate } from './watch/plate';
import { buildTrain } from './watch/train';
import { buildEscapement } from './watch/escapement';
import { buildDisplay } from './watch/display';
import { buildBridges } from './watch/bridges';
import { buildKeyless } from './watch/keyless';
import { buildCase } from './watch/case';
import { Inspector } from './ui/inspector';
import { Hud } from './ui/hud';
import { showFallback } from './ui/fallback';
import type { SpeedSelection, SlowMotionSelection } from './calibre/time';

const params = new URLSearchParams(window.location.search);
const still = params.get('still') === '1';
const debug = params.has('debug');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

let resolveReady: () => void = () => undefined;
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

function boot(): void {
  const canvas = document.getElementById('scene');
  const app = document.getElementById('app');
  const veil = document.getElementById('veil');
  const fallbackParts = document.getElementById('fallback-parts');
  if (!(canvas instanceof HTMLCanvasElement) || !app) return;

  document.body.dataset.still = String(still);
  document.body.dataset.debug = String(debug);

  if (!hasWebGL()) {
    if (fallbackParts) {
      showFallback(
        fallbackParts,
        'This exhibit draws Calibre MW-01 in real time with WebGL. Your browser has not provided a WebGL context, so here is the calibre in words instead.',
      );
    }
    resolveReady();
    return;
  }

  const quality = selectQuality({
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  });

  let engine: Engine;
  try {
    engine = new Engine({ canvas, tier: quality, still });
  } catch (error) {
    console.error('WebGL initialisation failed', error);
    if (fallbackParts) {
      showFallback(
        fallbackParts,
        'The WebGL context could not be created, so the movement cannot be drawn here. The calibre and its parts are described below.',
      );
    }
    resolveReady();
    return;
  }

  const exhibit = new Exhibit({
    engine,
    reducedMotion,
    still,
    labelsRoot: document.getElementById('labels') ?? undefined,
    build: (ctx) => {
      buildPlate(ctx);
      buildTrain(ctx);
      buildEscapement(ctx);
      buildDisplay(ctx);
      buildBridges(ctx);
      buildKeyless(ctx);
      buildCase(ctx);
    },
  });

  const inspectorRoot = document.getElementById('inspector');
  const inspector = inspectorRoot ? new Inspector(inspectorRoot) : null;
  const hudElement = document.getElementById('hud');
  const hud = hudElement ? new Hud(hudElement) : null;
  if (hud) {
    hud.setVisible(debug);
    exhibit.setHud(debug, (stats, now) => hud.update(stats, now));
  }

  const indexOf = new Map(CATALOGUE.map((entry, index) => [entry.id, index]));
  inspector?.onLocate((id) => exhibit.locate(id));

  /* ---------------------------------------------------------------- dock */
  const speedButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-speed]')];
  const slowButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-slow]')];
  const play = document.getElementById('play');
  const explode = document.getElementById('explode') as HTMLInputElement | null;
  const explodeValue = document.getElementById('explode-value');
  const labelsToggle = document.getElementById('labels-toggle');
  const tourStart = document.getElementById('tour-start');
  const wind = document.getElementById('wind');
  const reset = document.getElementById('reset');
  const reserve = document.getElementById('reserve');
  const reserveFill = document.getElementById('reserve-fill');
  const reserveText = document.getElementById('reserve-text');
  const tourPanel = document.getElementById('tour');
  const tourStep = document.getElementById('tour-step');
  const tourCopy = document.getElementById('tour-copy');

  speedButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = Number(button.dataset.speed) as SpeedSelection;
      exhibit.setSpeed(value);
    });
  });
  slowButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = Number(button.dataset.slow) as SlowMotionSelection;
      exhibit.setSlowMotion(value);
    });
  });
  play?.addEventListener('click', () => exhibit.togglePaused());
  explode?.addEventListener('input', () => exhibit.setExplode(Number(explode.value) / 100));
  labelsToggle?.addEventListener('click', () => exhibit.setLabels(!exhibit.labelsVisible));
  tourStart?.addEventListener('click', () => exhibit.startTour());
  wind?.addEventListener('click', () => exhibit.wind());
  reset?.addEventListener('click', () => exhibit.reset());
  document.getElementById('tour-next')?.addEventListener('click', () => exhibit.nextTourStop());
  document.getElementById('tour-prev')?.addEventListener('click', () => exhibit.previousTourStop());
  document.getElementById('tour-skip')?.addEventListener('click', () => exhibit.skipTour());

  const help = document.getElementById('canvas-help');
  canvas.addEventListener('focus', () => help?.classList.add('is-visible'));
  canvas.addEventListener('blur', () => help?.classList.remove('is-visible'));
  canvas.addEventListener('pointerdown', () => help?.classList.add('is-visible'));

  const syncUi = (): void => {
    const snapshot = exhibit.snapshot();
    const entry = snapshot.inspection.id ? partById(snapshot.inspection.id) : null;
    inspector?.render(
      snapshot.inspection,
      entry ?? null,
      entry ? (indexOf.get(entry.id) ?? -1) : -1,
      CATALOGUE.length,
    );

    speedButtons.forEach((button) => {
      const active = Number(button.dataset.speed) === snapshot.speed;
      button.setAttribute('aria-pressed', String(active));
    });
    slowButtons.forEach((button) => {
      const active = Number(button.dataset.slow) === snapshot.slowMotion;
      button.setAttribute('aria-pressed', String(active));
    });
    play?.setAttribute('aria-pressed', String(snapshot.paused));
    play?.setAttribute('aria-label', snapshot.paused ? 'Play the movement' : 'Pause the movement');
    labelsToggle?.setAttribute('aria-pressed', String(snapshot.labels));
    if (explode && document.activeElement !== explode) explode.value = String(Math.round(snapshot.explode * 100));
    if (explodeValue) explodeValue.textContent = String(Math.round(snapshot.explode * 100));
    const fraction = snapshot.reserveHours / CALIBRE.powerReserveHours;
    if (reserveFill) reserveFill.style.transform = `scaleX(${fraction.toFixed(4)})`;
    if (reserveText) reserveText.textContent = `${snapshot.reserveHours.toFixed(0)} h`;
    reserve?.setAttribute('aria-valuenow', snapshot.reserveHours.toFixed(1));
    document.body.dataset.time = snapshot.time;
    document.body.dataset.reserve = snapshot.reserveHours.toFixed(2);
    document.body.dataset.inspected = snapshot.inspection.id ?? '';

    const tour = currentStop(snapshot.tour);
    if (tourPanel) tourPanel.hidden = !tour;
    if (tour) {
      if (tourStep) tourStep.textContent = tour.title;
      if (tourCopy) tourCopy.textContent = tour.narration;
      tourStart?.setAttribute('aria-pressed', 'true');
    } else {
      tourStart?.setAttribute('aria-pressed', 'false');
    }
  };

  exhibit.subscribe(syncUi);
  syncUi();

  /* ---------------------------------------------------------------- ready */
  const firstFrame = (): void => {
    document.documentElement.dataset.ready = 'true';
    app.dataset.ready = 'true';
    veil?.classList.add('is-gone');
    exhibit.markReady();
    resolveReady();
  };

  exhibit.start();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      firstFrame();
      if (debug) console.info('[MW-01] ready', exhibit.stats());
    });
  });

  const api = {
    ready,
    inspect: (id: string) => exhibit.inspect(id),
    preview: (id: string) => exhibit.preview(id),
    clear: () => exhibit.clearInspection(),
    getState: () => exhibit.snapshot(),
    setExplode: (value: number) => exhibit.setExplode(value),
    setSpeed: (value: SpeedSelection) => exhibit.setSpeed(value),
    setSlowMotion: (value: SlowMotionSelection) => exhibit.setSlowMotion(value),
    setLabels: (value: boolean) => exhibit.setLabels(value),
    setPaused: (value: boolean) => exhibit.setPaused(value),
    startTour: () => exhibit.startTour(),
    wind: () => exhibit.wind(),
    reset: () => exhibit.reset(),
    locate: (id: string) => exhibit.locate(id),
    stats: () => exhibit.stats(),
    setPartVisible: (id: string, visible: boolean) => exhibit.setPartVisible(id, visible),
    partCount: CATALOGUE.length,
    tourStops: TOUR_STOPS.length,
  };
  (window as Window & { __openMovement?: typeof api }).__openMovement = api;

  window.addEventListener('beforeunload', () => {
    exhibit.dispose();
    engine.dispose();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
