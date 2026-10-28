import { CALIBRE, TAU, normalizeAngle } from './constants';

export type TrainPart = 'barrel' | 'center' | 'third' | 'fourth' | 'escape';

/**
 * One engagement: the driver's wheel teeth mesh with the driven arbor's pinion
 * leaves. Walking these four edges from the center wheel derives every rate in
 * the train, so no module downstream may hard-code a wheel speed.
 */
export interface Engagement {
  readonly driver: TrainPart;
  readonly wheelTeeth: number;
  readonly driven: TrainPart;
  readonly pinionLeaves: number;
}

export const ENGAGEMENTS: readonly Engagement[] = [
  { driver: 'barrel', wheelTeeth: 72, driven: 'center', pinionLeaves: 12 },
  { driver: 'center', wheelTeeth: 64, driven: 'third', pinionLeaves: 8 },
  { driver: 'third', wheelTeeth: 60, driven: 'fourth', pinionLeaves: 8 },
  { driver: 'fourth', wheelTeeth: 72, driven: 'escape', pinionLeaves: 6 },
];

/** The center wheel is the reference: one turn per display hour, clockwise. */
const CENTER_REVS_PER_HOUR = 1;
/** Clockwise, i.e. the same way the hands travel, is negative rotation about +Z. */
const CENTER_DIRECTION = -1;

function derive(): {
  revsPerHour: Record<TrainPart, number>;
  direction: Record<TrainPart, 1 | -1>;
} {
  const revsPerHour = { center: CENTER_REVS_PER_HOUR } as Record<TrainPart, number>;
  const direction = { center: CENTER_DIRECTION } as Record<TrainPart, 1 | -1>;
  const queue: TrainPart[] = ['center'];

  // Breadth-first over the undirected engagement graph: each hop multiplies by
  // the tooth ratio and reverses the direction of rotation.
  while (queue.length > 0) {
    const known = queue.shift();
    if (known === undefined) break;
    for (const edge of ENGAGEMENTS) {
      if (edge.driver === known && revsPerHour[edge.driven] === undefined) {
        revsPerHour[edge.driven] = revsPerHour[known] * (edge.wheelTeeth / edge.pinionLeaves);
        direction[edge.driven] = (direction[known] * -1) as 1 | -1;
        queue.push(edge.driven);
      } else if (edge.driven === known && revsPerHour[edge.driver] === undefined) {
        revsPerHour[edge.driver] = revsPerHour[known] * (edge.pinionLeaves / edge.wheelTeeth);
        direction[edge.driver] = (direction[known] * -1) as 1 | -1;
        queue.push(edge.driver);
      }
    }
  }

  return { revsPerHour, direction };
}

const DERIVED = derive();

/** Revolutions per display hour, keyed by wheel: center 1, third 8, fourth 60, escape 720, barrel 1/6. */
export const TRAIN_REVS_PER_HOUR: Readonly<Record<TrainPart, number>> = DERIVED.revsPerHour;
export const TRAIN_DIRECTION: Readonly<Record<TrainPart, 1 | -1>> = DERIVED.direction;

/** The wheel each train part is driven by, for the inspector copy and the HUD. */
export function driverOf(part: TrainPart): TrainPart | null {
  const edge = ENGAGEMENTS.find((candidate) => candidate.driven === part);
  return edge ? edge.driver : null;
}

export function engagementFor(part: TrainPart): Engagement | undefined {
  return ENGAGEMENTS.find((edge) => edge.driven === part);
}

/**
 * Rotation of a train wheel at a moment of display time. The result is a
 * counter-clockwise-positive Three.js angle; the sign already encodes the
 * direction reversal across each mesh.
 */
export function trainAngle(part: TrainPart, displaySeconds: number): number {
  const hours = displaySeconds / 3600;
  return normalizeAngle(TRAIN_DIRECTION[part] * TAU * TRAIN_REVS_PER_HOUR[part] * hours);
}

export function trainAngles(displaySeconds: number): Record<TrainPart, number> {
  return {
    barrel: trainAngle('barrel', displaySeconds),
    center: trainAngle('center', displaySeconds),
    third: trainAngle('third', displaySeconds),
    fourth: trainAngle('fourth', displaySeconds),
    escape: trainAngle('escape', displaySeconds),
  };
}

/** Teeth counts for the inspector's technical line. */
export function trainSpec(part: TrainPart): string {
  const edge = engagementFor(part);
  if (!edge) return `${CALIBRE.name} center wheel · 1 rev/hour`;
  return `${edge.wheelTeeth} teeth driving a ${edge.pinionLeaves}-leaf pinion`;
}
