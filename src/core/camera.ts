import { Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface CameraPose {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A damped camera flight that owns the controls while it runs. It always
 * arrives at a valid target/up configuration, so a locate or a tour stop can
 * never leave the orbit camera pointing at nothing.
 */
export class CameraFlight {
  private readonly fromPosition = new Vector3();
  private readonly fromTarget = new Vector3();
  private readonly toPosition = new Vector3();
  private readonly toTarget = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;
  private elapsed = 0;
  private duration = 0.9;
  active = false;

  constructor(camera: PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
  }

  get isActive(): boolean {
    return this.active;
  }

  flyTo(pose: CameraPose, immediate = false): void {
    this.fromPosition.copy(this.camera.position);
    this.fromTarget.copy(this.controls.target);
    this.toPosition.set(...pose.position);
    this.toTarget.set(...pose.target);
    this.elapsed = 0;
    this.duration = immediate ? 0 : 0.9;
    if (immediate || this.duration === 0) {
      this.snap();
      return;
    }
    this.active = true;
    this.controls.enabled = false;
    this.controls.autoRotate = false;
  }

  private snap(): void {
    this.camera.position.copy(this.toPosition);
    this.controls.target.copy(this.toTarget);
    this.camera.up.copy(this.up);
    this.camera.lookAt(this.controls.target);
    this.camera.updateMatrixWorld();
    this.controls.update();
  }

  update(delta: number): boolean {
    if (!this.active) return false;
    this.elapsed = Math.min(this.duration, this.elapsed + delta);
    const t = easeInOut(this.elapsed / this.duration);
    this.camera.position.lerpVectors(this.fromPosition, this.toPosition, t);
    this.controls.target.lerpVectors(this.fromTarget, this.toTarget, t);
    // Keep the camera's roll zeroed through the flight.
    this.camera.up.copy(this.up);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
    if (this.elapsed >= this.duration) {
      this.active = false;
      this.controls.enabled = true;
      this.snap();
    }
    return true;
  }
}
