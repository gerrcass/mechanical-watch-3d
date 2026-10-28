import { describe, expect, it } from 'vitest';
import {
  CALIBRE,
  TAU,
  TRAIN_DIRECTION,
  TRAIN_REVS_PER_HOUR,
  advanceClock,
  beatAt,
  escapeStepsAt,
  forkAngle,
  hairspringBreath,
  handAngles,
  initialClock,
  motionAngles,
  MOTION_WORKS,
  normalizeAngle,
  reserveFraction,
  trainAngle,
  windClock,
} from '../../src/calibre';


const close = (actual: number, expected: number): void => expect(actual).toBeCloseTo(expected, 9);

describe('gear train ratios', () => {
  it('derives the chain from the center wheel: 1/hour, fourth 1/minute, escape 12/minute', () => {
    expect(TRAIN_REVS_PER_HOUR.center).toBeCloseTo(1, 10);
    expect(TRAIN_REVS_PER_HOUR.third).toBeCloseTo(8, 10);
    expect(TRAIN_REVS_PER_HOUR.fourth).toBeCloseTo(60, 10);
    expect(TRAIN_REVS_PER_HOUR.escape).toBeCloseTo(720, 10);
  });

  it('turns the barrel once per six hours, so a 42-hour wind is seven turns', () => {
    expect(TRAIN_REVS_PER_HOUR.barrel).toBeCloseTo(1 / 6, 10);
    expect(CALIBRE.powerReserveHours / CALIBRE.barrelHoursPerRevolution).toBe(7);
  });

  it('reverses direction at every mesh', () => {
    expect(TRAIN_DIRECTION.center).toBe(-1);
    expect(TRAIN_DIRECTION.barrel).toBe(1);
    expect(TRAIN_DIRECTION.third).toBe(1);
    expect(TRAIN_DIRECTION.fourth).toBe(-1);
    expect(TRAIN_DIRECTION.escape).toBe(1);
  });

  it('turns the fourth wheel exactly once in a display minute', () => {
    close(normalizeAngle(trainAngle('fourth', 60) - trainAngle('fourth', 0)), 0);
    // A quarter minute is a quarter turn clockwise, i.e. -π/2.
    close(trainAngle('fourth', 15), -Math.PI / 2);
    close(trainAngle('fourth', 60), 0);
  });

  it('turns the escape wheel exactly once in five display seconds', () => {
    close(normalizeAngle(trainAngle('escape', 5) - trainAngle('escape', 0)), 0);
    // Ten beats is a quarter of the 40-beat revolution: 90° counter-clockwise.
    close(trainAngle('escape', 1.25), Math.PI / 2);
  });

  it('turns the barrel once in six display hours', () => {
    close(normalizeAngle(trainAngle('barrel', 6 * 3600) - trainAngle('barrel', 0)), 0);
    close(trainAngle('barrel', 1.5 * 3600), Math.PI / 2);
  });

  it('preserves relative phase when speed changes: angles depend only on display time', () => {
    // Advancing the same display time in one big step and in many small steps
    // must land every wheel at the same angle.
    let clock = initialClock();
    for (let i = 0; i < 3600; i += 1) clock = advanceClock(clock, 1, 1, 1);
    const manySteps = TRAIN_REVS_PER_HOUR.fourth;
    close(clock.displaySeconds, 3600);
    close(normalizeAngle(trainAngle('fourth', clock.displaySeconds)), normalizeAngle(-TAU * manySteps));
    close(normalizeAngle(trainAngle('escape', clock.displaySeconds)), normalizeAngle(TAU * 720));
  });
});

