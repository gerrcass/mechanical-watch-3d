import { BoxGeometry, Path, Vector2 } from 'three';
import { extrudeShape, latheAlongZ, ribbonShape, ringShape } from '../core/geometry';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';

interface BridgeSpec {
  readonly id: string;
  readonly points: ReadonlyArray<readonly [number, number]>;
  readonly widths: readonly number[];
  /** Boss centres: the upper pivots this bridge carries. */
  readonly bosses: ReadonlyArray<readonly [number, number]>;
  /** Screw seats at the feet. */
  readonly screws: ReadonlyArray<readonly [number, number]>;
  /** Lightening holes, so the plate shows through the bridge. */
  readonly holes?: ReadonlyArray<readonly [number, number, number]>;
  readonly z: number;
  readonly thickness?: number;
}

/**
 * A bridge is a shaped plate: a grained cap, a polished anglage edge, a jewel
 * in a gold chaton over every pivot it carries, and a blued screw at every
 * foot. The silhouette comes from the load path, so it reads as machined.
 */
function addBridge(ctx: WatchContext, spec: BridgeSpec): void {
  const build = ctx.part(spec.id, {
    x: spec.points[0]?.[0] ?? 0,
    y: spec.points[0]?.[1] ?? 0,
    z: spec.z,
  });
  const thickness = spec.thickness ?? 0.34;
  const shape = ribbonShape(
    spec.points.map(([x, y]) => new Vector2(x, y)),
    [...spec.widths],
  );
  for (const [x, y, radius] of spec.holes ?? []) {
    const hole = new Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const plate = build.mesh(
    extrudeShape(shape, {
      depth: thickness,
      bevelSize: 0.14,
      bevelThickness: 0.12,
      bevelSegments: 2,
      curveSegments: 24,
    }),
    ['bridgeSatine', 'anglage'],
  );
  plate.position.z = spec.z;

  for (const [x, y] of spec.bosses) {
    const ring = build.mesh(
      extrudeShape(ringShape(1.42, 0.5), {
        depth: thickness + 0.14,
        bevelSize: 0.1,
        bevelThickness: 0.08,
        bevelSegments: 2,
        curveSegments: 48,
      }),
      ['bridgeSatine', 'anglage'],
    );
    ring.position.set(x, y, spec.z + 0.01);
    const chaton = build.mesh(
      latheAlongZ(
        [
          new Vector2(0.44, 0.08),
          new Vector2(0.7, 0.08),
          new Vector2(0.78, 0.03),
          new Vector2(0.78, -0.03),
          new Vector2(0.58, -0.03),
          new Vector2(0.44, 0.02),
        ],
        32,
      ),
      'gold',
    );
    chaton.position.set(x, y, spec.z + thickness / 2 + 0.1);
    const jewel = ctx.part('jewels', { x, y, z: spec.z }).mesh(
      latheAlongZ(
        [
          new Vector2(0, 0.1),
          new Vector2(0.24, 0.1),
          new Vector2(0.34, 0.04),
          new Vector2(0.32, -0.04),
          new Vector2(0, -0.06),
        ],
        24,
      ),
      'ruby',
    );
    jewel.position.set(x, y, spec.z + thickness / 2 + 0.16);
  }

  for (const [x, y] of spec.screws) {
    // A raised foot pad under the screw, so the bridge terminates in a foot
    // rather than a square-cut ribbon end.
    const foot = build.mesh(
      extrudeShape(ringShape(1.3, 0.05), {
        depth: thickness + 0.1,
        bevelSize: 0.08,
        bevelThickness: 0.07,
        bevelSegments: 2,
        curveSegments: 40,
      }),
      ['bridgeSatine', 'anglage'],
    );
    foot.position.set(x, y, spec.z + 0.005);
    addBluedScrew(ctx, x, y, spec.z + thickness / 2 + 0.12);
  }
}

function addBluedScrew(ctx: WatchContext, x: number, y: number, z: number): void {
  const build = ctx.part('screws', { x, y, z });
  const head = build.mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.09),
        new Vector2(0.26, 0.09),
        new Vector2(0.4, 0.045),
        new Vector2(0.48, -0.02),
        new Vector2(0.48, -0.08),
        new Vector2(0.4, -0.11),
        new Vector2(0, -0.11),
      ],
      28,
    ),
    'blued',
  );
  head.position.set(x, y, z);
  const slot = build.mesh(new BoxGeometry(0.58, 0.11, 0.03), 'matteBlack');
  slot.position.set(x, y, z + 0.075);
  slot.rotation.z = 0.6;
}

/**
 * Bridges, each anchored inside the chapter ring so the sapphire ring is not
 * lifted off the movement. Bosses sit over the arbors they carry.
 */
