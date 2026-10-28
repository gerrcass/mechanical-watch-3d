/** Camera poses use watch space: millimetres, XY is the dial plane, +Z is toward the viewer. */
export interface CameraPose {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export interface TourStop {
  readonly id: 'power' | 'transmission' | 'regulation' | 'display' | 'winding' | 'assembly';
  readonly title: string;
  readonly narration: string;
  readonly partId: string;
  readonly pose: CameraPose;
  readonly explosion: number;
}

/**
 * Six stops in the order energy travels: spring, train, escapement, display,
 * winding, then the whole assembly. Copy is short enough to read while the
 * camera is still moving.
 */
export const TOUR_STOPS: readonly TourStop[] = [
  {
    id: 'power',
    title: '01 · Power',
    narration:
      'Everything starts in the barrel. A coiled steel spring pushes outward against the drum, and the drum’s 72 teeth are the only way that energy can leave.',
    partId: 'barrel',
    pose: { position: [-12, -14, 34], target: [-4.2, 3.1, 0.8] },
    explosion: 0,
  },
  {
    id: 'transmission',
    title: '02 · Transmission',
    narration:
      'Four wheels and pinions trade speed for torque. The center wheel turns once an hour; the fourth wheel, three meshes later, turns once a minute.',
    partId: 'center-wheel',
    pose: { position: [22, -26, 62], target: [1.4, -0.4, 0.4] },
    explosion: 0.08,
  },
  {
    id: 'regulation',
    title: '03 · Regulation',
    narration:
      'The escape wheel wants to run; the pallet fork lets it go one half-tooth at a time. Each release is a beat, and the balance sets the rhythm at four hertz.',
    partId: 'balance-wheel',
    pose: { position: [12, -24, 36], target: [0.5, -7.6, 1.2] },
    explosion: 0,
  },
  {
    id: 'display',
    title: '04 · Display',
    narration:
      'The motion works turn one revolution per hour into one per twelve. The cannon pinion carries the minute hand, the hour wheel the hour hand.',
    partId: 'minute-hand',
    pose: { position: [-10, -24, 82], target: [0, -1, 2.2] },
    explosion: 0.05,
  },
  {
    id: 'winding',
    title: '05 · Winding',
    narration:
      'Turn the crown and the stem drives a crown wheel, which drives the ratchet on the barrel arbor. The click holds what you have wound.',
    partId: 'crown',
    pose: { position: [44, 4, 48], target: [10.5, 0.6, 0.2] },
    explosion: 0.45,
  },
  {
    id: 'assembly',
    title: '06 · Assembly',
    narration:
      'Seen apart, the movement is a stack: keyless works at the back, plate and train, escapement, motion works, bridges, hands, chapter ring, case. This is how it goes together.',
    partId: 'main-plate',
    pose: { position: [36, -48, 118], target: [2, -2.4, 3] },
    explosion: 0.92,
  },
];

export interface TourState {
  readonly active: boolean;
  readonly index: number;
}

export const TOUR_IDLE: TourState = { active: false, index: 0 };

export function startTour(): TourState {
  return { active: true, index: 0 };
}

export function nextStop(state: TourState): TourState {
  if (!state.active) return state;
  return { active: true, index: Math.min(state.index + 1, TOUR_STOPS.length - 1) };
}

export function previousStop(state: TourState): TourState {
  if (!state.active) return state;
  return { active: true, index: Math.max(state.index - 1, 0) };
}

export function skipTour(state: TourState): TourState {
  return { active: false, index: state.index };
}

export function currentStop(state: TourState): TourStop | null {
  if (!state.active) return null;
  return TOUR_STOPS[state.index] ?? null;
}
