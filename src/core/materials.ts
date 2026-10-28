import {
  Color,
  MeshPhysicalMaterial,
  type Texture,
  type WebGLRenderer,
} from 'three';
import {
  createCircularGrainTexture,
  createCotesTexture,
  createPerlageTexture,
  createSunrayTexture,
} from './textures';

export type FinishName =
  | 'polishedSteel'
  | 'anglage'
  | 'brushedSteel'
  | 'rhodium'
  | 'rhodiumCotes'
  | 'bridgeSatine'
  | 'wheelFace'
  | 'platePerlage'
  | 'gold'
  | 'roseGold'
  | 'blued'
  | 'ruby'
  | 'sapphire'
  | 'sunray'
  | 'chapterDark'
  | 'ratchetFace'
  | 'darkMetal'
  | 'matteBlack'
  | 'ivory';

interface FinishDefinition {
  readonly color: number;
  readonly metalness: number;
  readonly roughness: number;
  readonly envMapIntensity: number;
  readonly bumpMap?: 'perlage' | 'cotes' | 'circular' | 'sunray';
  readonly roughnessMap?: 'perlage' | 'cotes' | 'circular' | 'sunray';
  readonly bumpScale?: number;
  readonly clearcoat?: number;
  readonly transparent?: boolean;
  readonly opacity?: number;
  readonly emissive?: number;
  readonly emissiveIntensity?: number;
}

/**
 * Physical finishes, measured rather than invented: polished steel lives in a
 * narrow low-roughness band, rhodium a touch duller, blued steel is an oxide
 * film over polished metal. A new finish is only justified by a visible
 * difference on the watch.
 */
const FINISHES: Readonly<Record<FinishName, FinishDefinition>> = {
  polishedSteel: { color: 0xd0d6dd, metalness: 1, roughness: 0.12, envMapIntensity: 1.0 },
  anglage: { color: 0xf2f6fa, metalness: 1, roughness: 0.045, envMapIntensity: 1.8 },
  brushedSteel: { color: 0xa6acb4, metalness: 1, roughness: 0.38, envMapIntensity: 0.75 },
  rhodium: { color: 0xbcc2c9, metalness: 1, roughness: 0.24, envMapIntensity: 0.9 },
  wheelFace: {
    color: 0xc9a462,
    metalness: 1,
    roughness: 0.26,
    envMapIntensity: 1.1,
    bumpMap: 'circular',
    roughnessMap: 'circular',
    bumpScale: 0.018,
  },
  bridgeSatine: {
    color: 0xb2b8bf,
    metalness: 1,
    roughness: 0.36,
    envMapIntensity: 0.85,
    bumpMap: 'cotes',
    roughnessMap: 'cotes',
    bumpScale: 0.008,
  },
  rhodiumCotes: {
    color: 0xaeb4ba,
    metalness: 1,
    roughness: 0.46,
    envMapIntensity: 0.55,
    bumpMap: 'cotes',
    roughnessMap: 'cotes',
    bumpScale: 0.035,
  },
  platePerlage: {
    color: 0x3d4349,
    metalness: 1,
    roughness: 0.62,
    envMapIntensity: 0.5,
    bumpMap: 'perlage',
    roughnessMap: 'perlage',
    bumpScale: 0.09,
  },
  gold: { color: 0xd2a95c, metalness: 1, roughness: 0.19, envMapIntensity: 1.0 },
  roseGold: { color: 0xc98c68, metalness: 1, roughness: 0.22, envMapIntensity: 0.9 },
  blued: {
    color: 0x2b4d82,
    metalness: 0.92,
    roughness: 0.16,
    envMapIntensity: 1.0,
    clearcoat: 0.55,
  },
  ruby: {
    color: 0x9c1029,
    metalness: 0.05,
    roughness: 0.055,
    envMapIntensity: 1.5,
    clearcoat: 1,
    emissive: 0x3b0410,
    emissiveIntensity: 0.55,
  },
  sapphire: {
    color: 0xcfe2ea,
    metalness: 0,
    roughness: 0.015,
    envMapIntensity: 1.6,
    clearcoat: 1,
    transparent: true,
    opacity: 0.16,
  },
  chapterDark: {
    color: 0x23262a,
    metalness: 0.75,
    roughness: 0.34,
    envMapIntensity: 0.7,
    clearcoat: 0.4,
  },
  sunray: {
    color: 0xb2a894,
    metalness: 1,
    roughness: 0.38,
    envMapIntensity: 0.8,
    bumpMap: 'sunray',
    bumpScale: 0.02,
  },
  ratchetFace: {
    color: 0x2b4d82,
    metalness: 0.92,
    roughness: 0.22,
    envMapIntensity: 1.5,
    bumpMap: 'sunray',
    roughnessMap: 'sunray',
    bumpScale: 0.02,
    clearcoat: 0.4,
  },
  darkMetal: { color: 0x2a2c30, metalness: 0.85, roughness: 0.32, envMapIntensity: 0.9 },
  matteBlack: { color: 0x0b0c0e, metalness: 0.2, roughness: 0.72, envMapIntensity: 0.4 },
  ivory: { color: 0xefe6d4, metalness: 0.1, roughness: 0.38, envMapIntensity: 0.8 },
};

