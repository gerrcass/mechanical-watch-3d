export type QualityTier = 'high' | 'lite';

export interface QualityInput {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly deviceMemory?: number;
  readonly hardwareConcurrency?: number;
  readonly coarsePointer?: boolean;
}

export interface QualitySettings {
  readonly tier: QualityTier;
  /** Renderer pixel-ratio cap. */
  readonly maxPixelRatio: number;
  readonly shadowMapSize: 1024 | 2048;
  readonly grain: boolean;
  readonly smaa: boolean;
  readonly outline: boolean;
}

export const QUALITY: Readonly<Record<QualityTier, QualitySettings>> = {
  high: {
    tier: 'high',
    maxPixelRatio: 2,
    shadowMapSize: 2048,
    grain: true,
    smaa: true,
    outline: true,
  },
  lite: {
    tier: 'lite',
    maxPixelRatio: 1.5,
    shadowMapSize: 1024,
    grain: false,
    smaa: false,
    outline: true,
  },
};

/**
 * Choose a tier before the first frame. A small viewport or a phone gets
 * `lite`; the render loop can also demote after sustained slow frames.
 */
export function selectQuality(input: QualityInput): QualityTier {
  const smallestSide = Math.min(input.width, input.height);
  if (smallestSide < 720) return 'lite';
  if (input.coarsePointer === true) return 'lite';
  if ((input.deviceMemory ?? 8) <= 4) return 'lite';
  if ((input.hardwareConcurrency ?? 8) <= 4) return 'lite';
  if (input.width < 900) return 'lite';
  return 'high';
}
