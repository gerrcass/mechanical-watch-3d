/**
 * The calibre's physical constants. Pure data: this module and its neighbours
 * are the only place a ratio, a beat or a rate may be written down.
 *
 * Angles handed to the scene follow Three.js convention (radians, positive =
 * counter-clockwise seen from the dial side). Hand angles are exposed as
 * degrees clockwise from twelve because that is how a watchmaker reads them.
 */
export const CALIBRE = {
  name: 'MW-01',
  displayName: 'Calibre MW-01',
  /** Balance frequency. 4 Hz = 8 beats per second because one beat is a half oscillation. */
  beatRateHz: 4,
  beatsPerSecond: 8,
  vph: 28_800,
  /** Full swing between the two turning points, in degrees. The balance travels ±135°. */
  balanceAmplitudeDeg: 270,
  escapeTeeth: 20,
  /** Half a tooth per beat: 360 / (20 * 2) = 9°. */
  escapeStepDeg: 9,
  beatsPerEscapeRevolution: 40,
  secondsPerEscapeRevolution: 5,
  powerReserveHours: 42,
  barrelRevolutionsPerWind: 7,
  /** The barrel turns once per six display hours, so 42 h of reserve is seven turns. */
  barrelHoursPerRevolution: 6,
  movementRadius: 15,
  /** Outside of the case band, 17.42 mm: 34.84 mm across. */
  caseRadius: 17.42,
  /** Composed moment: ten past ten, thirty-six seconds — hands clear of the balance. */
  startTimeSeconds: 10 * 3600 + 9 * 60 + 36,
  speeds: [1, 60, 600] as const,
  slowMotionFactors: [1, 0.1, 0.02] as const,
  /** One crown press winds one barrel revolution. */
  windHoursPerPress: 6,
} as const;

export type Speed = (typeof CALIBRE.speeds)[number];
export type SlowMotion = (typeof CALIBRE.slowMotionFactors)[number];

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

/** Wrap a radian angle into (-π, π] so meshes never accumulate huge rotations. */
export function normalizeAngle(angle: number): number {
  const wrapped = angle % TAU;
  return wrapped > Math.PI ? wrapped - TAU : wrapped < -Math.PI ? wrapped + TAU : wrapped;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}