type MapKind = 'perlage' | 'cotes' | 'circular' | 'sunray';

/**
 * Materials are cloned per part so the inspection state can dim an individual
 * component. The physical parameters and all textures remain shared, so a
 * finish change still propagates from this one table.
 */
export class FinishLibrary {
  private readonly sources = new Map<MapKind, Texture>();
  private readonly textures = new Map<MapKind | 'ratchet', Texture>();
  private readonly materials = new Set<MeshPhysicalMaterial>();
  private readonly renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const sources: Record<MapKind, () => Texture> = {
      perlage: () => createPerlageTexture(1024),
      cotes: () => createCotesTexture(1024),
      circular: () => createCircularGrainTexture(512),
      sunray: () => createSunrayTexture(1024),
    };
    const repeats: Record<MapKind, number> = { perlage: 0.1, cotes: 0.11, circular: 0.12, sunray: 1 };
    for (const kind of Object.keys(sources) as MapKind[]) {
      const texture = sources[kind]();
      texture.anisotropy = anisotropy;
      texture.repeat.set(repeats[kind], repeats[kind]);
      texture.offset.set(0.5, 0.5);
      this.sources.set(kind, texture);
      this.textures.set(kind, texture);
    }
    // The ratchet wheel's sunray grain is much finer than the chapter ring's.
    const ratchetSource = this.sources.get('sunray');
    if (ratchetSource) {
      const ratchet = ratchetSource.clone();
      ratchet.repeat.set(0.14, 0.14);
      ratchet.offset.set(0.5, 0.5);
      ratchet.anisotropy = anisotropy;
      ratchet.needsUpdate = true;
      this.textures.set('ratchet', ratchet);
    }
  }

  create(finish: FinishName): MeshPhysicalMaterial {
    const definition = FINISHES[finish];
    const material = new MeshPhysicalMaterial({
      color: definition.color,
      metalness: definition.metalness,
      roughness: definition.roughness,
      envMapIntensity: definition.envMapIntensity,
      clearcoat: definition.clearcoat ?? 0,
      clearcoatRoughness: 0.08,
      transparent: definition.transparent ?? false,
      opacity: definition.opacity ?? 1,
      emissive: definition.emissive ?? 0x000000,
      emissiveIntensity: definition.emissiveIntensity ?? 0,
      dithering: true,
      depthWrite: definition.transparent ? false : true,
    });
    const mapKind = finish === 'ratchetFace' ? 'ratchet' : definition.bumpMap;
    const bump = mapKind ? this.textureFor(mapKind) : undefined;
    if (bump && definition.bumpMap) {
      material.bumpMap = bump;
      material.bumpScale = definition.bumpScale ?? 0.02;
    }
    const roughnessKind = finish === 'ratchetFace' ? 'ratchet' : definition.roughnessMap;
    const roughnessMap = roughnessKind ? this.textureFor(roughnessKind) : undefined;
    if (roughnessMap && definition.roughnessMap) material.roughnessMap = roughnessMap;
    material.userData.baseColor = new Color(definition.color);
    material.userData.finish = finish;
    this.materials.add(material);
    return material;
  }

  private textureFor(kind: MapKind | 'ratchet'): Texture {
    const texture = this.textures.get(kind);
    if (!texture) throw new Error(`Missing procedural texture: ${kind}`);
    return texture;
  }

  /** Dim a part by darkening its colour; the physical response stays intact. */
  setDim(material: MeshPhysicalMaterial, factor: number): void {
    const base = material.userData.baseColor as Color | undefined;
    if (!base) return;
    material.color.copy(base).multiplyScalar(factor);
  }

  dispose(): void {
    for (const material of this.materials) material.dispose();
    this.materials.clear();
    for (const texture of this.sources.values()) texture.dispose();
    for (const texture of this.textures.values()) texture.dispose();
    this.sources.clear();
    this.textures.clear();
  }

  get maxAnisotropy(): number {
    return Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
  }
}
