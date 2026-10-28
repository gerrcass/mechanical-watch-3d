import { describe, expect, it } from 'vitest';
import {
  CATALOGUE,
  IDLE,
  PART_CATEGORIES,
  PART_LAYERS,
  TOUR_STOPS,
  clampExplosion,
  currentStop,
  explosionOffset,
  nextStop,
  previousStop,
  reduceInspection,
  selectQuality,
  skipTour,
  startTour,
  type InspectionEvent,
} from '../../src/calibre';

describe('catalogue integrity', () => {
  it('has at least 24 complete, uniquely named parts', () => {
    expect(CATALOGUE.length).toBeGreaterThanOrEqual(24);
    const ids = new Set(CATALOGUE.map((entry) => entry.id));
    expect(ids.size).toBe(CATALOGUE.length);
    for (const entry of CATALOGUE) {
      expect(entry.name.trim().length, entry.id).toBeGreaterThan(0);
      expect(entry.job.trim().length, entry.id).toBeGreaterThan(20);
      expect(entry.detail.trim().length, entry.id).toBeGreaterThan(40);
      expect(entry.spec.trim().length, entry.id).toBeGreaterThan(6);
      expect(PART_CATEGORIES).toContain(entry.category);
      expect(PART_LAYERS).toContain(entry.layer);
      expect(entry.targets.length, entry.id).toBeGreaterThan(0);
    }
  });

  it('covers every category and puts the balance and escapement in the regulation layer', () => {
    const categories = new Set(CATALOGUE.map((entry) => entry.category));
    for (const category of PART_CATEGORIES) expect(categories.has(category)).toBe(true);
    expect(CATALOGUE.find((entry) => entry.id === 'balance-wheel')?.category).toBe('Regulation');
    expect(CATALOGUE.find((entry) => entry.id === 'escape-wheel')?.layer).toBe('escapement');
  });
});

describe('inspection machine', () => {
  const run = (events: InspectionEvent[]): ReturnType<typeof reduceInspection> =>
    events.reduce(reduceInspection, IDLE);

  it('previews on hover and clears when the pointer leaves', () => {
    expect(run([{ type: 'hover', id: 'balance-wheel' }])).toEqual({ mode: 'preview', id: 'balance-wheel' });
    expect(run([{ type: 'hover', id: 'barrel' }, { type: 'hover-end' }])).toEqual(IDLE);
  });

  it('pins on activation, ignores hover while pinned, clears on Escape', () => {
    const pinned = run([{ type: 'activate', id: 'barrel' }]);
    expect(pinned).toEqual({ mode: 'pinned', id: 'barrel' });
    expect(reduceInspection(pinned, { type: 'hover', id: 'third-wheel' })).toEqual(pinned);
    expect(reduceInspection(pinned, { type: 'hover-end' })).toEqual(pinned);
    expect(reduceInspection(pinned, { type: 'clear' })).toEqual(IDLE);
  });

  it('pins the preview from the keyboard without leaving the canvas', () => {
    const previewed = run([{ type: 'cycle', direction: 1 }]);
    expect(previewed.mode).toBe('preview');
    expect(reduceInspection(previewed, { type: 'pin' }).mode).toBe('pinned');
  });

  it('cycles with wrap and keeps a pin while cycling', () => {
    const last = run([{ type: 'cycle', direction: -1 }]);
    expect(last.id).toBe(CATALOGUE[CATALOGUE.length - 1]?.id);
    const wrapped = run([{ type: 'cycle', direction: 1 }]);
    expect(wrapped.id).toBe('main-plate');
    const pinned = run([{ type: 'activate', id: 'main-plate' }, { type: 'cycle', direction: -1 }]);
    expect(pinned.mode).toBe('pinned');
    expect(pinned.id).toBe(CATALOGUE[CATALOGUE.length - 1]?.id);
  });

  it('does not change selection when activating the same pinned part', () => {
    const pinned = run([{ type: 'activate', id: 'crown' }]);
    expect(reduceInspection(pinned, { type: 'activate', id: 'crown' })).toEqual(pinned);
  });
});

describe('explosion', () => {
  /** The invariant is layer ordering, not intra-layer ordering. */
  const layerBounds = (amount: number): Map<string, { min: number; max: number }> => {
    const bounds = new Map<string, { min: number; max: number }>();
    for (const entry of CATALOGUE) {
      const offset = explosionOffset(entry, amount);
      const current = bounds.get(entry.layer);
      bounds.set(entry.layer, {
        min: current === undefined ? offset : Math.min(current.min, offset),
        max: current === undefined ? offset : Math.max(current.max, offset),
      });
    }
    return bounds;
  };

  it('clamps and separates by assembly layer order', () => {
    expect(clampExplosion(-2)).toBe(0);
    expect(clampExplosion(4)).toBe(1);
    expect(clampExplosion(Number.NaN)).toBe(0);
    for (const entry of CATALOGUE) expect(explosionOffset(entry, 0)).toBe(0);

    const bounds = layerBounds(1);
    let previousMax = -Infinity;
    for (const layer of PART_LAYERS) {
      const range = bounds.get(layer);
      expect(range, layer).toBeDefined();
      if (!range) continue;
      expect(range.min).toBeGreaterThan(previousMax);
      previousMax = range.max;
    }
  });

  it('never inverts layer order at intermediate amounts', () => {
    for (const amount of [0.1, 0.35, 0.6, 1]) {
      const bounds = layerBounds(amount);
      let previousMax = -Infinity;
      for (const layer of PART_LAYERS) {
        const range = bounds.get(layer);
        if (!range) continue;
        expect(range.min, `${layer} at ${amount}`).toBeGreaterThan(previousMax);
        previousMax = range.max;
      }
    }
  });
});

describe('tour reducer', () => {
  it('has six stops in the intended order', () => {
    expect(TOUR_STOPS.map((stop) => stop.id)).toEqual([
      'power',
      'transmission',
      'regulation',
      'display',
      'winding',
      'assembly',
    ]);
  });

  it('starts at the power stop, advances, clamps and skips', () => {
    const started = startTour();
    expect(currentStop(started)?.partId).toBe('barrel');
    const next = nextStop(started);
    expect(currentStop(next)?.id).toBe('transmission');
    expect(previousStop(started)).toEqual(started);
    let end = started;
    for (let i = 0; i < 10; i += 1) end = nextStop(end);
    expect(end.index).toBe(TOUR_STOPS.length - 1);
    expect(currentStop(skipTour(end))).toBeNull();
  });

  it('pins a part that exists in the catalogue and gives every stop a pose', () => {
    for (const stop of TOUR_STOPS) {
      expect(CATALOGUE.some((entry) => entry.id === stop.partId)).toBe(true);
      expect(stop.pose.position.length).toBe(3);
      expect(stop.pose.target.length).toBe(3);
      expect(stop.narration.length).toBeGreaterThan(40);
    }
  });
});

describe('quality tiers', () => {
  it('uses lite for phones and small viewports and high for a desktop', () => {
    expect(selectQuality({ width: 1440, height: 900, devicePixelRatio: 2 })).toBe('high');
    expect(selectQuality({ width: 360, height: 800, devicePixelRatio: 3 })).toBe('lite');
    expect(selectQuality({ width: 1024, height: 768, devicePixelRatio: 1, deviceMemory: 2 })).toBe('lite');
    expect(selectQuality({ width: 1280, height: 800, devicePixelRatio: 1, coarsePointer: true })).toBe('lite');
  });
});
