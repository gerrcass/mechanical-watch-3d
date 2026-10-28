import { Vector3, type PerspectiveCamera } from 'three';

interface LabelAnchor {
  readonly id: string;
  readonly text: string;
  readonly position: Vector3;
  baseZ: number;
}

/**
 * Optional 3D labels. They are decorative: every name is also in the catalogue,
 * the inspector and the fallback list. Positions are projected from part
 * anchors each frame; nothing is allocated in the loop.
 */
export class Labels {
  private readonly root: HTMLElement;
  private readonly anchors: LabelAnchor[] = [];
  private readonly elements = new Map<string, HTMLElement>();
  private readonly projected = new Vector3();
  private visible = false;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  add(id: string, text: string, position: Vector3): void {
    const element = document.createElement('span');
    element.className = 'label';
    element.textContent = text;
    this.root.append(element);
    this.elements.set(id, element);
    this.anchors.push({ id, text, position, baseZ: position.z });
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.classList.toggle('is-visible', visible);
  }

  setLift(id: string, z: number): void {
    const anchor = this.anchors.find((candidate) => candidate.id === id);
    if (anchor) anchor.position.z = anchor.baseZ + z;
  }

  update(camera: PerspectiveCamera, width: number, height: number, rightInset = 0): void {
    if (!this.visible) return;
    for (const anchor of this.anchors) {
      const element = this.elements.get(anchor.id);
      if (!element) continue;
      this.projected.copy(anchor.position).project(camera);
      const behind = this.projected.z > 1;
      const x = (this.projected.x * 0.5 + 0.5) * width;
      const y = (-this.projected.y * 0.5 + 0.5) * height;
      if (behind || x < 60 || x > width - 60 - rightInset || y < 40 || y > height - 40) {
        element.style.opacity = '0';
        continue;
      }
      element.style.opacity = '1';
      element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }
}
