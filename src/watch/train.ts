import { Group, Vector2 } from 'three';
import {
  extrudeShape,
  gearShape,
  latheAlongZ,
  pinionShape,
  spiralRibbonGeometry,
  type ToothStyle,
} from '../core/geometry';
import { CALIBRE, clamp, trainAngle, type TrainPart } from '../calibre';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';
import type { FinishName } from '../core/materials';

interface WheelSpec {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly teeth: number;
  readonly module: number;
  readonly spokes: number;
  readonly thickness?: number;
  readonly toothStyle?: ToothStyle;
  readonly face?: FinishName;
  readonly bore?: number;
  readonly drive?: TrainPart;
  readonly pinion?: { leaves: number; module: number; z: number; height?: number };
  readonly arbor?: { top: number; bottom: number; radius?: number };
}

/** A wheel with its pinion and arbor: one catalogue part, three machined pieces. */
export function addWheel(ctx: WatchContext, spec: WheelSpec): Group {
  const bore = spec.bore ?? 0.22;
  const build = ctx.part(spec.id, { x: spec.x, y: spec.y, z: spec.z });
  const pivot = new Group();
  pivot.position.set(spec.x, spec.y, spec.z);
  build.add(pivot);

  const shape = gearShape({
    teeth: spec.teeth,
    module: spec.module,
    boreRadius: bore,
    spokes: spec.spokes,
    pierced: 1,
    toothStyle: spec.toothStyle,
  });
  const geometry = extrudeShape(shape, {
    depth: spec.thickness ?? 0.26,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    bevelSegments: 1,
    curveSegments: 18,
  });
  const wheel = build.mesh(geometry, [spec.face ?? 'wheelFace', 'anglage']);
  pivot.add(wheel);

  if (spec.pinion) {
    const pinionGeometry = extrudeShape(pinionShape(spec.pinion.leaves, spec.pinion.module), {
      depth: spec.pinion.height ?? 0.62,
      bevelSize: 0.018,
      bevelThickness: 0.016,
      bevelSegments: 1,
      curveSegments: 12,
    });
    const pinion = build.mesh(pinionGeometry, 'polishedSteel');
    pinion.position.z = spec.pinion.z - spec.z;
    pivot.add(pinion);
  }

  if (spec.arbor) {
    const radius = spec.arbor.radius ?? 0.16;
    const top = spec.arbor.top - spec.z;
    const bottom = spec.arbor.bottom - spec.z;
    const arbor = build.mesh(
      latheAlongZ(
        [
          new Vector2(0, top),
          new Vector2(radius * 0.6, top - 0.02),
          new Vector2(radius, top - 0.14),
          new Vector2(radius, bottom + 0.14),
          new Vector2(radius * 0.6, bottom + 0.02),
          new Vector2(0, bottom),
        ],
        20,
      ),
      'polishedSteel',
    );
    pivot.add(arbor);
  }

  if (spec.drive) {
    const drive = spec.drive;
    ctx.onUpdate((seconds) => {
      pivot.rotation.z = trainAngle(drive, seconds);
    });
  }

  return pivot;
}

/**
 * The barrel is a drum with an open top so the mainspring can be seen: the
 * exhibit's argument is that the energy is visible, not described.
 */