describe('beat schedule', () => {
  it('runs eight beats per display second and advances half a tooth per beat', () => {
    expect(CALIBRE.beatsPerSecond).toBe(8);
    expect(CALIBRE.escapeStepDeg).toBe(9);
    expect(beatAt(0).index).toBe(0);
    expect(beatAt(1 / 8 + 1e-6).index).toBe(1);
    expect(beatAt(1).index).toBe(8);
  });

  it('returns the escape wheel to its start after 40 beats, one revolution in five seconds', () => {
    // A 20-tooth wheel stepped half a tooth per beat needs 40 beats for a full
    // turn (ticket 03's "20 beats" is an arithmetic slip: 20 × 9° = 180°).
    expect(escapeStepsAt(5)).toBe(40);
    const full = beatAt(5);
    close(normalizeAngle(full.escapeAngle), 0);
    close(normalizeAngle(full.escapeAngle - beatAt(0).escapeAngle), 0);
    expect(CALIBRE.beatsPerEscapeRevolution).toBe(40);
  });

  it('advances monotonically across a long time and never goes backwards', () => {
    let previous = 0;
    for (let i = 0; i <= 3000; i += 1) {
      const steps = escapeStepsAt(i / 100);
      expect(steps).toBeGreaterThanOrEqual(previous);
      previous = steps;
    }
    expect(previous).toBe(240);
  });

  it('keeps the balance within a 270° full swing and turns at 4 Hz', () => {
    const samples = Array.from({ length: 401 }, (_, i) => beatAt(i / 400).balanceDeg);
    expect(Math.max(...samples)).toBeCloseTo(135, 6);
    expect(Math.min(...samples)).toBeCloseTo(-135, 6);
    // One full oscillation in 250 ms.
    close(beatAt(0.25).balanceDeg, beatAt(0).balanceDeg);
  });

  it('snaps the fork between two banks, alternating on each beat', () => {
    expect(forkAngle(0.0001)).toBeLessThan(0);
    expect(forkAngle(0.125 + 0.0001)).toBeGreaterThan(0);
    expect(forkAngle(0.25 + 0.0001)).toBeLessThan(0);
    // The fork is at a bank for most of the beat and crosses quickly.
    expect(Math.abs(forkAngle(0.0001))).toBeLessThan(Math.abs(forkAngle(0.06)));
    expect(Math.abs(forkAngle(0.06))).toBeCloseTo((10 * Math.PI) / 180, 6);
  });

  it('breathes the hairspring in phase with the balance', () => {
    expect(hairspringBreath(0)).toBeCloseTo(1, 9);
    expect(hairspringBreath(0.125)).toBeCloseTo(-1, 9);
    expect(hairspringBreath(0.25)).toBeCloseTo(1, 9);
  });
});

describe('display and motion works', () => {
  it('reduces 12:1 through 36/12 and 40/10', () => {
    expect(MOTION_WORKS.reduction).toBe(12);
  });

  it('gives the hour hand 30° per hour, the minute hand 6° per minute, the second 6° per second', () => {
    const start = handAngles(CALIBRE.startTimeSeconds);
    const afterHour = handAngles(CALIBRE.startTimeSeconds + 3600);
    close(((afterHour.hour - start.hour + 360) % 360), 30);
    close(handAngles(0).minute, 0);
    close(handAngles(60).minute, 6);
    close(handAngles(60).second, 0);
    close(handAngles(30).second, 180);
    expect(handAngles(3600).hour).toBeCloseTo(30);
  });

  it('keeps the hour hand between the hours instead of snapping', () => {
    expect(handAngles(1800).hour).toBeCloseTo(15);
    expect(handAngles(12 * 3600).hour).toBeCloseTo(0);
  });

  it('wraps coherently at twelve hours', () => {
    close(handAngles(12 * 3600).hour, 0);
    close(handAngles(12 * 3600).minute, 0);
    close(handAngles(6 * 3600 + 30 * 60).hour, 195);
  });

  it('turns the minute wheel once per three hours in the opposite direction, the hour wheel once per twelve', () => {
    close(motionAngles(3 * 3600).minuteWheel, 0);
    close(motionAngles(3600).minuteWheel, (Math.PI * 2) / 3);
    close(motionAngles(12 * 3600).hourWheel, 0);
    close(motionAngles(6 * 3600).hourWheel, -Math.PI);
    close(motionAngles(900).cannon, -Math.PI / 2);
    close(motionAngles(3600).cannon, 0);
  });
});

describe('power reserve', () => {
  it('starts full, drains with display time and clamps at zero', () => {
    const full = initialClock();
    expect(full.reserveHours).toBe(42);
    const afterHour = advanceClock(full, 3600, 1, 1);
    close(afterHour.reserveHours, 41);
    const empty = advanceClock(afterHour, 41 * 3600, 1, 1);
    close(empty.reserveHours, 0);
    expect(empty.running).toBe(false);
    expect(advanceClock(empty, 10, 1, 1)).toEqual(empty);
    expect(reserveFraction(empty)).toBe(0);
  });

  it('winds add and clamp at a full wind, and restart an empty movement', () => {
    const empty = { displaySeconds: 100, reserveHours: 0, running: false };
    const wound = windClock(empty, 6);
    close(wound.reserveHours, 6);
    expect(wound.running).toBe(true);
    close(windClock(wound, 100).reserveHours, 42);
    close(windClock(initialClock(), 6).reserveHours, 42);
  });

  it('stops the train when the reserve cannot cover the requested delta', () => {
    const nearlyEmpty = { displaySeconds: 0, reserveHours: 0.5, running: true };
    const state = advanceClock(nearlyEmpty, 3600, 600, 1);
    close(state.displaySeconds, 1800);
    close(state.reserveHours, 0);
    expect(state.running).toBe(false);
  });

  it('scales slow motion without changing ratios', () => {
    const fast = advanceClock(initialClock(), 10, 1, 1);
    const slow = advanceClock(initialClock(), 10, 1, 0.1);
    close(slow.displaySeconds, fast.displaySeconds * 0.1);
    expect(slow.displaySeconds).toBeGreaterThan(0);
  });
});
