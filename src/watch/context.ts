import {
  Group,
  Mesh,
  MeshPhysicalMaterial,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three';
import { requirePart, type PartCatalogueEntry } from '../calibre/catalogue';
import type { FinishLibrary, FinishName } from '../core/materials';
import { explosionOffset } from '../calibre/explosion';

export interface WatchAnimationState {
  /** 0–1 impulse while the crown is winding; decays after each press. */
  winding: number;
}

export interface PartHandle {
  readonly id: string;
  readonly entry: PartCatalogueEntry;
  readonly group: Group;
  readonly materials: MeshPhysicalMaterial[];
  readonly anchor: Vector3;
}

/**
 * A part under construction. Every mesh carries shadow flags, every material
 * is registered for the inspection dim, and the finished group is pickable by
 * its catalogue id.
 */
export class PartBuilder {
  readonly group = new Group();
  readonly materials: MeshPhysicalMaterial[] = [];

  constructor(
    readonly id: string,
    readonly entry: PartCatalogueEntry,
    readonly anchor: Vector3,
    private readonly finishes: FinishLibrary,
  ) {
    this.group.name = id;
    this.group.userData.partId = id;
  }

  mesh(geometry: BufferGeometry, finish: FinishName | readonly FinishName[]): Mesh {
    const finishes = Array.isArray(finish) ? finish : [finish];
    const materials: Material[] = finishes.map((name) => {
      const material = this.finishes.create(name as FinishName);
      this.materials.push(material);
      return material;
    });
    const mesh = new Mesh(geometry, materials.length === 1 ? (materials[0] as Material) : materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  /** Add an already-built object, collecting its physical materials. */
  add(object: Object3D): Object3D {
    object.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const material = child.material;
        const list = Array.isArray(material) ? material : [material];
        for (const candidate of list) {
          if (candidate instanceof MeshPhysicalMaterial) this.materials.push(candidate);
        }
      }
    });
    this.group.add(object);
    return object;
  }
}

/**
 * The registry is the only place the scene knows the catalogue. Parts are
 * groups in watch space; the explosion offsets the whole group along Z.
 */
export class WatchContext {
  private readonly builders = new Map<string, PartBuilder>();
  private readonly built = new Map<string, PartHandle>();
  readonly updaters: Array<(displaySeconds: number, reserveHours: number, animation: WatchAnimationState) => void> = [];

  constructor(readonly finishes: FinishLibrary) {}

  /** Builders register their per-frame motion against the display clock. */
  onUpdate(updater: (displaySeconds: number, reserveHours: number, animation: WatchAnimationState) => void): void {
    this.updaters.push(updater);
  }

  part(id: string, anchor: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }): PartBuilder {
    const existing = this.builders.get(id);
    if (existing) return existing;
    const builder = new PartBuilder(id, requirePart(id), new Vector3(anchor.x, anchor.y, anchor.z), this.finishes);
    this.builders.set(id, builder);
    return builder;
  }

  finishParts(): PartHandle[] {
    for (const [id, builder] of this.builders) {
      if (this.built.has(id)) continue;
      // Collect every physical material in the group, including ones created
      // directly by builders that needed a shared finish (arms, springs).
      const materials = new Set(builder.materials);
      builder.group.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        const list = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of list) {
          if (material instanceof MeshPhysicalMaterial) materials.add(material);
        }
      });
      this.built.set(id, {
        id,
        entry: builder.entry,
        group: builder.group,
        materials: [...materials],
        anchor: builder.anchor,
      });
    }
    return [...this.built.values()];
  }

  get(id: string): PartHandle | undefined {
    return this.built.get(id);
  }

  applyExplosion(amount: number): void {
    for (const handle of this.built.values()) {
      handle.group.position.z = explosionOffset(handle.entry, amount);
    }
  }
}