function buildBarrel(ctx: WatchContext): void {
  const build = ctx.part('barrel', { x: LAYOUT.barrel.x, y: LAYOUT.barrel.y, z: LAYOUT.barrel.z });
  const wheelZ = 0.2;
  const drumOuter = 3.62;
  const drumInner = 3.4;
  const drumTop = 1.98;

  const pivot = new Group();
  pivot.position.set(LAYOUT.barrel.x, LAYOUT.barrel.y, 0);
  build.add(pivot);

  const wheel = build.mesh(
    extrudeShape(gearShape({ teeth: 72, module: 0.12, boreRadius: 0.44, spokes: 0, pierced: 0 }), {
      depth: 0.3,
      bevelSize: 0.06,
      bevelThickness: 0.05,
      bevelSegments: 2,
      curveSegments: 30,
    }),
    ['wheelFace', 'anglage'],
  );
  wheel.position.z = wheelZ;
  pivot.add(wheel);

  // One closed profile: inner wall, floor, outer wall. Lathe closes the drum.
  const drum = build.mesh(
    latheAlongZ(
      [
        new Vector2(drumInner, drumTop),
        new Vector2(drumInner, 0.34),
        new Vector2(drumInner - 0.5, 0.34),
        new Vector2(drumInner - 0.5, wheelZ + 0.16),
        new Vector2(drumOuter, wheelZ + 0.06),
        new Vector2(drumOuter, drumTop - 0.04),
        new Vector2(drumInner, drumTop),
      ],
      72,
    ),
    'gold',
  );
  pivot.add(drum);

  // Mainspring: a flat spiral ribbon. It tightens toward the arbor as wound.
  const springGroup = new Group();
  springGroup.position.set(LAYOUT.barrel.x, LAYOUT.barrel.y, 0);
  const spring = ctx.part('mainspring', { x: LAYOUT.barrel.x, y: LAYOUT.barrel.y, z: 1.2 }).mesh(
    spiralRibbonGeometry({
      innerRadius: 0.66,
      outerRadius: drumInner - 0.08,
      turns: 7,
      width: 0.09,
      z: 1.2,
      segments: 520,
    }),
    'blued',
  );
  springGroup.add(spring);
  build.add(springGroup);

  // The arbor is its own catalogue entry: it is what winding turns.
  const arbor = ctx.part('barrel-arbor', { x: LAYOUT.barrel.x, y: LAYOUT.barrel.y, z: 1.4 }).mesh(
    latheAlongZ(
      [
        new Vector2(0, 2.3),
        new Vector2(0.28, 2.3),
        new Vector2(0.4, 2.16),
        new Vector2(0.4, 1.94),
        new Vector2(0.3, 1.9),
        new Vector2(0.3, -2.42),
        new Vector2(0.36, -2.48),
        new Vector2(0, -2.52),
      ],
      28,
    ),
    'polishedSteel',
  );
  arbor.position.set(LAYOUT.barrel.x, LAYOUT.barrel.y, 0);

  ctx.onUpdate((seconds, reserveHours) => {
    const tension = clamp(reserveHours / CALIBRE.powerReserveHours, 0, 1);
    const scale = 0.9 + 0.1 * (1 - tension);
    springGroup.scale.set(scale, scale, 1);
    const barrelAngle = trainAngle('barrel', seconds);
    springGroup.rotation.z = barrelAngle + (1 - tension) * 0.55;
    pivot.rotation.z = barrelAngle;
  });
}

export function buildTrain(ctx: WatchContext): void {
  buildBarrel(ctx);

  addWheel(ctx, {
    id: 'center-wheel',
    x: LAYOUT.center.x,
    y: LAYOUT.center.y,
    z: LAYOUT.center.z,
    teeth: 64,
    module: 0.12,
    spokes: 5,
    drive: 'center',
    pinion: { leaves: 12, module: 0.12, z: 0.55 },
    arbor: { top: 3.72, bottom: -2.52 },
  });

  addWheel(ctx, {
    id: 'third-wheel',
    x: LAYOUT.third.x,
    y: LAYOUT.third.y,
    z: LAYOUT.third.z,
    teeth: 60,
    module: 0.12,
    spokes: 5,
    drive: 'third',
    pinion: { leaves: 8, module: 0.12, z: -0.25, height: 0.66 },
    arbor: { top: 0.1, bottom: -2.52 },
  });

  addWheel(ctx, {
    id: 'fourth-wheel',
    x: LAYOUT.fourth.x,
    y: LAYOUT.fourth.y,
    z: LAYOUT.fourth.z,
    teeth: 72,
    module: 0.12,
    spokes: 6,
    drive: 'fourth',
    pinion: { leaves: 8, module: 0.12, z: -0.95, height: 0.66 },
    arbor: { top: 3.42, bottom: -2.52 },
  });

  // The escape wheel is released by the escapement, not driven by the train
  // clock; escapement.ts owns its rotation.
  addWheel(ctx, {
    id: 'escape-wheel',
    x: LAYOUT.escape.x,
    y: LAYOUT.escape.y,
    z: LAYOUT.escape.z,
    teeth: CALIBRE.escapeTeeth,
    module: 0.19,
    spokes: 4,
    thickness: 0.2,
    toothStyle: 'escape',
    pinion: { leaves: 6, module: 0.12, z: -1.55, height: 0.5 },
    arbor: { top: -1.1, bottom: -2.52 },
  });

  // A polished hub cap where the hands stack.
  const center = ctx.part('center-wheel');
  center.mesh(
    latheAlongZ(
      [
        new Vector2(0, 3.5),
        new Vector2(0.36, 3.48),
        new Vector2(0.46, 3.4),
        new Vector2(0.46, 3.32),
        new Vector2(0, 3.32),
      ],
      28,
    ),
    'polishedSteel',
  );
}
