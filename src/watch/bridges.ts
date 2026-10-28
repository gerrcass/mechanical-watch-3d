import { BoxGeometry, Path, Shape, Vector2 } from 'three';
import { extrudeShape, latheAlongZ, ringShape } from '../core/geometry';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';

interface BridgeSpec {
  readonly id: string;
  /** A milled plate outline, straight edges with softened corners. */
  readonly outline?: ReadonlyArray<readonly [number, number]>;
  /** A variable-width arm, for cocks. */
  readonly arm?: ReadonlyArray<readonly [number, number]>;
  readonly widths?: readonly number[];
  /** Boss centres: the upper pivots this bridge carries. */
  readonly bosses: ReadonlyArray<readonly [number, number]>;
  /** Screw seats at the feet. */
  readonly screws: ReadonlyArray<readonly [number, number]>;
  /** Lightening holes, so the plate shows through the bridge. */
  readonly holes?: ReadonlyArray<readonly [number, number, number]>;
  readonly z: number;
  readonly thickness?: number;
  readonly finish?: 'bridgeSatine' | 'polishedSteel';
}

/**
 * A milled bridge outline. Straight segments and softened corners read as a
 * machined plate; splines read as a ribbon. The difference matters at the
 * scale of a 30 mm movement.
 */
function plateShape(points: ReadonlyArray<readonly [number, number]>, corner = 0.55): Shape {
  const shape = new Shape();
  const count = points.length;
  const at = (index: number): Vector2 => {
    const point = points[(index + count) % count] as readonly [number, number];
    return new Vector2(point[0], point[1]);
  };
  const start = at(0);
  const next = at(1);
  shape.moveTo((start.x + next.x) / 2, (start.y + next.y) / 2);
  for (let index = 1; index <= count; index += 1) {
    const previous = at(index - 1);
    const current = at(index);
    const following = at(index + 1);
    const inDir = new Vector2(current.x - previous.x, current.y - previous.y).normalize();
    const outDir = new Vector2(following.x - current.x, following.y - current.y).normalize();
    const before = current.clone().addScaledVector(inDir, -corner);
    const after = current.clone().addScaledVector(outDir, corner);
    shape.lineTo(before.x, before.y);
    shape.quadraticCurveTo(current.x, current.y, after.x, after.y);
  }
  shape.closePath();
  return shape;
}

/** A straight-edged, tapered arm with a flat machined end. */
function armShape(points: ReadonlyArray<readonly [number, number]>, widths: readonly number[]): Shape {
  const left: Vector2[] = [];
  const right: Vector2[] = [];
  const count = points.length;
  for (let index = 0; index < count; index += 1) {
    const point = points[index] as readonly [number, number];
    const previous = points[Math.max(0, index - 1)] as readonly [number, number];
    const following = points[Math.min(count - 1, index + 1)] as readonly [number, number];
    const dx = following[0] - previous[0];
    const dy = following[1] - previous[1];
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const half = (widths[index] ?? widths[widths.length - 1] ?? 1.2) / 2;
    left.push(new Vector2(point[0] + nx * half, point[1] + ny * half));
    right.push(new Vector2(point[0] - nx * half, point[1] - ny * half));
  }
  const shape = new Shape();
  shape.moveTo(left[0]!.x, left[0]!.y);
  for (let index = 1; index < left.length; index += 1) shape.lineTo(left[index]!.x, left[index]!.y);
  for (let index = right.length - 1; index >= 0; index -= 1) shape.lineTo(right[index]!.x, right[index]!.y);
  shape.closePath();
  return shape;
}

/**
 * A bridge is a shaped plate: a grained cap, a polished anglage edge, a jewel
 * in a gold chaton over every pivot it carries, and a blued screw at every
 * foot. The silhouette follows the load path so it reads as machined.
 */
