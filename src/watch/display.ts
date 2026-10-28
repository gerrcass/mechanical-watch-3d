import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
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
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = '#e8dfcd';
  ctx.font = '500 128px "Times New Roman", "Liberation Serif", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 138);
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
      depth: 0.24,
      bevelSize: 0.05,
      bevelThickness: 0.04,
      bevelSegments: 2,
      curveSegments: 120,
    }),
    ['chapterDark', 'anglage'],
  );
  chapter.position.z = LAYOUT.chapter.z;
  chapter.renderOrder = 4;

  // Applied indices at every hour that is not a cardinal numeral.
  const barGeometry = extrudeShape(roundedRectShape(0.92, 0.17, 0.06), {
    depth: 0.1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 1,
    curveSegments: 10,
  });
  for (const hour of [1, 2, 4, 5, 7, 8, 10, 11]) {
    const angle = (hour / 12) * Math.PI * 2;
    const bar = chapterBuild.mesh(barGeometry, 'gold');
    bar.scale.set(1, hour % 3 === 0 ? 1.35 : 1, 1);
    bar.position.set(Math.cos(angle) * 14.05, Math.sin(angle) * 14.05, LAYOUT.chapter.z + 0.26);
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
      color: 0xefe6d2,
      toneMapped: true,
      side: DoubleSide,
    });
    const plane = new Mesh(new PlaneGeometry(1.95, 1.95), material);
    plane.position.set(Math.cos(angle) * 14.12, Math.sin(angle) * 14.12, LAYOUT.chapter.z + 0.28);
    chapterBuild.add(plane);
  }

  /* Hands ----------------------------------------------------------------- */
  const hourHandBuild = ctx.part('hour-hand', { x: 0, y: 0, z: LAYOUT.hands.hourZ });
  const hourHand = hourHandBuild.mesh(
    extrudeShape(handShape({ length: 9.0, width: 0.74, tail: -1.4, tipWidth: 0.3, holeRadius: 0.46 }), {
      depth: 0.1,
      bevelSize: 0.03,
      bevelThickness: 0.025,
      bevelSegments: 2,
      curveSegments: 20,
    }),
    ['gold', 'anglage'],
  );
  hourHand.position.z = LAYOUT.hands.hourZ;

  const minuteHandBuild = ctx.part('minute-hand', { x: 0, y: 0, z: LAYOUT.hands.minuteZ });
  const minuteHand = minuteHandBuild.mesh(
    extrudeShape(handShape({ length: 12.6, width: 0.56, tail: -1.6, tipWidth: 0.22, holeRadius: 0.38 }), {
      depth: 0.09,
      bevelSize: 0.026,
      bevelThickness: 0.02,
      bevelSegments: 2,
      curveSegments: 20,
    }),
    ['gold', 'anglage'],
  );
  minuteHand.position.z = LAYOUT.hands.minuteZ;

  const secondsBuild = ctx.part('seconds-hand', {
    x: LAYOUT.fourth.x,
    y: LAYOUT.fourth.y,
    z: LAYOUT.hands.secondZ,
  });
  const secondsPivot = new Group();
  secondsPivot.position.set(LAYOUT.fourth.x, LAYOUT.fourth.y, LAYOUT.hands.secondZ);
  secondsBuild.add(secondsPivot);
  const secondsHand = secondsBuild.mesh(
    extrudeShape(handShape({ length: 4.3, width: 0.14, tail: -0.9, tipWidth: 0.05 }), {
      depth: 0.06,
      bevelSize: 0.012,
      bevelThickness: 0.01,
      bevelSegments: 1,
      curveSegments: 10,
    }),
    ['blued', 'polishedSteel'],
  );
  secondsPivot.add(secondsHand);
  const counterweight = secondsBuild.mesh(
    latheAlongZ(
      [new Vector2(0, 0.1), new Vector2(0.34, 0.06), new Vector2(0.34, -0.06), new Vector2(0, -0.1)],
      20,
    ),
    'blued',
  );
  counterweight.position.y = -0.42;
  secondsPivot.add(counterweight);

  ctx.onUpdate((seconds) => {
    const angles = handAngles(CALIBRE.startTimeSeconds + seconds);
    hourHand.rotation.z = handRotation(angles.hour);
    minuteHand.rotation.z = handRotation(angles.minute);
    secondsPivot.rotation.z = secondsStepAngle(CALIBRE.startTimeSeconds + seconds);
  });
}
