import {
  BoxGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
} from 'three';
import { extrudeShape, gearShape, handShape, latheAlongZ, ringShape, roundedRectShape } from '../core/geometry';
import { CALIBRE, handAngles, handRotation, motionAngles, secondsStepAngle } from '../calibre';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';

function numeralTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.clearRect(0, 0, 320, 320);
  ctx.fillStyle = '#ead8b8';
  ctx.font = '500 148px "Times New Roman", "Liberation Serif", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 160, 172);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Display side: the motion works that turn one turn per hour into one per
 * twelve, the chapter ring, and the three hands. Every angle is read from the
 * calibre, never integrated here.
 */
export function buildDisplay(ctx: WatchContext): void {
  const motion = LAYOUT.motion;

  /* Minute wheel: 36 teeth, one turn every three hours, opposite direction. */
  const minuteBuild = ctx.part('minute-wheel', { x: motion.minuteWheel.x, y: motion.minuteWheel.y, z: motion.minuteWheel.z });
  const minutePivot = new Group();
  minutePivot.position.set(motion.minuteWheel.x, motion.minuteWheel.y, motion.minuteWheel.z);
  minuteBuild.add(minutePivot);
  minutePivot.add(
    minuteBuild.mesh(
      extrudeShape(gearShape({ teeth: 36, module: 0.1167, boreRadius: 0.26, spokes: 5, pierced: 1 }), {
        depth: 0.24,
        bevelSize: 0.04,
        bevelThickness: 0.03,
        bevelSegments: 1,
        curveSegments: 20,
      }),
      ['wheelFace', 'anglage'],
    ),
  );
  const minutePinion = minuteBuild.mesh(
    extrudeShape(gearShape({ teeth: 10, module: 0.112, boreRadius: 0.08, spokes: 0, pierced: 0 }), {
      depth: 0.42,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 1,
      curveSegments: 10,
    }),
    'polishedSteel',
  );
  minutePinion.position.z = motion.hourWheel.z - motion.minuteWheel.z;
  minutePivot.add(minutePinion);
  minutePivot.add(
    minuteBuild.mesh(
      latheAlongZ([new Vector2(0, 0.12), new Vector2(0.1, 0.12), new Vector2(0.1, -0.36), new Vector2(0, -0.36)], 14),
      'polishedSteel',
    ),
  );

  /* Hour wheel: 40 teeth, one turn every twelve hours, coaxial. */
  const hourBuild = ctx.part('hour-wheel', { x: 0, y: 0, z: motion.hourWheel.z });
  const hourPivot = new Group();
  hourPivot.position.set(0, 0, motion.hourWheel.z);
  hourBuild.add(hourPivot);
  hourPivot.add(
    hourBuild.mesh(
      extrudeShape(gearShape({ teeth: 40, module: 0.112, boreRadius: 0.95, spokes: 4, pierced: 1 }), {
        depth: 0.22,
        bevelSize: 0.035,
        bevelThickness: 0.03,
        bevelSegments: 1,
        curveSegments: 20,
      }),
      ['wheelFace', 'anglage'],
    ),
  );
  hourPivot.add(
    hourBuild.mesh(
      latheAlongZ(
        [
          new Vector2(0.88, 0.34),
          new Vector2(1.02, 0.34),
          new Vector2(1.02, -0.12),
          new Vector2(0.88, -0.12),
          new Vector2(0.88, 0.34),
        ],
        40,
      ),
      'polishedSteel',
    ),
  );

  /* Cannon pinion: 12 teeth, friction-fit on the center arbor. */
  const cannonBuild = ctx.part('cannon-pinion', { x: 0, y: 0, z: motion.cannonZ });
  const cannonPivot = new Group();
  cannonPivot.position.set(0, 0, motion.cannonZ);
  cannonBuild.add(cannonPivot);
  cannonPivot.add(
    cannonBuild.mesh(
      extrudeShape(gearShape({ teeth: 12, module: 0.1167, boreRadius: 0.3, spokes: 0, pierced: 0 }), {
        depth: 0.34,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        bevelSegments: 1,
        curveSegments: 12,
      }),
      'polishedSteel',
    ),
  );
  cannonPivot.add(
    cannonBuild.mesh(
      latheAlongZ(
        [
          new Vector2(0.26, 1.14),
          new Vector2(0.36, 1.14),
          new Vector2(0.36, -0.2),
          new Vector2(0.26, -0.2),
          new Vector2(0.26, 1.14),
        ],
        28,
      ),
      'polishedSteel',
    ),
  );

  ctx.onUpdate((seconds) => {
    const angles = motionAngles(seconds);
    minutePivot.rotation.z = angles.minuteWheel;
    hourPivot.rotation.z = angles.hourWheel;
    cannonPivot.rotation.z = angles.cannon;
  });

  /* Chapter ring ---------------------------------------------------------- */
  const chapterBuild = ctx.part('chapter-ring', { x: 0, y: 0, z: LAYOUT.chapter.z });
  const chapter = chapterBuild.mesh(
    extrudeShape(ringShape(LAYOUT.chapter.outer, LAYOUT.chapter.inner), {
      depth: 0.22,
      bevelSize: 0.06,
      bevelThickness: 0.05,
      bevelSegments: 2,
      curveSegments: 120,
    }),
    ['chapterDark', 'anglage'],
  );
  chapter.position.z = LAYOUT.chapter.z;
  chapter.renderOrder = 4;

  // Polished gold rails on both edges of the ring: the chapter is a piece of
  // jewellery, not a printed dial.
  for (const [radius, width] of [
    [LAYOUT.chapter.inner + 0.12, 0.08],
    [LAYOUT.chapter.outer - 0.1, 0.1],
  ] as const) {
    const rail = chapterBuild.mesh(
      latheAlongZ(
        [
          new Vector2(radius - width / 2, 0.12),
          new Vector2(radius + width / 2, 0.12),
          new Vector2(radius + width / 2, 0.03),
          new Vector2(radius - width / 2, 0.03),
          new Vector2(radius - width / 2, 0.12),
        ],
        120,
      ),
      'gold',
    );
    rail.position.z = LAYOUT.chapter.z + 0.02;
  }

  // Applied indices at every hour that is not a cardinal numeral.
  const barGeometry = extrudeShape(roundedRectShape(1.1, 0.26, 0.06), {
    depth: 0.12,
    bevelSize: 0.014,
    bevelThickness: 0.014,
    bevelSegments: 1,
    curveSegments: 10,
  });
  for (const hour of [1, 2, 4, 5, 7, 8, 10, 11]) {
    const angle = Math.PI / 2 - (hour / 12) * Math.PI * 2;
    const bar = chapterBuild.mesh(barGeometry, 'gold');
    bar.scale.set(1, hour % 3 === 0 ? 1.35 : 1, 1);
    bar.position.set(Math.cos(angle) * 14.0, Math.sin(angle) * 14.0, LAYOUT.chapter.z + 0.18);
    bar.rotation.z = angle + Math.PI / 2;
  }

  const numeralAngles: Array<[string, number]> = [
    ['XII', Math.PI / 2],
    ['III', 0],
    ['VI', -Math.PI / 2],
    ['IX', Math.PI],
  ];
  for (const [text, angle] of numeralAngles) {
    const material = new MeshBasicMaterial({
      map: numeralTexture(text),
      transparent: true,
      depthWrite: false,
      color: 0xf1e6d2,
      toneMapped: true,
      side: DoubleSide,
    });
    const plane = new Mesh(new PlaneGeometry(3.0, 3.0), material);
    plane.position.set(Math.cos(angle) * 13.95, Math.sin(angle) * 13.95, LAYOUT.chapter.z + 0.2);
    plane.castShadow = false;
    plane.receiveShadow = false;
    chapterBuild.add(plane);
  }

  // Sixty minute ticks, instanced into one draw call. Longer at the fives.
  const tickGeometry = new BoxGeometry(0.055, 0.2, 0.025);
  const tickMaterial = ctx.finishes.create('polishedSteel');
  const ticks = new InstancedMesh(tickGeometry, tickMaterial, 60);
  ticks.castShadow = false;
  ticks.receiveShadow = false;
  const matrix = new Matrix4();
  const tick = new Object3D();
  for (let minute = 0; minute < 60; minute += 1) {
    const angle = Math.PI / 2 - (minute / 60) * Math.PI * 2;
    tick.position.set(Math.cos(angle) * 12.88, Math.sin(angle) * 12.88, LAYOUT.chapter.z + 0.16);
    tick.rotation.set(0, 0, angle);
    tick.scale.set(1, minute % 5 === 0 ? 1.7 : 0.85, 1);
    tick.updateMatrix();
    matrix.copy(tick.matrix);
    ticks.setMatrixAt(minute, matrix);
  }
  ticks.instanceMatrix.needsUpdate = true;
  chapterBuild.add(ticks);

  /* Small seconds subdial ------------------------------------------------ */
  const subBuild = ctx.part('small-seconds', {
    x: LAYOUT.fourth.x,
    y: LAYOUT.fourth.y,
    z: LAYOUT.chapter.z + 0.12,
  });
  const sub = subBuild.mesh(
    extrudeShape(ringShape(3.3, 2.95), {
      depth: 0.08,
      bevelSize: 0.03,
      bevelThickness: 0.025,
      bevelSegments: 2,
      curveSegments: 96,
    }),
    ['chapterDark', 'anglage'],
  );
  sub.position.set(LAYOUT.fourth.x, LAYOUT.fourth.y, LAYOUT.chapter.z + 0.12);
  const subRim = subBuild.mesh(
    latheAlongZ(
      [
        new Vector2(3.1, 0.045),
        new Vector2(3.35, 0.045),
        new Vector2(3.35, -0.02),
        new Vector2(3.1, -0.02),
        new Vector2(3.1, 0.045),
      ],
      96,
    ),
    'gold',
  );
  subRim.position.set(LAYOUT.fourth.x, LAYOUT.fourth.y, LAYOUT.chapter.z + 0.14);
  const subTicks = new InstancedMesh(new BoxGeometry(0.04, 0.18, 0.02), ctx.finishes.create('gold'), 60);
  const subMatrix = new Matrix4();
  const subTick = new Object3D();
  for (let minute = 0; minute < 60; minute += 1) {
    const angle = Math.PI / 2 - (minute / 60) * Math.PI * 2;
    subTick.position.set(
      LAYOUT.fourth.x + Math.cos(angle) * 3.08,
      LAYOUT.fourth.y + Math.sin(angle) * 3.08,
      LAYOUT.chapter.z + 0.14,
    );
    subTick.rotation.set(0, 0, angle);
    subTick.scale.set(1, minute % 5 === 0 ? 1.6 : 0.8, 1);
    subTick.updateMatrix();
    subMatrix.copy(subTick.matrix);
    subTicks.setMatrixAt(minute, subMatrix);
  }
  subTicks.instanceMatrix.needsUpdate = true;
  subBuild.add(subTicks);

  /* Hands ----------------------------------------------------------------- */
  const hourHandBuild = ctx.part('hour-hand', { x: 0, y: 0, z: LAYOUT.hands.hourZ });
  const hourHand = hourHandBuild.mesh(
    extrudeShape(handShape({ length: 8.55, width: 0.42, tail: 1.1, tipWidth: 0.12, holeRadius: 0.36 }), {
      depth: 0.09,
      bevelSize: 0.026,
      bevelThickness: 0.022,
      bevelSegments: 2,
      curveSegments: 20,
    }),
    ['handGold', 'anglage'],
  );
  hourHand.position.z = LAYOUT.hands.hourZ;

  const minuteHandBuild = ctx.part('minute-hand', { x: 0, y: 0, z: LAYOUT.hands.minuteZ });
  const minuteHand = minuteHandBuild.mesh(
    extrudeShape(handShape({ length: 11.95, width: 0.32, tail: 1.25, tipWidth: 0.09, holeRadius: 0.29 }), {
      depth: 0.08,
      bevelSize: 0.022,
      bevelThickness: 0.018,
      bevelSegments: 2,
      curveSegments: 20,
    }),
    ['handGold', 'anglage'],
  );
  minuteHand.position.z = LAYOUT.hands.minuteZ;
  // A pale inner line gives each hand a luminous core and a readable edge.
  const hourInsert = hourHandBuild.add(
    new Mesh(
      extrudeShape(handShape({ length: 8.05, width: 0.15, tail: 0.75, tipWidth: 0.05 }), {
        depth: 0.025,
        bevelSize: 0.006,
        bevelThickness: 0.006,
        bevelSegments: 1,
        curveSegments: 14,
      }),
      ctx.finishes.create('ivory'),
    ),
  );
  hourInsert.position.z = 0.055;
  hourHand.add(hourInsert);
  const minuteInsert = minuteHandBuild.add(
    new Mesh(
      extrudeShape(handShape({ length: 11.4, width: 0.11, tail: 0.8, tipWidth: 0.035 }), {
        depth: 0.022,
        bevelSize: 0.005,
        bevelThickness: 0.005,
        bevelSegments: 1,
        curveSegments: 14,
      }),
      ctx.finishes.create('ivory'),
    ),
  );
  minuteInsert.position.z = 0.05;
  minuteHand.add(minuteInsert);

  const secondsBuild = ctx.part('seconds-hand', {
    x: LAYOUT.fourth.x,
    y: LAYOUT.fourth.y,
    z: LAYOUT.hands.secondZ,
  });
  const secondsPivot = new Group();
  secondsPivot.position.set(LAYOUT.fourth.x, LAYOUT.fourth.y, LAYOUT.hands.secondZ);
  secondsBuild.add(secondsPivot);
  const secondsHand = secondsBuild.mesh(
    extrudeShape(handShape({ length: 2.8, width: 0.13, tail: 0.7, tipWidth: 0.04 }), {
      depth: 0.055,
      bevelSize: 0.011,
      bevelThickness: 0.009,
      bevelSegments: 1,
      curveSegments: 10,
    }),
    ['blued', 'polishedSteel'],
  );
  secondsPivot.add(secondsHand);
  const counterweight = secondsBuild.mesh(
    latheAlongZ(
      [new Vector2(0, 0.1), new Vector2(0.3, 0.06), new Vector2(0.3, -0.06), new Vector2(0, -0.1)],
      20,
    ),
    'blued',
  );
  counterweight.position.y = -0.42;
  secondsPivot.add(counterweight);

  // A polished cap covers the hand stack; it is the one static note at the
  // centre of an otherwise moving dial.
  const cap = hourBuild.mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.08),
        new Vector2(0.36, 0.06),
        new Vector2(0.48, -0.02),
        new Vector2(0.44, -0.08),
        new Vector2(0, -0.1),
      ],
      36,
    ),
    'polishedSteel',
  );
  cap.position.set(0, 0, LAYOUT.hands.minuteZ + 0.1);

  ctx.onUpdate((seconds) => {
    const angles = handAngles(CALIBRE.startTimeSeconds + seconds);
    hourHand.rotation.z = handRotation(angles.hour);
    minuteHand.rotation.z = handRotation(angles.minute);
    secondsPivot.rotation.z = secondsStepAngle(CALIBRE.startTimeSeconds + seconds);
  });
}