function addBridge(ctx: WatchContext, spec: BridgeSpec): void {
  const build = ctx.part(spec.id, {
    x: spec.outline?.[0]?.[0] ?? spec.arm?.[0]?.[0] ?? 0,
    y: spec.outline?.[0]?.[1] ?? spec.arm?.[0]?.[1] ?? 0,
    z: spec.z,
  });
  const thickness = spec.thickness ?? 0.3;
  const shape = spec.arm ? armShape(spec.arm, spec.widths ?? []) : plateShape(spec.outline ?? []);
  for (const [x, y, radius] of spec.holes ?? []) {
    const hole = new Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const plate = build.mesh(
    extrudeShape(shape, {
      depth: thickness,
      bevelSize: 0.12,
      bevelThickness: 0.1,
      bevelSegments: 2,
      curveSegments: 24,
    }),
    [spec.finish ?? 'bridgeSatine', 'anglage'],
  );
  plate.position.z = spec.z;

  for (const [x, y] of spec.bosses) {
    const ring = build.mesh(
      extrudeShape(ringShape(0.8, 0.4), {
        depth: thickness + 0.1,
        bevelSize: 0.07,
        bevelThickness: 0.06,
        bevelSegments: 2,
        curveSegments: 48,
      }),
      ['bridgeSatine', 'anglage'],
    );
    ring.position.set(x, y, spec.z + 0.005);
    const chaton = build.mesh(
      latheAlongZ(
        [
          new Vector2(0.34, 0.07),
          new Vector2(0.5, 0.07),
          new Vector2(0.56, 0.025),
          new Vector2(0.56, -0.025),
          new Vector2(0.42, -0.025),
          new Vector2(0.34, 0.015),
        ],
        40,
      ),
      'gold',
    );
    chaton.position.set(x, y, spec.z + thickness / 2 + 0.07);
    const jewel = ctx.part('jewels', { x, y, z: spec.z }).mesh(
      latheAlongZ(
        [
          new Vector2(0, 0.075),
          new Vector2(0.19, 0.075),
          new Vector2(0.26, 0.03),
          new Vector2(0.24, -0.03),
          new Vector2(0, -0.045),
        ],
        28,
      ),
      'ruby',
    );
    jewel.position.set(x, y, spec.z + thickness / 2 + 0.12);
  }

  for (const [x, y] of spec.screws) {
    // A small raised foot pad, so the bridge terminates in a machined foot.
    const foot = build.mesh(
      extrudeShape(ringShape(0.66, 0.04), {
        depth: thickness + 0.08,
        bevelSize: 0.06,
        bevelThickness: 0.05,
        bevelSegments: 2,
        curveSegments: 40,
      }),
      ['bridgeSatine', 'anglage'],
    );
    foot.position.set(x, y, spec.z + 0.005);
    addBluedScrew(ctx, x, y, spec.z + thickness / 2 + 0.1);
  }
}

function addBluedScrew(ctx: WatchContext, x: number, y: number, z: number): void {
  const build = ctx.part('screws', { x, y, z });
  const head = build.mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.075),
        new Vector2(0.21, 0.075),
        new Vector2(0.32, 0.035),
        new Vector2(0.38, -0.02),
        new Vector2(0.38, -0.065),
        new Vector2(0.31, -0.09),
        new Vector2(0, -0.09),
      ],
      28,
    ),
    'blued',
  );
  head.position.set(x, y, z);
  const slot = build.mesh(new BoxGeometry(0.46, 0.085, 0.026), 'matteBlack');
  slot.position.set(x, y, z + 0.06);
  slot.rotation.z = 0.6;
}

/**
 * Bridges and cocks, each anchored inside the case so nothing floats. The
 * barrel is left open so the mainspring stays visible; the train bridge is a
 * milled plate with real lightening holes; the balance cock is a straight arm.
 */
