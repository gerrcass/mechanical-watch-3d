import { BoxGeometry, CylinderGeometry, Group, Vector2 } from 'three';
import { extrudeShape, gearShape, latheAlongZ, ribbonShape, roundedRectShape } from '../core/geometry';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';

/**
 * Keyless works: the crown turns a stem, the stem's pinion turns the crown
 * wheel, and the crown wheel turns the ratchet on the barrel arbor. The click
 * holds what has been wound.
 */
export function buildKeyless(ctx: WatchContext): void {
  const z = 1.55;

  /* Ratchet wheel on the barrel arbor ------------------------------------- */
  const ratchetBuild = ctx.part('ratchet-wheel', { x: LAYOUT.barrel.x, y: LAYOUT.barrel.y, z });
  const ratchetPivot = new Group();
  ratchetPivot.position.set(LAYOUT.barrel.x, LAYOUT.barrel.y, z);
  ratchetBuild.add(ratchetPivot);
  const ratchetGeometry = extrudeShape(
    gearShape({ teeth: 22, module: 0.15, boreRadius: 0.4, spokes: 0, pierced: 0, toothStyle: 'ratchet' }),
    { depth: 0.24, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 32 },
  );
  ratchetPivot.add(ratchetBuild.mesh(ratchetGeometry, ['ratchetFace', 'anglage']));
  ratchetPivot.add(
    ratchetBuild.mesh(
      latheAlongZ(
        [
          new Vector2(0, 0.18),
          new Vector2(0.62, 0.16),
          new Vector2(0.74, 0.08),
          new Vector2(0.74, -0.04),
          new Vector2(0, -0.06),
        ],
        36,
      ),
      'blued',
    ),
  );

  /* Crown wheel ----------------------------------------------------------- */
  const crownWheelBuild = ctx.part('crown-wheel', { x: -0.9, y: 1.5, z });
  const crownWheelPivot = new Group();
  crownWheelPivot.position.set(-0.9, 1.5, z);
  crownWheelBuild.add(crownWheelPivot);
  crownWheelPivot.add(
    crownWheelBuild.mesh(
      extrudeShape(gearShape({ teeth: 22, module: 0.15, boreRadius: 0.26, spokes: 5, pierced: 1 }), {
        depth: 0.22,
        bevelSize: 0.04,
        bevelThickness: 0.035,
        bevelSegments: 2,
        curveSegments: 20,
      }),
      ['ratchetFace', 'anglage'],
    ),
  );
  crownWheelPivot.add(
    crownWheelBuild.mesh(
      latheAlongZ(
        [
          new Vector2(0, 0.16),
          new Vector2(0.44, 0.14),
          new Vector2(0.54, 0.06),
          new Vector2(0.54, -0.05),
          new Vector2(0, -0.07),
        ],
        28,
      ),
      'blued',
    ),
  );

  /* Click and click spring ------------------------------------------------ */
  const clickBuild = ctx.part('click', { x: -1.1, y: 5.9, z });
  const clickPivot = new Group();
  clickPivot.position.set(-1.1, 5.9, z + 0.02);
  clickBuild.add(clickPivot);
  const clickArm = clickBuild.mesh(
    extrudeShape(roundedRectShape(2.6, 0.55, 0.26), {
      depth: 0.2,
      bevelSize: 0.05,
      bevelThickness: 0.04,
      bevelSegments: 1,
      curveSegments: 10,
    }),
    'blued',
  );
  clickArm.position.set(-1.1, -0.4, 0);
  clickArm.rotation.z = 0.5;
  clickPivot.add(clickArm);
  const clickHub = clickBuild.mesh(
    latheAlongZ([new Vector2(0, 0.12), new Vector2(0.34, 0.12), new Vector2(0.34, -0.1), new Vector2(0, -0.1)], 24),
    'blued',
  );
  clickPivot.add(clickHub);

  const springBuild = ctx.part('click-spring', { x: -1.1, y: 5.9, z });
  const springShape = ribbonShape(
    [new Vector2(0.1, 6.6), new Vector2(1.0, 6.3), new Vector2(1.5, 5.7)],
    [0.2, 0.18, 0.14],
  );
  const spring = springBuild.mesh(
    extrudeShape(springShape, { depth: 0.1, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 12 }),
    'blued',
  );
  spring.position.z = z + 0.06;

  /* Stem, pinion and crown ------------------------------------------------ */
  const stemBuild = ctx.part('winding-stem', { x: 12, y: 0.95, z });
  const stemLength = 19.0;
  const stem = stemBuild.mesh(new CylinderGeometry(0.17, 0.17, stemLength, 16), 'darkMetal');
  stem.rotation.z = Math.PI / 2;
  stem.position.set(11.0, 0.8, z);
  const square = stemBuild.mesh(new BoxGeometry(1.5, 0.4, 0.4), 'polishedSteel');
  square.position.set(20.0, 0.8, z);

  const pinionBuild = ctx.part('winding-stem');
  const windingPinion = pinionBuild.mesh(
    extrudeShape(gearShape({ teeth: 10, module: 0.13, boreRadius: 0.22, spokes: 0, pierced: 0 }), {
      depth: 0.6,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 1,
      curveSegments: 12,
    }),
    'polishedSteel',
  );
  windingPinion.position.set(0.95, 1.2, z);

  const crownBuild = ctx.part('crown', { x: 21.4, y: 0.8, z });
  const crownPivot = new Group();
  crownPivot.position.set(21.4, 0.8, z);
  crownBuild.add(crownPivot);
  const crownGeometry = extrudeShape(gearShape({ teeth: 22, module: 0.2, boreRadius: 0.25, spokes: 0, pierced: 0 }), {
    depth: 1.7,
    bevelSize: 0.07,
    bevelThickness: 0.06,
    bevelSegments: 2,
    curveSegments: 20,
  });
  crownGeometry.rotateY(Math.PI / 2);
  crownPivot.add(crownBuild.mesh(crownGeometry, 'gold'));
  const cap = crownBuild.mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.1),
        new Vector2(1.85, 0.1),
        new Vector2(2.0, 0.0),
        new Vector2(2.0, -0.16),
        new Vector2(1.85, -0.22),
        new Vector2(0, -0.22),
      ],
      40,
    ),
    'gold',
  );
  cap.rotation.y = Math.PI / 2;
  cap.position.set(1.02, 0, 0);
  crownPivot.add(cap);

  /* Setting lever and yoke ------------------------------------------------ */
  const leverBuild = ctx.part('setting-lever', { x: 13.4, y: 2.6, z });
  const lever = leverBuild.mesh(
    extrudeShape(roundedRectShape(3.1, 0.5, 0.22), {
      depth: 0.16,
      bevelSize: 0.04,
      bevelThickness: 0.03,
      curveSegments: 10,
    }),
    'polishedSteel',
  );
  lever.position.set(13.1, 2.5, z + 0.05);
  lever.rotation.z = 0.42;

  const yokeBuild = ctx.part('yoke', { x: 9.8, y: 3.1, z });
  const yoke = yokeBuild.mesh(
    extrudeShape(roundedRectShape(3.6, 0.5, 0.2), {
      depth: 0.16,
      bevelSize: 0.04,
      bevelThickness: 0.03,
      curveSegments: 10,
    }),
    'polishedSteel',
  );
  yoke.position.set(9.4, 3.0, z + 0.05);
  yoke.rotation.z = -0.55;

  ctx.onUpdate((_seconds, _reserve, animation) => {
    const impulse = animation.winding;
    const eased = impulse * impulse * (3 - 2 * impulse);
    ratchetPivot.rotation.z = -eased * 0.72;
    crownWheelPivot.rotation.z = eased * 0.83;
    crownPivot.rotation.x = -eased * 2.4;
    clickPivot.rotation.z = eased * 0.16;
    lever.rotation.z = 0.42;
    yoke.rotation.z = -0.55;
  });
}
