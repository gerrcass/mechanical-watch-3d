import { CALIBRE, TAU, clamp, normalizeAngle } from './constants';

export interface ClockState {
  /** Display seconds since the composed 10:09:36 moment. */
  displaySeconds: number;
  reserveHours: number;
  running: boolean;
}

export type SpeedSelection = (typeof CALIBRE.speeds)[number];
export type SlowMotionSelection = (typeof CALIBRE.slowMotionFactors)[number];

export function initialClock(): ClockState {
  return { displaySeconds: 0, reserveHours: CALIBRE.powerReserveHours, running: true };
}

/**
 * Advance the exhibit by a wall-clock delta. The display clock is the only
 * accumulator; the escapement and train read from it, so changing speed or
 * slow motion can never break their relative phase.
 */
export function advanceClock(
  state: ClockState,
  realDeltaSeconds: number,
  speed: SpeedSelection,
  slowMotion: SlowMotionSelection,
): ClockState {
  if (!state.running || state.reserveHours <= 0) return state;
  const requested = Math.max(0, realDeltaSeconds) * speed * slowMotion;
  // The mainspring can only give what it holds.
  const available = state.reserveHours * 3600;
  const displayDelta = Math.min(requested, available);
  const reserveHours = clamp(state.reserveHours - displayDelta / 3600, 0, CALIBRE.powerReserveHours);
  return {
    displaySeconds: state.displaySeconds + displayDelta,
    reserveHours,
    running: reserveHours > 0,
  };
}

/** Add hours of running time from a winding action, clamped at a full wind. */
export function windClock(state: ClockState, hours: number = CALIBRE.windHoursPerPress): ClockState {
  const reserveHours = clamp(state.reserveHours + hours, 0, CALIBRE.powerReserveHours);
  return { ...state, reserveHours, running: reserveHours > 0 };
}

export function reserveFraction(state: ClockState): number {
  return clamp(state.reserveHours / CALIBRE.powerReserveHours, 0, 1);
}

export interface HandAngles {
  /** Degrees clockwise from twelve, 0–360. */
  hour: number;
  minute: number;
  second: number;
}

/**
 * Hand positions at an absolute display time. 30° per hour, 6° per minute,
 * 6° per second — the hour hand keeps its fraction of the hour so the pair
 * stays coherent across the 12-hour wrap.
 */
export function handAngles(absoluteSeconds: number): HandAngles {
  const seconds = ((absoluteSeconds % 43_200) + 43_200) % 43_200;
  const minuteAngle = (seconds / 60) * 6;
  const hourAngle = (seconds / 3600) * 30;
  return {
    hour: ((hourAngle % 360) + 360) % 360,
    minute: ((minuteAngle % 360) + 360) % 360,
    second: ((seconds % 60) * 6) % 360,
  };
}

/** Rotation about +Z for a clockwise-read hand angle. */
export function handRotation(degreesClockwise: number): number {
  return normalizeAngle((-degreesClockwise * Math.PI) / 180);
}

export interface CivilTime {
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
}

export function civilTime(absoluteSeconds: number): CivilTime {
  const total = ((Math.floor(absoluteSeconds) % 86_400) + 86_400) % 86_400;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number): string => value.toString().padStart(2, '0');
  return { hours, minutes, seconds, label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
}

/** Clock time shown by the hands, composed moment included. */
export function watchTime(displaySeconds: number): CivilTime {
  return civilTime(CALIBRE.startTimeSeconds + displaySeconds);
}

/** The barrel's state of wind is visible as coil tightness; 0–1 supports the shader. */
export function mainspringTension(reserveHours: number): number {
  return clamp(reserveHours / CALIBRE.powerReserveHours, 0, 1);
}

/**
 * Motion works: cannon pinion 12T drives the minute wheel 36T (3:1), whose
 * 10-leaf pinion drives the 40-tooth hour wheel (4:1). Combined, 12:1.
 * The cannon pinion and hour wheel turn clockwise; the minute wheel reverses.
 */
export const MOTION_WORKS = {
  cannonTeeth: 12,
  minuteWheelTeeth: 36,
  minutePinionLeaves: 10,
  hourWheelTeeth: 40,
  reduction: (36 / 12) * (40 / 10),
} as const;

export function motionAngles(displaySeconds: number): {
  cannon: number;
  minuteWheel: number;
  hourWheel: number;
} {
  const hours = displaySeconds / 3600;
  return {
    // Cannon pinion is fixed to the center wheel: one turn per hour, clockwise.
    cannon: normalizeAngle(-TAU * hours),
    // Three hours per turn in the opposite direction.
    minuteWheel: normalizeAngle((TAU * hours) / 3),
    // Twelve hours per turn, clockwise again.
    hourWheel: normalizeAngle((-TAU * hours) / 12),
  };
}
