import { BoxGeometry, CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Vector2 } from 'three';
import { discShape, extrudeShape, latheAlongZ, organicHole, ringShape } from '../core/geometry';
import { LAYOUT, PLATE_JEWELS } from './layout';
import type { WatchContext } from './context';

/**
 * The main plate is the exhibit's floor: one piece of rhodium-plated brass,
 * pierced by hand-shaped windows, grained with perlage, bevelled on every
 * edge. Jewels sit in gold chatons at the pivot points and case screws hold
 * the movement to the holder.
 */
export function buildPlate(ctx: WatchContext): void {
  const plateBuild = ctx.part('main-plate', { x: 0, y: 0, z: LAYOUT.plate.z });

  const shape = discShape(LAYOUT.plate.radius);
  shape.holes.push(
    organicHole(9.9, -0.44, 0.4, 3.9),
    organicHole(9.6, 3.49, 0.42, 3.6),
    organicHole(10.0, 1.26, 0.3, 3.2),
    organicHole(10.3, 2.06, 0.26, 3.0),
    organicHole(10.7, 5.62, 0.26, 2.9),
    organicHole(10.4, 2.62, 0.24, 2.7),
  );
  const geometry = extrudeShape(shape, {
    depth: LAYOUT.plate.thickness,
    bevelSize: 0.22,
    bevelThickness: 0.18,
    bevelSegments: 2,
    curveSegments: 48,
  });
  const plate = plateBuild.mesh(geometry, ['platePerlage', 'anglage']);
  plate.position.z = LAYOUT.plate.z;

  // A brushed inner wall so the pierced openings read as thickness, not holes
  // cut in a sheet of paper.
  const ring = ringShape(LAYOUT.plate.radius + 0.015, LAYOUT.plate.radius - 0.36);
  const ringGeometry = extrudeShape(ring, { depth: 0.1, bevelSize: 0.03, bevelThickness: 0.03 });
  const rim = plateBuild.mesh(ringGeometry, 'polishedSteel');
  rim.position.z = LAYOUT.plate.z + LAYOUT.plate.thickness * 0.5;

  // Jewel seats: gold chaton, ruby, and an oil cup ring.
  for (const [x, y] of PLATE_JEWELS) {
    const chaton = plateBuild.mesh(
      latheAlongZ(
        [
          new Vector2(0.34, 0.1),
          new Vector2(0.52, 0.1),
          new Vector2(0.6, 0.04),
          new Vector2(0.6, -0.02),
          new Vector2(0.44, -0.02),
          new Vector2(0.34, 0.02),
        ],
        40,
      ),
      'gold',
    );
    chaton.position.set(x, y, LAYOUT.plate.z + LAYOUT.plate.thickness * 0.5 + 0.08);

    const ruby = ctx.part('jewels', { x, y, z: LAYOUT.plate.z }).mesh(
      latheAlongZ(
        [
          new Vector2(0, 0.09),
          new Vector2(0.18, 0.09),
          new Vector2(0.27, 0.04),
          new Vector2(0.26, -0.03),
          new Vector2(0.1, -0.06),
          new Vector2(0, -0.06),
        ],
        32,
      ),
      'ruby',
    );
    ruby.position.set(x, y, LAYOUT.plate.z + LAYOUT.plate.thickness * 0.5 + 0.14);
  }

  // Etched lettering on the plate: an exhibition movement signs its work.
  const engraving = document.createElement('canvas');
  engraving.width = 512;
  engraving.height = 256;
  const engravingCtx = engraving.getContext('2d');
  if (engravingCtx) {
    engravingCtx.clearRect(0, 0, 512, 256);
    engravingCtx.fillStyle = 'rgba(18,20,23,0.85)';
    engravingCtx.font = '500 54px "Times New Roman", "Liberation Serif", serif';
    engravingCtx.textAlign = 'center';
    engravingCtx.fillText('CALIBRE MW-01', 256, 92);
    engravingCtx.font = '400 30px "SFMono-Regular", Menlo, monospace';
    engravingCtx.letterSpacing = '8px';
    engravingCtx.fillText('21 JEWELS', 256, 146);
    engravingCtx.fillText('ADJUSTED', 256, 190);
    const texture = new CanvasTexture(engraving);
    texture.colorSpace = SRGBColorSpace;
    const plane = new Mesh(
      new PlaneGeometry(7.4, 3.7),
      new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, color: 0xffffff, toneMapped: true }),
    );
    plane.position.set(-8.6, -6.1, LAYOUT.plate.z + LAYOUT.plate.thickness / 2 + 0.012);
    plane.rotation.z = 0.36;
    plateBuild.add(plane);
  }

  // Case screws around the solid rim.
  for (const angle of [0.3, 1.62, 2.9, 4.2, 5.45]) {
    const x = Math.cos(angle) * (LAYOUT.screws.plateRadius - 1.5);
    const y = Math.sin(angle) * (LAYOUT.screws.plateRadius - 1.5);
    addScrew(ctx, x, y, LAYOUT.plate.z + LAYOUT.plate.thickness * 0.5 + 0.02, 1.35);
  }
}

/**
 * A blued screw: lathe-turned head with a polished bevel and a milled slot.
 * Screws are catalogued as one entry, but each is its own little object.
 */
export function addScrew(ctx: WatchContext, x: number, y: number, z: number, radius: number): void {
  const screw = ctx.part('screws', { x, y, z });
  const head = screw.mesh(
    latheAlongZ(
      [
        new Vector2(0, 0.09),
        new Vector2(radius * 0.5, 0.085),
        new Vector2(radius * 0.8, 0.045),
        new Vector2(radius, -0.02),
        new Vector2(radius, -0.1),
        new Vector2(radius * 0.86, -0.13),
        new Vector2(0, -0.14),
      ],
      36,
    ),
    'blued',
  );
  head.position.set(x, y, z);

  const slot = new Mesh(new BoxGeometry(radius * 1.6, radius * 0.22, 0.035), ctx.finishes.create('matteBlack'));
  slot.position.set(x, y, z + 0.075);
  slot.rotation.z = 0.5;
  screw.add(slot);
}

/** A small circular boss with a hole, used for bridge feet and holders. */
export function boss(x: number, y: number, z: number, radius: number, ctx: WatchContext, finish: Parameters<WatchContext['finishes']['create']>[0] = 'gold'): Mesh {
  const geometry = extrudeShape(ringShape(radius, radius * 0.55), { depth: 0.18, bevelSize: 0.03, bevelThickness: 0.03 });
  const mesh = new Mesh(geometry, ctx.finishes.create(finish));
  mesh.position.set(x, y, z);
  return mesh;
}

