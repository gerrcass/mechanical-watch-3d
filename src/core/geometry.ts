import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Path,
  Shape,
  Vector2,
} from 'three';

export interface ExtrudeOptions {
  /** Extrusion depth in millimetres. */
  readonly depth: number;
  readonly bevelSize?: number;
  readonly bevelThickness?: number;
  readonly bevelSegments?: number;
  readonly curveSegments?: number;
}

/**
 * Extrude a 2D shape along +Z and centre it. The bevel is the anglage: a real
 * 45° chamfer catches a different highlight than the flat face, which is why
 * the finished parts read as machined metal rather than stickers.
 */
export function extrudeShape(shape: Shape, options: ExtrudeOptions): ExtrudeGeometry {
  const geometry = new ExtrudeGeometry(shape, {
    depth: options.depth,
    bevelEnabled: true,
    bevelSize: options.bevelSize ?? 0.14,
    bevelThickness: options.bevelThickness ?? 0.12,
    bevelSegments: options.bevelSegments ?? 2,
    curveSegments: options.curveSegments ?? 28,
    steps: 1,
  });
  geometry.translate(0, 0, -options.depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export function discShape(radius: number): Shape {
  const shape = new Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape;
}

export function ringShape(outer: number, inner: number): Shape {
  const shape = discShape(outer);
  const hole = new Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

/** A sector-shaped hole, used for the crossings in a wheel. */
export function sectorHole(innerRadius: number, outerRadius: number, start: number, end: number): Path {
  const path = new Path();
  path.absarc(0, 0, innerRadius, start, end, false);
  path.absarc(0, 0, outerRadius, end, start, true);
  path.closePath();
  return path;
}

/** Sample a closed Catmull-Rom spline through the given points. */
export function closedSpline(points: Vector2[], samplesPerSegment = 8): Vector2[] {
  const out: Vector2[] = [];
  const count = points.length;
  for (let i = 0; i < count; i += 1) {
    const p0 = points[(i - 1 + count) % count] as Vector2;
    const p1 = points[i] as Vector2;
    const p2 = points[(i + 1) % count] as Vector2;
    const p3 = points[(i + 2) % count] as Vector2;
    for (let s = 0; s < samplesPerSegment; s += 1) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push(new Vector2(x, y));
    }
  }
  return out;
}

/** An organic pierced opening described in polar coordinates. */
export function organicHole(
  centerRadius: number,
  centerAngle: number,
  angularSpan: number,
  radialSpan: number,
): Path {
  const points: Vector2[] = [];
  const steps = 14;
  const tangential = (angularSpan * centerRadius) / 2;
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    // A superellipse in the local radial/tangential frame, with a little
    // hand-cut wobble so the skeleton does not read as a machine stamping.
    const wobble = 1 + Math.sin(t * 3 + centerAngle) * 0.07 + Math.cos(t * 2) * 0.04;
    const radial = Math.cos(t) * (radialSpan / 2) * wobble;
    const along = Math.sin(t) * tangential * wobble;
    const angle = centerAngle + along / centerRadius;
    const radius = centerRadius + radial;
    points.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  const path = new Path();
  path.setFromPoints(closedSpline(points, 3));
  path.closePath();
  return path;
}

export type ToothStyle = 'involute' | 'escape' | 'ratchet';

export interface GearOptions {
  readonly teeth: number;
  /** Module in millimetres: pitch radius = module * teeth / 2. */
  readonly module: number;
  readonly boreRadius: number;
  readonly spokes?: number;
  /** 0–1: how much of the disc between hub and rim is removed. */
  readonly pierced?: number;
  readonly toothTipScale?: number;
  readonly toothStyle?: ToothStyle;
  readonly rimFraction?: number;
}

/**
 * A wheel outline: trapezoidal teeth with slanted flanks around a pierced
 * disc. The crossing windows are real holes, so the extruded bevel runs round
 * every spoke instead of being painted on.
 */
export function gearShape(options: GearOptions): Shape {
  const { teeth, module, boreRadius } = options;
  const pitchRadius = (module * teeth) / 2;
  const addendum = module * (options.toothTipScale ?? 1.05);
  const dedendum = module * 1.3;
  const rootRadius = pitchRadius - dedendum;
  const tipRadius = pitchRadius + addendum;
  const pitch = (Math.PI * 2) / teeth;

  const shape = new Shape();
  const flank = Math.min(pitch * 0.3, 0.16);
  const style = options.toothStyle ?? 'involute';
  for (let tooth = 0; tooth < teeth; tooth += 1) {
    const angle = tooth * pitch;
    let points: Array<[number, number]>;
    if (style === 'escape') {
      // Escape-wheel teeth lean forward and finish in a sharp impulse face.
      points = [
        [rootRadius, angle - pitch * 0.5],
        [rootRadius, angle - pitch * 0.3],
        [tipRadius * 0.97, angle - pitch * 0.02],
        [tipRadius, angle + pitch * 0.08],
        [rootRadius + (tipRadius - rootRadius) * 0.35, angle + pitch * 0.28],
        [rootRadius, angle + pitch * 0.4],
      ];
    } else if (style === 'ratchet') {
      // Ratchet teeth: a steep locking face and a long ramp the click climbs.
      points = [
        [rootRadius, angle - pitch * 0.5],
        [rootRadius, angle - pitch * 0.18],
        [tipRadius, angle - pitch * 0.12],
        [tipRadius, angle + pitch * 0.04],
        [rootRadius, angle + pitch * 0.44],
      ];
    } else {
      points = [
        [rootRadius, angle - pitch * 0.5],
        [rootRadius, angle - pitch * 0.34],
        [tipRadius * 0.985, angle - flank],
        [tipRadius, angle - flank * 0.45],
        [tipRadius, angle + flank * 0.45],
        [tipRadius * 0.985, angle + flank],
        [rootRadius, angle + pitch * 0.34],
      ];
    }
    for (const [radius, pointAngle] of points) {
      const x = Math.cos(pointAngle) * radius;
      const y = Math.sin(pointAngle) * radius;
      if (tooth === 0 && points.length > 0 && radius === points[0]?.[0] && pointAngle === points[0]?.[1]) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const spokes = options.spokes ?? 5;
  if (spokes > 0 && (options.pierced ?? 1) > 0) {
    const hub = Math.max(boreRadius * 2.1, pitchRadius * 0.2);
    const rim = Math.min(rootRadius * 0.9, pitchRadius * (options.rimFraction ?? 0.82));
    for (let i = 0; i < spokes; i += 1) {
      const center = (i / spokes) * Math.PI * 2 + pitch / 2;
      const half = (Math.PI / spokes) * 0.72;
      shape.holes.push(sectorHole(hub, rim, center - half, center + half));
    }
  }
  const bore = new Path();
  bore.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(bore);
  return shape;
}

/** A pinion: the same language as a wheel, at a scale you can feel with a finger. */
export function pinionShape(leaves: number, module: number): Shape {
  return gearShape({ teeth: leaves, module, boreRadius: module * 0.5, spokes: 0, toothTipScale: 1.15 });
}

/** A tapered baton hand with a counterweight tail, extruded and bevelled. */
export function handShape(options: {
  length: number;
  width: number;
  tail: number;
  tipWidth?: number;
  counterweight?: number;
  holeRadius?: number;
}): Shape {
  const { length, width, tail } = options;
  const tipWidth = options.tipWidth ?? width * 0.18;
  const shape = new Shape();
  shape.moveTo(-width * 0.5, -tail);
  shape.lineTo(-width * 0.34, -tail * 0.3);
  shape.lineTo(-width * 0.5, length * 0.22);
  shape.lineTo(-width * 0.32, length * 0.72);
  shape.lineTo(-tipWidth * 0.5, length * 0.97);
  shape.lineTo(0, length);
  shape.lineTo(tipWidth * 0.5, length * 0.97);
  shape.lineTo(width * 0.32, length * 0.72);
  shape.lineTo(width * 0.5, length * 0.22);
  shape.lineTo(width * 0.34, -tail * 0.3);
  shape.lineTo(width * 0.5, -tail);
  shape.lineTo(0, -tail * 1.15);
  shape.closePath();
  if (options.counterweight) {
    const counter = new Path();
    counter.absarc(0, -tail * 0.55, options.counterweight, 0, Math.PI * 2, true);
    shape.holes.push(counter);
  }
  if (options.holeRadius) {
    const hole = new Path();
    hole.absarc(0, 0, options.holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

/**
 * A mainspring or hairspring as a flat spiral ribbon in the XY plane. A ribbon
 * seen from above is what spring steel actually looks like through an open
 * barrel; a tube would read as wire.
 */
export function spiralRibbonGeometry(options: {
  innerRadius: number;
  outerRadius: number;
  turns: number;
  width: number;
  segments?: number;
  z?: number;
  clockwise?: boolean;
}): BufferGeometry {
  const { innerRadius, outerRadius, turns, width } = options;
  const segments = options.segments ?? Math.max(180, Math.round(turns * 54));
  const sign = options.clockwise ? -1 : 1;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = sign * t * turns * Math.PI * 2;
    const radius = innerRadius + (outerRadius - innerRadius) * t;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const inner = radius - width / 2;
    const outer = radius + width / 2;
    positions.push(cos * inner, sin * inner, 0, cos * outer, sin * outer, 0);
    normals.push(0, 0, 1, 0, 0, 1);
    uvs.push(t, 0, t, 1);
    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  if (options.z !== undefined) geometry.translate(0, 0, options.z);
  return geometry;
}

/**
 * A bridge arm: a smooth centreline offset by a half-width that can vary along
 * the path. This is how a shaped bridge is actually drawn — the outline is the
 * consequence of the load path, not a rectangle with corners.
 */
export function ribbonShape(points: Vector2[], widths: number[]): Shape {
  const sampled = closedSplineOpen(points, 10);
  const left: Vector2[] = [];
  const right: Vector2[] = [];
  for (let i = 0; i < sampled.length; i += 1) {
    const point = sampled[i] as Vector2;
    const next = sampled[Math.min(sampled.length - 1, i + 1)] as Vector2;
    const previous = sampled[Math.max(0, i - 1)] as Vector2;
    const tangent = new Vector2(next.x - previous.x, next.y - previous.y).normalize();
    const normal = new Vector2(-tangent.y, tangent.x);
    const t = i / (sampled.length - 1);
    const width = widths[Math.min(widths.length - 1, Math.floor(t * (widths.length - 1)))] ?? 1;
    left.push(point.clone().addScaledVector(normal, width / 2));
    right.push(point.clone().addScaledVector(normal, -width / 2));
  }
  const shape = new Shape();
  shape.setFromPoints([...left, ...right.reverse()]);
  shape.closePath();
  return shape;
}

/** An open Catmull-Rom spline through control points. */
export function closedSplineOpen(points: Vector2[], samplesPerSegment = 8): Vector2[] {
  if (points.length < 2) return points;
  const extended = [points[0] as Vector2, ...points, points[points.length - 1] as Vector2];
  const out: Vector2[] = [];
  for (let i = 1; i < extended.length - 2; i += 1) {
    const p0 = extended[i - 1] as Vector2;
    const p1 = extended[i] as Vector2;
    const p2 = extended[i + 1] as Vector2;
    const p3 = extended[i + 2] as Vector2;
    for (let s = 0; s < samplesPerSegment; s += 1) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        new Vector2(
          0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        ),
      );
    }
  }
  out.push(points[points.length - 1] as Vector2);
  return out;
}

/** A rounded rectangle, for applied indices and hands. */
export function roundedRectShape(width: number, height: number, radius: number): Shape {
  const shape = new Shape();
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, Math.min(halfW, halfH));
  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  shape.lineTo(halfW, halfH - r);
  shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  shape.lineTo(-halfW + r, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  shape.lineTo(-halfW, -halfH + r);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
  shape.closePath();
  return shape;
}

/** A screw: bevelled head, thin shank, with a milled slot modelled separately. */
export function screwProfile(radius: number): Vector2[] {
  return [
    new Vector2(0, 0.16),
    new Vector2(radius * 0.45, 0.155),
    new Vector2(radius * 0.74, 0.1),
    new Vector2(radius, 0.02),
    new Vector2(radius, -0.1),
    new Vector2(radius * 0.92, -0.2),
    new Vector2(0, -0.2),
  ];
}

export function latheGeometry(profile: Vector2[], segments = 48): LatheGeometry {
  const geometry = new LatheGeometry(profile, segments);
  geometry.computeVertexNormals();
  return geometry;
}

/** Lathe a profile drawn around +Y and lay it along +Z, the watch axis. */
export function latheAlongZ(profile: Vector2[], segments = 48): BufferGeometry {
  const geometry = latheGeometry(profile, segments);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** Jewel bearing profile: an olive with a polished crown. */
export function jewelProfile(radius: number): Vector2[] {
  return [
    new Vector2(0, radius * 0.3),
    new Vector2(radius * 0.55, radius * 0.28),
    new Vector2(radius * 0.9, radius * 0.16),
    new Vector2(radius, 0),
    new Vector2(radius * 0.82, -radius * 0.18),
    new Vector2(radius * 0.4, -radius * 0.26),
    new Vector2(0, -radius * 0.28),
  ];
}

/** Anglage profile for a circular gold chaton. */
export function chatonProfile(radius: number, height: number): Vector2[] {
  return [
    new Vector2(radius * 0.72, height),
    new Vector2(radius * 0.96, height),
    new Vector2(radius, height - 0.06),
    new Vector2(radius, 0),
    new Vector2(radius * 0.8, -0.04),
    new Vector2(radius * 0.72, 0),
  ];
}
