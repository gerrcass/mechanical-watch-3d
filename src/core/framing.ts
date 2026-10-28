import { Vector3 } from 'three';

/**
 * The hero camera is fitted to the viewport rather than hard-coded: a 39 mm
 * watch has to sit in the frame with air around it at every aspect, and the
 * inspector needs the right third of a desktop viewport.
 */
export const WATCH_CONTENT_RADIUS = 21.6;

export interface HomeFit {
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly distance: number;
}

const VIEW_DIRECTION = new Vector3(0.29, -0.38, 0.878).normalize();

export function fitHome(aspect: number, fovDegrees = 24): HomeFit {
  const tan = Math.tan((fovDegrees * Math.PI) / 360);
  // Vertical fill on a landscape screen; horizontal fill on a portrait one.
  const verticalFill = aspect > 1.05 ? 0.8 : 0.86;
  const horizontalFill = aspect > 1.05 ? 0.86 : 0.94;
  const visibleHeight = Math.max(
    (WATCH_CONTENT_RADIUS * 2) / verticalFill,
    (WATCH_CONTENT_RADIUS * 2) / (horizontalFill * aspect),
  );
  const distance = visibleHeight / (2 * tan);
  // Portrait screens carry a bottom sheet: lift the composition.
  const lift = aspect < 0.9 ? -visibleHeight * 0.075 : 0;
  const target = new Vector3(1.5, -1.1 + lift, 0.4);
  const position = target.clone().addScaledVector(VIEW_DIRECTION, distance);
  return { position: [position.x, position.y, position.z], target: [target.x, target.y, target.z], distance };
}
