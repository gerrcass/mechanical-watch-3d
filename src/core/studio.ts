import {
  BackSide,
  DoubleSide,
  PointLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  type MeshPhysicalMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Vector3,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { createBackdropTexture, createShadowTexture } from './textures';
import { QUALITY, type QualityTier } from '../calibre/quality';

/**
 * A studio built out of emissive geometry and captured into an environment
 * map at boot. Long strip lights are what give polished steel its streaks;
 * a plain HDRI would not put the highlights where the composition needs them.
 */
export class Studio {
  readonly group = new Scene();
  readonly keyLight: DirectionalLight;
  readonly fillLight: DirectionalLight;
  readonly rimLight: DirectionalLight;
  readonly environment: Texture;
  private readonly backdropMaterial: MeshBasicMaterial;
  private readonly shadowMaterial: MeshBasicMaterial;
  private readonly studioScene: Scene;
  private readonly pmrem: PMREMGenerator;
  private readonly disposables: Array<{ dispose: () => void }> = [];

  constructor(renderer: WebGLRenderer, tier: QualityTier) {
    this.pmrem = new PMREMGenerator(renderer);
    this.studioScene = this.buildEnvironmentScene();
    this.environment = this.pmrem.fromScene(this.studioScene, 0.035).texture;
    this.disposables.push(this.environment);

    const backdropTexture = createBackdropTexture(1024);
    this.backdropMaterial = new MeshBasicMaterial({
      map: backdropTexture,
      depthWrite: false,
      toneMapped: true,
    });
    const backdrop = new Mesh(new PlaneGeometry(420, 320), this.backdropMaterial);
    backdrop.position.set(0, 0, -80);
    backdrop.name = 'backdrop';
    this.group.add(backdrop);

    const shadowTexture = createShadowTexture(512);
    this.shadowMaterial = new MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      color: 0x000000,
      toneMapped: true,
    });
    const shadow = new Mesh(new PlaneGeometry(90, 78), this.shadowMaterial);
    shadow.position.set(-4.5, -8.5, -14);
    shadow.name = 'contact-shadow';
    this.group.add(shadow);

    this.keyLight = new DirectionalLight(0xfff0da, 2.4);
    this.keyLight.position.set(-24, 34, 30);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(tier === 'lite' ? 1024 : 2048, tier === 'lite' ? 1024 : 2048);
    this.keyLight.shadow.camera.left = -30;
    this.keyLight.shadow.camera.right = 30;
    this.keyLight.shadow.camera.top = 30;
    this.keyLight.shadow.camera.bottom = -30;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 110;
    this.keyLight.shadow.bias = -0.00035;
    this.keyLight.shadow.normalBias = 0.035;
    this.keyLight.shadow.radius = 3;
    this.group.add(this.keyLight);

    this.fillLight = new DirectionalLight(0xa9c4e6, 1.1);
    this.fillLight.position.set(32, -16, 18);
    this.group.add(this.fillLight);

    this.rimLight = new DirectionalLight(0xffd6a1, 1.6);
    this.rimLight.position.set(4, -36, -2);
    this.group.add(this.rimLight);

    const ambient = new HemisphereLight(0x323a42, 0x040506, 0.18);
    this.group.add(ambient);

    // A jeweller's lamp in front of the movement: lifts the dial side without
    // touching the backdrop. No shadow map, so it costs one light loop only.
    const lamp = new PointLight(0xfff1dc, 520, 110, 2);
    lamp.position.set(6, 9, 26);
    this.group.add(lamp);
    const fillLamp = new PointLight(0x9fc2e8, 140, 90, 2);
    fillLamp.position.set(-16, -4, 22);
    this.group.add(fillLamp);
    this.disposables.push(lamp, fillLamp);
    this.disposables.push(this.backdropMaterial, this.shadowMaterial);
    this.disposables.push({ dispose: () => this.keyLight.shadow.dispose() });
  }

  private buildEnvironmentScene(): Scene {
    const scene = new Scene();
    scene.background = new Color(0x020304);
    const shellGeometry = new BoxGeometry(160, 160, 160);
    const shellMaterial = new MeshBasicMaterial({ color: 0x030405, side: BackSide });
    scene.add(new Mesh(shellGeometry, shellMaterial));
    this.disposables.push(shellGeometry, shellMaterial);

    const panel = (width: number, height: number, color: number, intensity: number, position: [number, number, number], rotation: [number, number, number]) => {
      const geometry = new PlaneGeometry(width, height);
      const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });
      const mesh = new Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      scene.add(mesh);
      this.disposables.push(geometry, material);
    };

    // Key softbox: a broad warm card above and to the right of the watch.
    panel(96, 40, 0xfff2df, 3.0, [-24, 62, 46], [-Math.PI / 3.1, -0.2, 0]);
    // Fill: a cooler, larger card on the left.
    panel(80, 60, 0xa9c6ec, 1.0, [62, 0, 22], [0, -Math.PI / 2.2, 0]);
    // Rim strip behind the watch, low, to draw the case edge.
    panel(110, 10, 0xffd9a8, 2.6, [6, -6, -70], [0, 0, 0]);
    // Narrow specular strips: the long highlights that sell polished steel.
    panel(78, 2.4, 0xffffff, 7.5, [4, 38, 56], [-Math.PI / 3.4, 0, 0.06]);
    panel(2.6, 52, 0xffffff, 5.0, [-26, 10, 54], [0, -0.2, 0]);
    panel(2.2, 26, 0xffe4bd, 4.0, [44, -2, 30], [0, -Math.PI / 2.6, 0]);
    // A dim bounce card underneath so the underside of the case is not black.
    panel(70, 40, 0x6c7a8c, 0.45, [0, -52, 20], [Math.PI / 2.4, 0, 0]);
    // A large frontal scrim: the light tent that makes a movement legible.
    // A softer frontal scrim, just enough to read into the shadows.
    panel(120, 70, 0xf0e9dc, 0.55, [0, 6, 92], [0, Math.PI, 0]);

    return scene;
  }

  dispose(): void {
    this.pmrem.dispose();
    for (const disposable of this.disposables) disposable.dispose();
  }
}

/** Compose the sky pool with the stage: this is the scene half of the vitrine. */
export function createStudioScene(renderer: WebGLRenderer, tier: QualityTier): {
  scene: Scene;
  studio: Studio;
  camera: PerspectiveCamera;
} {
  const scene = new Scene();
  const studio = new Studio(renderer, tier);
  scene.add(studio.group);
  scene.environment = studio.environment;
  scene.environmentIntensity = 0.9;

  const camera = new PerspectiveCamera(24, 16 / 9, 1, 700);
  camera.position.set(40, -50, 143);
  camera.lookAt(new Vector3(1.5, -1.1, 0.4));
  return { scene, studio, camera };
}

export function qualitySettings(tier: QualityTier) {
  return QUALITY[tier];
}

export function applyMaterialDim(material: MeshPhysicalMaterial, factor: number): void {
  const base = material.userData.baseColor as Color | undefined;
  if (base) material.color.copy(base).multiplyScalar(factor);
}
