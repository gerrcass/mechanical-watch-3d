import { CylinderGeometry, Mesh, Shape, SphereGeometry, Vector2 } from 'three';
import { extrudeShape, latheAlongZ, ringShape } from '../core/geometry';
import { LAYOUT } from './layout';
import type { WatchContext } from './context';

/**
 * The case is a thin polished ring with four bare lugs and a raised crystal.
 * No bezel covers the movement: the point of the exhibit is that nothing sits
 * between the viewer and the mechanism.
 */
export function buildCase(ctx: WatchContext): void {
  const bandBuild = ctx.part('case-band', { x: 0, y: 0, z: 0 });
  const band = bandBuild.mesh(
    latheAlongZ(
      [
        new Vector2(15.55, -3.0),
        new Vector2(15.55, 2.72),
        new Vector2(15.98, 3.06),
        new Vector2(16.2, 3.06),
        new Vector2(16.62, 2.52),
        new Vector2(17.0, 1.35),
        new Vector2(17.0, -2.22),
        new Vector2(16.6, -3.08),
        new Vector2(15.55, -3.0),
      ],
      128,
    ),
    'gold',
  );
  band.castShadow = true;
  band.receiveShadow = true;

  // A dark inner flange where the movement holder seats.
  const inner = bandBuild.mesh(
    latheAlongZ(
      [
        new Vector2(15.18, 3.02),
        new Vector2(15.5, 3.02),
        new Vector2(15.5, -3.02),
        new Vector2(15.18, -3.02),
        new Vector2(15.18, 3.02),
      ],
      96,
    ),
    'darkMetal',
  );
  inner.position.z = 0;
  // A polished top ring: the line of light that says "case", not "rubber".
  const topRing = bandBuild.mesh(
    latheAlongZ(
      [
        new Vector2(15.55, 3.09),
        new Vector2(16.2, 3.09),
        new Vector2(16.2, 2.96),
        new Vector2(15.55, 2.96),
        new Vector2(15.55, 3.09),
      ],
      128,
    ),
    'gold',
  );
  topRing.position.z = 0;

  // Lug horns: four of them, left bare so the case reads as an object.
  const lugGeometry = extrudeShape(lugShape(), {
    depth: 1.7,
    bevelSize: 0.22,
    bevelThickness: 0.2,
    bevelSegments: 3,
    curveSegments: 20,
  });
  const lugsBuild = ctx.part('lugs', { x: 0, y: 18.4, z: 1.9 });
  for (const side of [-1, 1]) {
    for (const x of [-6.8, 6.8]) {
      const lug = lugsBuild.mesh(lugGeometry, 'gold');
      lug.position.set(x, side * 17.2, 2.1);
      lug.rotation.z = side * 0.12;
      lug.scale.set(1, 1, 1);
    }
  }

  // A thin polished ring that carries the crystal.
  const crystalBuild = ctx.part('crystal', { x: 0, y: 0, z: LAYOUT.crystal.z });
  const bezel = crystalBuild.mesh(
    extrudeShape(ringShape(15.55, 15.0), {
      depth: 0.48,
      bevelSize: 0.09,
      bevelThickness: 0.08,
      bevelSegments: 2,
      curveSegments: 120,
    }),
    ['polishedSteel', 'anglage'],
  );
  bezel.position.z = 3.32;

  // A shallow dome: sapphire should catch the studio lights in one long sweep.
  const dome = new Mesh(new SphereGeometry(15.05, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2), ctx.finishes.create('sapphire'));
  dome.scale.y = 0.075;
  dome.rotation.x = Math.PI / 2;
  dome.position.z = 3.42;
  dome.renderOrder = 10;
  crystalBuild.add(dome);

  // A polished aperture ring at the movement edge, where the plate meets the
  // holder. It reads as the last mechanical line before the glass.
  const rim = bandBuild.mesh(extudeAnnulus(15.62, 15.08, 0.16), 'polishedSteel');
  rim.position.z = 3.09;

  // The crown neck, a short polished tube from the band to the fluted crown.
  const neck = bandBuild.mesh(new CylinderGeometry(0.95, 1.0, 2.6, 24), 'polishedSteel');
  neck.rotation.z = Math.PI / 2;
  neck.position.set(18.3, 0.55, 1.1);
}

/** A lug horn: wide where it meets the band, tapered to a rounded tip. */
function lugShape(): Shape {
  const shape = new Shape();
  shape.moveTo(-0.9, -1.9);
  shape.lineTo(0.9, -1.9);
  shape.quadraticCurveTo(1.05, 0.3, 0.9, 1.4);
  shape.quadraticCurveTo(0.75, 2.1, 0, 2.1);
  shape.quadraticCurveTo(-0.75, 2.1, -0.9, 1.4);
  shape.quadraticCurveTo(-1.05, 0.3, -1.1, -1.9);
  shape.closePath();
  return shape;
}

function extudeAnnulus(outer: number, inner: number, depth: number) {
  return extrudeShape(ringShape(outer, inner), {
    depth,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    curveSegments: 120,
  });
}
