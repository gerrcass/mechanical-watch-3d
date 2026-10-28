import {
  CanvasTexture,
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
} from 'three';
import { latheAlongZ } from '../core/geometry';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';

const CASE_OUTER = 17.42;
const CASE_INNER = 15.62;

/**
 * The case is a thin champagne-gold band, not a bezel that hides the
 * movement. A brushed wall carries the profile; a polished bezel catches one
 * long highlight. The back is brushed and engraved, because the object is
 * meant to be walked around.
 */
export function buildCase(ctx: WatchContext): void {
  const bandBuild = ctx.part('case-band', { x: 0, y: 0, z: 0 });

  /* Brushed case wall ----------------------------------------------------- */
  const wall = bandBuild.mesh(
    latheAlongZ(
      [
        new Vector2(CASE_INNER, -2.42),
        new Vector2(CASE_OUTER, -2.42),
        new Vector2(CASE_OUTER, 1.52),
        new Vector2(CASE_OUTER - 0.18, 1.78),
        new Vector2(CASE_OUTER - 0.18, 2.6),
        new Vector2(CASE_INNER, 2.6),
        new Vector2(CASE_INNER, -2.42),
      ],
      128,
    ),
    'caseBrushed',
  );
  wall.castShadow = true;
  wall.receiveShadow = true;

  /* Polished bezel -------------------------------------------------------- */
  const bezel = bandBuild.mesh(
    latheAlongZ(
      [
        new Vector2(CASE_INNER - 0.02, 2.56),
        new Vector2(CASE_OUTER - 0.14, 2.56),
        new Vector2(CASE_OUTER + 0.12, 2.86),
        new Vector2(CASE_OUTER - 0.08, 3.18),
        new Vector2(15.96, 3.18),
        new Vector2(15.68, 2.98),
        new Vector2(CASE_INNER - 0.02, 2.96),
      ],
      120,
    ),
    'casePolished',
  );
  bezel.castShadow = true;

  /* Dark inner flange where the movement seats ---------------------------- */
  const flange = bandBuild.mesh(
    latheAlongZ(
      [
        new Vector2(15.16, 2.92),
        new Vector2(CASE_INNER, 2.92),
        new Vector2(CASE_INNER, -2.9),
        new Vector2(15.16, -2.9),
        new Vector2(15.16, 2.92),
      ],
      96,
    ),
    'darkMetal',
  );
  flange.position.z = 0;

  /* Case back ------------------------------------------------------------- */
  const backBuild = ctx.part('case-back', { x: 0, y: 0, z: -3.0 });
  const back = backBuild.mesh(
    latheAlongZ(
      [
        new Vector2(0, -3.08),
        new Vector2(13.4, -3.08),
        new Vector2(14.9, -2.96),
        new Vector2(CASE_OUTER - 0.08, -2.72),
        new Vector2(CASE_INNER, -2.56),
        new Vector2(0, -2.56),
        new Vector2(0, -3.08),
      ],
      96,
    ),
    'caseBack',
  );
  back.castShadow = true;

  // A faint engraved medallion. Backs are seen; they should not be blank.
  const engraving = document.createElement('canvas');
  engraving.width = 1024;
  engraving.height = 1024;
  const engravingCtx = engraving.getContext('2d');
  if (engravingCtx) {
    engravingCtx.clearRect(0, 0, 1024, 1024);
    engravingCtx.translate(512, 512);
    engravingCtx.fillStyle = 'rgba(201,188,158,0.62)';
    engravingCtx.textAlign = 'center';
    engravingCtx.textBaseline = 'middle';
    engravingCtx.font = '300 70px "Times New Roman", "Liberation Serif", serif';
    engravingCtx.letterSpacing = '18px';
    engravingCtx.fillText('MW-01', 0, -22);
    engravingCtx.font = '400 27px "SFMono-Regular", Menlo, monospace';
    engravingCtx.letterSpacing = '10px';
    engravingCtx.fillText('CALIBRE · 12 JEWELS', 0, 72);
    engravingCtx.fillStyle = 'rgba(201,188,158,0.34)';
    engravingCtx.fillText('ADJUSTED · 28 800', 0, 124);
    // A thin engraved ring frames the text.
    engravingCtx.strokeStyle = 'rgba(201,188,158,0.28)';
    engravingCtx.lineWidth = 2;
    engravingCtx.beginPath();
    engravingCtx.arc(0, 0, 320, 0, Math.PI * 2);
    engravingCtx.stroke();
    const texture = new CanvasTexture(engraving);
    texture.colorSpace = SRGBColorSpace;
    const medallion = new Mesh(
      new PlaneGeometry(27, 27),
      new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: true }),
    );
    medallion.position.set(0, 0, -3.095);
    medallion.rotation.y = Math.PI;
    backBuild.add(medallion);
  }

  // The case is a display case: a clean round profile with a crown at three.
  // No lugs are cut, because the movement is presented as a pocket-watch object.
  const neck = bandBuild.mesh(new CylinderGeometry(0.95, 1.02, 3.4, 24), 'casePolished');
  neck.rotation.z = Math.PI / 2;
  neck.position.set(18.0, 0.8, 2.2);

  /* Crystal and its seat -------------------------------------------------- */
  const crystalBuild = ctx.part('crystal', { x: 0, y: 0, z: LAYOUT.crystal.z });
  const seat = crystalBuild.mesh(
    latheAlongZ(
      [
        new Vector2(15.0, 3.02),
        new Vector2(15.7, 3.02),
        new Vector2(15.7, 3.22),
        new Vector2(15.0, 3.22),
        new Vector2(15.0, 3.02),
      ],
      120,
    ),
    'polishedSteel',
  );
  seat.position.z = 0.02;

  // A shallow sapphire cap: a long, soft reflection, not a grey veil.
  const dome = new Mesh(
    new SphereGeometry(15.0, 96, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    ctx.finishes.create('sapphire'),
  );
  dome.scale.y = 0.07;
  dome.rotation.x = Math.PI / 2;
  dome.position.z = 3.2;
  dome.renderOrder = 10;
  // Glass is an occluder, not an answer: a pick must reach the part behind it.
  dome.raycast = () => undefined;
  crystalBuild.add(dome);
}
