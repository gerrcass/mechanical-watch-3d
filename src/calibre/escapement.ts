import { CALIBRE, DEG, normalizeAngle } from './constants';

export interface BeatState {
  /** Monotonic beat index: eight per display second. */
  index: number;
  /** 0–1 through the current beat. */
  phase: number;
  /** Balance angle in degrees, ±half the full amplitude. */
  balanceDeg: number;
  /** Escape wheel advance counted in whole half-teeth since t = 0. */
  escapeSteps: number;
  /** Escape wheel angle in radians, counter-clockwise positive. */
  escapeAngle: number;
  /** Pallet fork banking: -1 or +1, snapped to the current beat. */
  bank: -1 | 1;
}

/** How much of a beat the escape wheel and fork take to snap across. */
const SNAP_FRACTION = 0.14;
/** The pallet fork banks ±10° between its banking pins. */
export const FORK_BANK_DEG = 10;

function easeSnap(phase: number): number {
  const t = Math.min(1, Math.max(0, phase / SNAP_FRACTION));
  // Critically damped feel: fast release, settled landing.
  return t * t * (3 - 2 * t);
}

/**
 * The escapement clock. At 1× a beat lasts 125 ms; slow motion stretches the
 * beat but never changes the count per revolution, so the mechanism stays
 * truthful at every speed.
 */
export function beatAt(displaySeconds: number): BeatState {
  const beats = Math.max(0, displaySeconds) * CALIBRE.beatsPerSecond;
  const index = Math.floor(beats);
  const phase = beats - index;
  // cos peaks at every beat boundary: the escapement releases at the balance's
  // turning points, which is exactly where a lever escapement unlocks.
  const balanceDeg = (CALIBRE.balanceAmplitudeDeg / 2) * Math.cos(beats * Math.PI * 2);
  const eased = easeSnap(phase);
  const escapeSteps = index + eased;
  const bank: -1 | 1 = index % 2 === 0 ? -1 : 1;
  const previousBank: -1 | 1 = index % 2 === 0 ? 1 : -1;
  // The fork travels from the bank it held to the bank it just reached.
  const forkPosition = previousBank + (bank - previousBank) * eased;

  return {
    index,
    phase,
    balanceDeg,
    escapeSteps,
    escapeAngle: escapeSteps * CALIBRE.escapeStepDeg * DEG,
    bank: forkPosition >= 0 ? 1 : -1,
  };
}

/** Exact half-tooth advance as a pure count, for tests and the debug HUD. */
export function escapeStepsAt(displaySeconds: number): number {
  return Math.floor(Math.max(0, displaySeconds) * CALIBRE.beatsPerSecond);
}

/** Pallet fork rotation in radians. Positive banks clockwise on screen. */
export function forkAngle(displaySeconds: number): number {
  const beats = Math.max(0, displaySeconds) * CALIBRE.beatsPerSecond;
  const index = Math.floor(beats);
  const phase = beats - index;
  const current: -1 | 1 = index % 2 === 0 ? -1 : 1;
  const previous: -1 | 1 = index % 2 === 0 ? 1 : -1;
  const eased = easeSnap(phase);
  const position = previous + (current - previous) * eased;
  return normalizeAngle(position * -FORK_BANK_DEG * DEG);
}

/** Hairspring breathing: the inner coil turns with the balance, the outer stud does not. */
export function hairspringBreath(displaySeconds: number): number {
  return Math.cos(Math.max(0, displaySeconds) * CALIBRE.beatRateHz * Math.PI * 2);
}
