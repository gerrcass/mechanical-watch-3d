/**
 * Planar layout of Calibre MW-01 in millimetres. XY is the dial plane and +Z
 * is toward the viewer. Positions are chosen so that pitch circles actually
 * touch: every wheel is placed at the sum of its own pitch radius and the
 * driven pinion's radius, which is what keeps the drawing honest.
 */
export const MODULE = 0.12;

export interface TrainPosition {
  readonly x: number;
  readonly y: number;
  readonly pitchRadius: number;
  readonly teeth: number;
  readonly z: number;
}

const pitch = (teeth: number, module = MODULE): number => (module * teeth) / 2;

export const LAYOUT = {
  plate: { radius: 15.05, thickness: 0.55, z: -2.4 },
  center: { x: 0, y: 0, pitchRadius: pitch(64), teeth: 64, z: -0.25 },
  barrel: { x: -3.862, y: 3.243, pitchRadius: pitch(72), teeth: 72, z: 0.55 },
  third: { x: 3.74, y: 2.16, pitchRadius: pitch(60), teeth: 60, z: -0.95 },
  fourth: { x: 5.14, y: -1.67, pitchRadius: pitch(72), teeth: 72, z: -1.55 },
  escape: { x: 3.54, y: -6.07, wheelRadius: 1.9, pinionRadius: pitch(6, 0.12), z: -1.95 },
  pallet: { x: 1.37, y: -8.07, z: -1.35 },
  balance: { x: -0.4, y: -9.7, radius: 4.2, z: 1.0 },
  hairspring: { z: 1.52 },
  balanceCock: { z: 2.52 },
  motion: { cannonZ: 2.4, minuteWheel: { x: 1.61, y: -2.29, radius: 1.8, z: 2.52 }, hourWheel: { radius: 2.2, z: 2.78 } },
  bridges: { z: 3.12 },
  hands: { hourZ: 3.38, minuteZ: 3.58, secondZ: 3.34 },
  chapter: { inner: 13.15, outer: 15.1, z: 3.16 },
  case: { inner: 15.55, outer: 19.6, z: -3.2, top: 4.25 },
  crystal: { radius: 15.05, z: 4.55 },
  keyless: { z: -3.45, crownX: 21.9 },
  screws: { plateRadius: 14.2, head: 0.42 },
} as const;

/** Jewel seats on the main plate, for the lower pivots. */
export const PLATE_JEWELS: ReadonlyArray<readonly [number, number]> = [
  [LAYOUT.center.x, LAYOUT.center.y],
  [LAYOUT.barrel.x, LAYOUT.barrel.y],
  [LAYOUT.third.x, LAYOUT.third.y],
  [LAYOUT.fourth.x, LAYOUT.fourth.y],
  [LAYOUT.escape.x, LAYOUT.escape.y],
  [LAYOUT.balance.x, LAYOUT.balance.y],
  [LAYOUT.motion.minuteWheel.x, LAYOUT.motion.minuteWheel.y],
];

export const PALETTE = {
  obsidian: 0x07080a,
  champagne: 0xc9ab74,
  ivory: 0xefe6d4,
  rhodium: 0xd3d8dd,
  ruby: 0x9c1029,
} as const;
