import { BoxGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, TorusGeometry, Vector2 } from 'three';
import { extrudeShape, latheAlongZ, ringShape, spiralRibbonGeometry } from '../core/geometry';
import { DEG, beatAt, forkAngle, hairspringBreath, normalizeAngle } from '../calibre';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';
import type { MeshPhysicalMaterial } from 'three';

function box(width: number, height: number, depth: number, material: MeshPhysicalMaterial): Mesh {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A bar between two local points, so arm geometry follows the mechanism. */
function armBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  depth: number,
  material: MeshPhysicalMaterial,
): Mesh {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const mesh = box(width, length, depth, material);
  mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
  mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
  return mesh;
}

/**
 * The escapement is the only part of a watch that snaps. The wheel is stepped
 * half a tooth per beat, the fork banks between its two pins, and the balance
 * swings through 270° at 4 Hz. All three read from the escapement clock.
 */
export function buildEscapement(ctx: WatchContext): void {
  /* Escape wheel ---------------------------------------------------------- */
  const escapePivot = ctx.get('escape-wheel')?.group.children[0];
  if (escapePivot instanceof Group) {
    ctx.onUpdate((seconds) => {
      // Wrap before assigning: at 600× the raw angle would reach millions of
      // degrees and lose float precision within minutes.
      escapePivot.rotation.z = normalizeAngle(beatAt(seconds).escapeAngle);
    });
  }

  /* Pallet fork ----------------------------------------------------------- */
  const forkBuild = ctx.part('pallet-fork', { x: LAYOUT.pallet.x, y: LAYOUT.pallet.y, z: -1.62 });
  const forkPivot = new Group();
  forkPivot.position.set(LAYOUT.pallet.x, LAYOUT.pallet.y, -1.62);
  forkBuild.add(forkPivot);

  const steel = ctx.finishes.create('polishedSteel');
  const boss = box(0.56, 0.56, 0.26, steel);
  forkPivot.add(boss);

  // Fork arm points at the balance's impulse pin (down-left); the pallet arms
  // straddle the escape wheel (up-right).
  forkPivot.add(armBetween(0, 0, -2.1, -1.98, 0.24, 0.18, steel));
  const forkHead = box(0.76, 0.24, 0.18, steel);
  forkHead.position.set(-2.2, -2.08, 0);
  forkHead.rotation.z = Math.atan2(-2.0, -2.1) + Math.PI / 2;
  forkPivot.add(forkHead);
  for (const side of [-1, 1]) {
    const prong = box(0.13, 0.4, 0.18, steel);
    prong.position.set(-2.2 + side * 0.25, -2.32, 0);
    prong.rotation.z = Math.atan2(-2.0, -2.1) + Math.PI / 2;
    forkPivot.add(prong);
  }

  // The pallet arms point at the escape wheel but the bar itself is
  // perpendicular to that line, so both stones meet the wheel's rim.
  const towardWheel = Math.atan2(2.0, 2.17);
  const barCenterX = Math.cos(towardWheel) * 1.05;
  const barCenterY = Math.sin(towardWheel) * 1.05;
  const acrossX = Math.cos(towardWheel + Math.PI / 2) * 0.78;
  const acrossY = Math.sin(towardWheel + Math.PI / 2) * 0.78;
  const palletBar = armBetween(
    barCenterX - acrossX,
    barCenterY - acrossY,
    barCenterX + acrossX,
    barCenterY + acrossY,
    0.24,
    0.18,
    steel,
  );
  forkPivot.add(palletBar);

  // Two ruby stones at the ends of the pallet bar.
  const stoneBuild = ctx.part('pallet-stones', { x: LAYOUT.pallet.x, y: LAYOUT.pallet.y, z: -1.62 });
  const stonePivot = new Group();
  stonePivot.position.set(LAYOUT.pallet.x, LAYOUT.pallet.y, -1.62);
  stoneBuild.add(stonePivot);
  for (const side of [-1, 1]) {
    const stone = stoneBuild.mesh(new BoxGeometry(0.18, 0.42, 0.16), 'ruby');
    const toward = Math.atan2(2.0, 2.17);
    const angle = toward + Math.PI / 2;
    stone.position.set(
      Math.cos(toward) * 1.05 + Math.cos(angle) * 0.78 * side,
      Math.sin(toward) * 1.05 + Math.sin(angle) * 0.78 * side,
      0,
    );
    stone.rotation.z = angle;
  }

  // Banking pins: the fork's tail lands here at each beat.
  for (const side of [-1, 1]) {
    const pin = ctx.part('pallet-fork').mesh(
      latheAlongZ(
        [
          new Vector2(0, -1.4),
          new Vector2(0.1, -1.4),
          new Vector2(0.1, -2.02),
          new Vector2(0, -2.02),
        ],
        12,
      ),
      'polishedSteel',
    );
    pin.position.set(LAYOUT.pallet.x + side * 0.92, LAYOUT.pallet.y - 0.1 + side * 0.06, 0);
  }

  /* Balance --------------------------------------------------------------- */
  const balanceBuild = ctx.part('balance-wheel', { x: LAYOUT.balance.x, y: LAYOUT.balance.y, z: LAYOUT.balance.z });
  const balancePivot = new Group();
  balancePivot.position.set(LAYOUT.balance.x, LAYOUT.balance.y, LAYOUT.balance.z);
  balanceBuild.add(balancePivot);

  // Rim: a lenticular band of gold, the visual anchor at six o'clock.
  const rim = new Mesh(new TorusGeometry(3.55, 0.3, 18, 128), ctx.finishes.create('gold'));
  rim.scale.z = 0.72;
  rim.castShadow = true;
  rim.receiveShadow = true;
  balancePivot.add(rim);

  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2 + 0.3;
    const arm = box(3.5, 0.44, 0.18, ctx.finishes.create('gold'));
    arm.rotation.z = angle;
    arm.position.set(Math.cos(angle) * 1.85, Math.sin(angle) * 1.85, 0);
    balancePivot.add(arm);
  }

  const hub = new Mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.3),
        new Vector2(0.48, 0.3),
        new Vector2(0.58, 0.22),
        new Vector2(0.58, -0.22),
        new Vector2(0.48, -0.3),
        new Vector2(0, -0.3),
      ],
      36,
    ),
    ctx.finishes.create('polishedSteel'),
  );
  hub.castShadow = true;
  balancePivot.add(hub);

  // Eight timing screws around the rim: tiny gold cylinders that catch light.
  const screwGeometry = latheAlongZ(
    [new Vector2(0, 0.1), new Vector2(0.17, 0.1), new Vector2(0.17, -0.1), new Vector2(0, -0.1)],
    14,
  );
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const screw = new Mesh(screwGeometry, ctx.finishes.create('gold'));
    screw.position.set(Math.cos(angle) * 3.6, Math.sin(angle) * 3.6, 0.16);
    screw.rotation.z = angle;
    screw.castShadow = true;
    balancePivot.add(screw);
  }

  // Roller table and ruby impulse pin reach down to the fork.
  const roller = new Mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.06),
        new Vector2(0.4, 0.06),
        new Vector2(0.5, -0.1),
        new Vector2(0.5, -2.42),
        new Vector2(0, -2.42),
      ],
      24,
    ),
    ctx.finishes.create('polishedSteel'),
  );
  roller.castShadow = true;
  balancePivot.add(roller);
  const impulse = box(0.16, 0.38, 0.2, ctx.finishes.create('ruby'));
  // The pin must meet the fork, which reaches the balance from the lower left.
  impulse.position.set(-0.43, -1.25, -2.4);
  balancePivot.add(impulse);

  /* Hairspring ------------------------------------------------------------ */
  const hairspringBuild = ctx.part('hairspring', { x: LAYOUT.balance.x, y: LAYOUT.balance.y, z: LAYOUT.hairspring.z });
  const springGeometry = spiralRibbonGeometry({
    innerRadius: 0.62,
    outerRadius: 2.25,
    turns: 5,
    width: 0.055,
    segments: 520,
  });
  const tAttribute = new Float32Array(springGeometry.getAttribute('position').count);
  const uv = springGeometry.attributes.uv;
  for (let i = 0; i < tAttribute.length; i += 1) {
    tAttribute[i] = uv ? (uv.getX(i) + uv.getY(i)) / 2 : 0;
  }
  springGeometry.setAttribute('aT', new Float32BufferAttribute(tAttribute, 1));
  const hairspringMaterial = ctx.finishes.create('blued');
  hairspringMaterial.side = DoubleSide;
  hairspringMaterial.roughness = 0.5;
  hairspringMaterial.envMapIntensity = 0.3;
  hairspringMaterial.metalness = 0.55;
  hairspringMaterial.color.setHex(0x1d3350);
  hairspringMaterial.userData.shader = null;
  hairspringMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uBreath = { value: 0 };
    shader.vertexShader = `attribute float aT;\nuniform float uBreath;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float breathAngle = uBreath * 1.25 * pow(1.0 - aT, 1.35);
       float breathCos = cos(breathAngle);
       float breathSin = sin(breathAngle);
       transformed.xy = mat2(breathCos, -breathSin, breathSin, breathCos) * transformed.xy;
       transformed.xy *= 1.0 + 0.012 * uBreath * (1.0 - aT);`,
    );
    hairspringMaterial.userData.shader = shader;
  };
  const hairspring = new Mesh(springGeometry, hairspringMaterial);
  // The mesh sits on the balance staff so the shader's breathing rotation
  // happens around the staff, not around the middle of the dial.
  hairspring.position.set(LAYOUT.balance.x, LAYOUT.balance.y, LAYOUT.hairspring.z);
  hairspring.castShadow = true;
  hairspringBuild.add(hairspring);

  // Stud: the fixed outer end, pinned to the cock.
  const stud = ctx.part('hairspring').mesh(new BoxGeometry(0.24, 0.4, 0.2), 'polishedSteel');
  stud.position.set(LAYOUT.balance.x + 2.3, LAYOUT.balance.y, LAYOUT.hairspring.z);

  /* Shock spring ---------------------------------------------------------- */
  const shockBuild = ctx.part('shock-spring', { x: LAYOUT.balance.x, y: LAYOUT.balance.y, z: 2.78 });
  const shock = shockBuild.mesh(extrudeShape(ringShape(0.62, 0.44), { depth: 0.08, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 32 }), ['blued', 'anglage']);
  shock.position.set(LAYOUT.balance.x, LAYOUT.balance.y, 2.78);
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2;
    const tongue = shockBuild.mesh(new BoxGeometry(0.34, 0.09, 0.06), 'blued');
    tongue.position.set(
      LAYOUT.balance.x + Math.cos(angle) * 0.54,
      LAYOUT.balance.y + Math.sin(angle) * 0.54,
      2.79,
    );
    tongue.rotation.z = angle;
  }

  /* Motion ---------------------------------------------------------------- */
  ctx.onUpdate((seconds) => {
    const beat = beatAt(seconds);
    balancePivot.rotation.z = beat.balanceDeg * DEG;
    forkPivot.rotation.z = forkAngle(seconds);
    stonePivot.rotation.z = forkAngle(seconds);
    const shader = hairspringMaterial.userData.shader as
      | { uniforms: { uBreath: { value: number } } }
      | null;
    if (shader) shader.uniforms.uBreath.value = hairspringBreath(seconds);
  });

}