export function buildBridges(ctx: WatchContext): void {
  // The barrel bridge sits above the drum and the ratchet, not above the
  // hands. The train bridge sits just above the wheels, under the motion
  // works. This is the layer order of a real movement.
  addBridge(ctx, {
    id: 'barrel-bridge',
    arm: [
      [-10.9, 5.9],
      [-9.2, 5.4],
      [-7.3, 4.6],
      [-5.4, 3.75],
      [LAYOUT.barrel.x, LAYOUT.barrel.y],
    ],
    widths: [1.3, 1.15, 1.0, 0.9, 1.2],
    bosses: [[LAYOUT.barrel.x, LAYOUT.barrel.y]],
    screws: [[-10.4, 5.6]],
    z: 2.35,
  });

  addBridge(ctx, {
    id: 'center-bridge',
    arm: [
      [10.1, 6.7],
      [8.5, 5.6],
      [6.1, 4.0],
      [3.3, 2.1],
      [0, 0],
    ],
    widths: [1.1, 0.95, 0.85, 0.8, 1.0],
    bosses: [[0, 0]],
    screws: [[9.6, 6.2]],
    z: LAYOUT.bridges.z + 0.05,
    finish: 'polishedSteel',
  });

  addBridge(ctx, {
    id: 'train-bridge',
    arm: [
      [11.7, 3.55],
      [10.0, 3.0],
      [8.2, 2.4],
      [6.4, 2.1],
      [LAYOUT.third.x, LAYOUT.third.y],
    ],
    widths: [1.5, 1.25, 1.05, 0.9, 1.15],
    bosses: [[LAYOUT.third.x, LAYOUT.third.y]],
    screws: [[11.1, 3.35]],
    z: LAYOUT.bridges.z,
  });

  addBridge(ctx, {
    id: 'train-bridge',
    arm: [
      [LAYOUT.third.x, LAYOUT.third.y],
      [4.5, 1.2],
      [4.7, -0.4],
      [LAYOUT.fourth.x, LAYOUT.fourth.y],
    ],
    widths: [1.1, 0.95, 0.9, 1.05],
    bosses: [[LAYOUT.fourth.x, LAYOUT.fourth.y]],
    screws: [],
    z: LAYOUT.bridges.z,
    thickness: 0.28,
  });

  // A third arm carries the escape-wheel upper pivot.
  addBridge(ctx, {
    id: 'train-bridge',
    arm: [
      [LAYOUT.fourth.x, LAYOUT.fourth.y],
      [4.35, -2.7],
      [3.95, -4.2],
      [LAYOUT.escape.x, LAYOUT.escape.y],
    ],
    widths: [1.05, 0.95, 0.85, 1.0],
    bosses: [[LAYOUT.escape.x, LAYOUT.escape.y]],
    screws: [],
    z: LAYOUT.bridges.z,
    thickness: 0.26,
  });

  addBridge(ctx, {
    id: 'train-bridge',
    arm: [
      [11.3, -4.6],
      [9.5, -5.3],
      [7.3, -6.1],
      [5.2, -7.0],
      [LAYOUT.pallet.x, LAYOUT.pallet.y],
    ],
    widths: [1.2, 1.05, 0.95, 0.85, 1.0],
    bosses: [[LAYOUT.pallet.x, LAYOUT.pallet.y]],
    screws: [[10.8, -4.4]],
    z: -1.5,
    thickness: 0.26,
  });

  // Balance cock: a straight-edged cantilever from seven o'clock over the
  // balance, carrying the shock setting. The balance rim stays visible.
  addBridge(ctx, {
    id: 'balance-cock',
    arm: [
      [-10.5, -6.0],
      [-8.9, -6.7],
      [-6.6, -7.2],
      [-4.0, -7.5],
      [LAYOUT.balance.x, LAYOUT.balance.y],
    ],
    widths: [1.3, 1.15, 1.0, 0.9, 1.2],
    bosses: [[LAYOUT.balance.x, LAYOUT.balance.y]],
    screws: [[-10.1, -5.8]],
    z: LAYOUT.balanceCock.z,
    thickness: 0.34,
    finish: 'polishedSteel',
  });

  // Regulator: a small steel lever with two curb pins on the hairspring.
  const cockBuild = ctx.part('balance-cock');
  const regulator = cockBuild.mesh(
    extrudeShape(
      armShape(
        [
          [LAYOUT.balance.x + 1.9, LAYOUT.balance.y + 1.15],
          [LAYOUT.balance.x + 0.5, LAYOUT.balance.y + 1.8],
          [LAYOUT.balance.x - 0.8, LAYOUT.balance.y + 1.65],
        ],
        [0.42, 0.32, 0.24],
      ),
      { depth: 0.09, bevelSize: 0.028, bevelThickness: 0.02, curveSegments: 12 },
    ),
    'polishedSteel',
  );
  regulator.position.z = LAYOUT.balanceCock.z + 0.24;

  // A thin movement-holder ring connects the plate to the case, and reads as
  // a dark line between the movement and the polished bezel.
  const holderBuild = ctx.part('main-plate');
  const holder = holderBuild.mesh(
    latheAlongZ(
      [
        new Vector2(15.1, 2.75),
        new Vector2(15.55, 2.75),
        new Vector2(15.55, -2.75),
        new Vector2(15.1, -2.75),
        new Vector2(15.1, 2.75),
      ],
      96,
    ),
    'darkMetal',
  );
  holder.position.z = 0;
}
