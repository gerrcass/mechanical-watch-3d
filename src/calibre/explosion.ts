import { clamp } from './constants';
import { PART_LAYERS, type AssemblyLayer, type PartCatalogueEntry } from './catalogue';

/**
 * The explosion is one scalar. Each assembly layer owns a shift along +Z, and
 * each part adds a small bias inside its layer so the stack reads as a stack
 * rather than a set of parallel plates.
 *
 * Constraints the numbers satisfy: every bias is smaller than the gap to the
 * next layer, so layer order is never inverted at any amount.
 */
export const LAYER_ORDER: readonly AssemblyLayer[] = PART_LAYERS;

export const LAYER_SHIFT: Readonly<Record<AssemblyLayer, number>> = {
  keyless: -4.5,
  plate: 0,
  train: 1.2,
  escapement: 2.8,
  motion: 4.6,
  bridges: 7,
  hands: 10,
  chapter: 12.5,
  case: 15,
};

export function layerIndex(layer: AssemblyLayer): number {
  return LAYER_ORDER.indexOf(layer);
}

export function clampExplosion(amount: number): number {
  return clamp(Number.isFinite(amount) ? amount : 0, 0, 1);
}

/**
 * Axial displacement in millimetres. `amount = 0` is fitted, `1` is fully
 * separated, and nothing in between exceeds the layer ordering.
 */
export function explosionOffset(entry: Pick<PartCatalogueEntry, 'layer' | 'explodeBias'>, amount: number): number {
  const t = clampExplosion(amount);
  // Normalise -0 so a fitted stack reports a clean zero.
  return t === 0 ? 0 : (LAYER_SHIFT[entry.layer] + entry.explodeBias) * t;
}

/** Smooth 0–1 interpolation for the camera when the explosion changes. */
export function easeExplosion(value: number): number {
  const t = clampExplosion(value);
  return t * t * (3 - 2 * t);
}
