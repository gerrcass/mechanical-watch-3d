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
  | 'handGold'
  | 'roseGold'
  | 'casePolished'
  | 'caseBrushed'
  | 'caseBack'
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
  readonly colorMap?: 'perlage' | 'cotes' | 'circular' | 'sunray';
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
  polishedSteel: { color: 0xd3d9df, metalness: 1, roughness: 0.1, envMapIntensity: 1.1 },
  anglage: { color: 0xe2d2b0, metalness: 1, roughness: 0.06, envMapIntensity: 1.15 },
  brushedSteel: { color: 0x8f959d, metalness: 1, roughness: 0.42, envMapIntensity: 0.7 },
  rhodium: { color: 0xa9b0b8, metalness: 1, roughness: 0.26, envMapIntensity: 0.85 },
  wheelFace: {
    color: 0xd0a75c,
    metalness: 1,
    roughness: 0.22,
    envMapIntensity: 1.15,
    bumpMap: 'circular',
    roughnessMap: 'circular',
    bumpScale: 0.012,
  },
  bridgeSatine: {
    color: 0x454c54,
    metalness: 1,
    roughness: 0.4,
    envMapIntensity: 0.35,
    bumpMap: 'cotes',
    bumpScale: 0.008,
  },
  rhodiumCotes: {
    color: 0x9aa1a8,
    metalness: 1,
    roughness: 0.4,
    envMapIntensity: 0.6,
    bumpMap: 'cotes',
    roughnessMap: 'cotes',
    bumpScale: 0.006,
  },
  platePerlage: {
    color: 0x4a525a,
    metalness: 0.34,
    roughness: 0.52,
    envMapIntensity: 0.72,
    bumpMap: 'perlage',
    colorMap: 'perlage',
    roughnessMap: 'perlage',
    bumpScale: 0.2,
  },
  gold: { color: 0xc09a55, metalness: 1, roughness: 0.27, envMapIntensity: 0.9 },
  handGold: { color: 0xc9a35c, metalness: 1, roughness: 0.32, envMapIntensity: 0.75 },
  roseGold: { color: 0xc08a6a, metalness: 1, roughness: 0.22, envMapIntensity: 0.9 },
  casePolished: { color: 0xd3b67f, metalness: 1, roughness: 0.12, envMapIntensity: 1.15 },
  caseBrushed: { color: 0xc6ad82, metalness: 1, roughness: 0.28, envMapIntensity: 1.1 },
  caseBack: { color: 0x83888e, metalness: 1, roughness: 0.4, envMapIntensity: 0.65 },
  blued: {
    color: 0x1e3f6e,
    metalness: 0.9,
    roughness: 0.15,
    envMapIntensity: 1.05,
    clearcoat: 0.5,
  },
  ruby: {
    color: 0x9e0f27,
    metalness: 0.05,
    roughness: 0.05,
    envMapIntensity: 1.4,
    clearcoat: 1,
    emissive: 0x2a0208,
    emissiveIntensity: 0.32,
  },
  sapphire: {
    color: 0xdfeaf0,
    metalness: 0,
    roughness: 0.018,
    envMapIntensity: 0.5,
    clearcoat: 1,
    transparent: true,
    opacity: 0.045,
  },
  chapterDark: {
    color: 0x15181c,
    metalness: 0.2,
    roughness: 0.55,
    envMapIntensity: 0.6,
    clearcoat: 0.45,
    bumpMap: 'sunray',
    bumpScale: 0.004,
  },
  sunray: {
    color: 0xa79d8a,
    metalness: 1,
    roughness: 0.4,
    envMapIntensity: 0.75,
    bumpMap: 'sunray',
    bumpScale: 0.015,
  },
  ratchetFace: {
    color: 0x1d3b64,
    metalness: 0.92,
    roughness: 0.2,
    envMapIntensity: 1.5,
    bumpMap: 'sunray',
    roughnessMap: 'sunray',
    bumpScale: 0.015,
    clearcoat: 0.4,
  },
  darkMetal: { color: 0x2a2c30, metalness: 0.85, roughness: 0.34, envMapIntensity: 0.85 },
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
    const repeats: Record<MapKind, number> = { perlage: 0.1, cotes: 0.024, circular: 0.12, sunray: 0.2 };
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
    const colorKind = definition.colorMap;
    if (colorKind) material.map = this.textureFor(colorKind);
    material.userData.baseColor = new Color(definition.color);
    material.userData.baseEmissive = material.emissive.clone();
    material.userData.baseEmissiveIntensity = material.emissiveIntensity;
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

  /** A warm lifted glow on the selected part, restored exactly on clear. */
  setHighlight(material: MeshPhysicalMaterial, active: boolean): void {
    const base = material.userData.baseEmissive as Color | undefined;
    if (!base) return;
    if (active) {
      material.emissive.setHex(0x5a3c12);
      material.emissiveIntensity = 0.5;
    } else {
      material.emissive.copy(base);
      material.emissiveIntensity = (material.userData.baseEmissiveIntensity as number | undefined) ?? 0;
    }
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