export function buildBridges(ctx: WatchContext): void {
  addBridge(ctx, {
    id: 'barrel-bridge',
    points: [
      [-11.2, 3.9],
      [-9.4, 4.9],
      [-7.2, 5.2],
      [-5.5, 4.6],
      [LAYOUT.barrel.x, LAYOUT.barrel.y],
    ],
    widths: [1.7, 1.5, 1.3, 1.2, 1.2],
    bosses: [[LAYOUT.barrel.x, LAYOUT.barrel.y]],
    screws: [
      [-10.9, 4.2],
      [-8.2, 5.0],
    ],
    holes: [],
    z: LAYOUT.bridges.z - 0.22,
  });

  addBridge(ctx, {
    id: 'center-bridge',
    points: [
      [10.2, 7.0],
      [8.2, 6.0],
      [6.0, 4.0],
      [3.4, 2.2],
      [0, 0],
    ],
    widths: [1.6, 1.4, 1.2, 1.1, 1.2],
    bosses: [[0, 0]],
    screws: [[9.2, 6.6]],
    holes: [],
    z: LAYOUT.bridges.z - 0.22,
  });

  addBridge(ctx, {
    id: 'train-bridge',
    points: [
      [11.0, -5.2],
      [9.4, -3.9],
      [7.2, -2.9],
      [5.6, -2.0],
      [LAYOUT.fourth.x, LAYOUT.fourth.y],
      [4.4, 0.2],
      [LAYOUT.third.x, LAYOUT.third.y],
    ],
    widths: [1.6, 1.5, 1.3, 1.2, 1.2, 1.1, 1.2],
    bosses: [
      [LAYOUT.third.x, LAYOUT.third.y],
      [LAYOUT.fourth.x, LAYOUT.fourth.y],
    ],
    screws: [
      [10.2, -4.9],
      [6.6, -3.0],
    ],
    holes: [],
    z: LAYOUT.bridges.z - 0.22,
  });

  // Balance cock: a cantilever from the rim at six o'clock over the balance.
  const cockBuild = ctx.part('balance-cock', { x: 0, y: -12.4, z: LAYOUT.balanceCock.z });
  const cockShape = ribbonShape(
    [
      new Vector2(0.1, -12.7),
      new Vector2(0.2, -11.6),
      new Vector2(-0.1, -10.6),
      new Vector2(LAYOUT.balance.x, LAYOUT.balance.y),
    ],
    [1.7, 1.4, 1.2, 1.9],
  );
  const cock = cockBuild.mesh(
    extrudeShape(cockShape, {
      depth: 0.36,
      bevelSize: 0.14,
      bevelThickness: 0.1,
      bevelSegments: 2,
      curveSegments: 28,
    }),
    ['bridgeSatine', 'anglage'],
  );
  cock.position.z = LAYOUT.balanceCock.z;
  const cockBoss = cockBuild.mesh(
    extrudeShape(ringShape(0.98, 0.58), {
      depth: 0.46,
      bevelSize: 0.07,
      bevelThickness: 0.06,
      bevelSegments: 2,
      curveSegments: 44,
    }),
    ['bridgeSatine', 'anglage'],
  );
  cockBoss.position.set(LAYOUT.balance.x, LAYOUT.balance.y, LAYOUT.balanceCock.z + 0.02);
  const cockJewel = ctx.part('jewels', { x: LAYOUT.balance.x, y: LAYOUT.balance.y, z: LAYOUT.balanceCock.z }).mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.1),
        new Vector2(0.26, 0.1),
        new Vector2(0.38, 0.04),
        new Vector2(0.36, -0.04),
        new Vector2(0, -0.06),
      ],
      28,
    ),
    'ruby',
  );
  cockJewel.position.set(LAYOUT.balance.x, LAYOUT.balance.y, LAYOUT.balanceCock.z + 0.32);
  addBluedScrew(ctx, 0.15, -12.3, LAYOUT.balanceCock.z + 0.22);

  // Regulator: a small steel lever with two curb pins on the hairspring.
  const regulator = cockBuild.mesh(
    extrudeShape(
      ribbonShape(
        [
          new Vector2(LAYOUT.balance.x + 1.5, LAYOUT.balance.y + 1.3),
          new Vector2(LAYOUT.balance.x + 0.4, LAYOUT.balance.y + 1.9),
          new Vector2(LAYOUT.balance.x - 0.7, LAYOUT.balance.y + 1.8),
        ],
        [0.4, 0.34, 0.26],
      ),
      { depth: 0.1, bevelSize: 0.03, bevelThickness: 0.02, curveSegments: 12 },
    ),
    'polishedSteel',
  );
  regulator.position.z = LAYOUT.balanceCock.z + 0.26;

  // A movement holder ring connects the plate to the case.
  const holderBuild = ctx.part('main-plate');
  const holder = holderBuild.mesh(
    latheAlongZ(
      [
        new Vector2(15.1, 2.9),
        new Vector2(15.52, 2.9),
        new Vector2(15.52, -2.9),
        new Vector2(15.1, -2.9),
        new Vector2(15.1, 2.9),
      ],
      96,
    ),
    'darkMetal',
  );
  holder.position.z = 0;
}
