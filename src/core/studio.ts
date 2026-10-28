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
  ShaderMaterial,
  SphereGeometry,
  Scene,
  Vector3,
  type Texture,
  type WebGLRenderer,
} from 'three';
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
  private readonly studioScene: Scene;
  private readonly pmrem: PMREMGenerator;
  private readonly disposables: Array<{ dispose: () => void }> = [];

  constructor(renderer: WebGLRenderer, tier: QualityTier) {
    this.pmrem = new PMREMGenerator(renderer);
    this.studioScene = this.buildEnvironmentScene();
    this.environment = this.pmrem.fromScene(this.studioScene, 0.035).texture;
    this.disposables.push(this.environment);

    this.keyLight = new DirectionalLight(0xfff2e4, 1.3);
    this.keyLight.position.set(-22, 31, 34);
    this.keyLight.castShadow = true;
    const shadowSize = QUALITY[tier].shadowMapSize;
    this.keyLight.shadow.mapSize.set(shadowSize, shadowSize);
    this.keyLight.shadow.camera.left = -34;
    this.keyLight.shadow.camera.right = 34;
    this.keyLight.shadow.camera.top = 34;
    this.keyLight.shadow.camera.bottom = -34;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 120;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.032;
    this.keyLight.shadow.radius = 4;
    this.group.add(this.keyLight);

    this.fillLight = new DirectionalLight(0x9db8e0, 0.8);
    this.fillLight.position.set(34, -12, 20);
    this.group.add(this.fillLight);

    this.rimLight = new DirectionalLight(0xffc98f, 1.35);
    this.rimLight.position.set(0, -34, 4);
    this.group.add(this.rimLight);

    // A raking card from the left: the perlage and the anglage only appear
    // when the light crosses them at a shallow angle.
    const rake = new DirectionalLight(0xffe7cd, 0.95);
    rake.position.set(-38, -18, 18);
    this.group.add(rake);
    const coolRake = new DirectionalLight(0x9fbbe8, 0.35);
    coolRake.position.set(36, -6, 16);
    this.group.add(coolRake);

    const ambient = new HemisphereLight(0x1b2430, 0x020203, 0.22);
    this.group.add(ambient);

    // A jeweller's lamp in front of the movement: lifts the dial side without
    // touching the backdrop. No shadow map, so it costs one light loop only.
    const lamp = new PointLight(0xfff1dc, 130, 120, 2);
    lamp.position.set(5, 9, 27);
    this.group.add(lamp);
    const fillLamp = new PointLight(0x9fc2e8, 95, 90, 2);
    fillLamp.position.set(-16, -4, 22);
    this.group.add(fillLamp);
    this.disposables.push(lamp, fillLamp);
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
    panel(120, 52, 0xfff2df, 3.2, [-24, 62, 46], [-Math.PI / 3.1, -0.2, 0]);
    // Fill: a cooler, larger card on the left.
    panel(90, 70, 0x9db8e0, 1.25, [62, 0, 22], [0, -Math.PI / 2.2, 0]);
    // Rim strip behind the watch, low, to draw the case edge.
    panel(110, 8, 0xffd9a8, 2.1, [6, -6, -70], [0, 0, 0]);
    // Narrow specular strips: the long highlights that sell polished steel.
    panel(90, 2.4, 0xffffff, 8.0, [4, 38, 56], [-Math.PI / 3.4, 0, 0.06]);
    panel(2.4, 58, 0xffffff, 5.0, [-26, 10, 54], [0, -0.2, 0]);
    panel(2.2, 30, 0xffe4bd, 4.0, [44, -2, 30], [0, -Math.PI / 2.6, 0]);
    // A dim bounce card underneath so the underside of the case is not black.
    panel(70, 40, 0x5c6a7a, 0.3, [0, -52, 20], [Math.PI / 2.4, 0, 0]);
    // A large frontal scrim: the light tent that makes a movement legible.
    panel(140, 80, 0xf0e9dc, 0.4, [0, 6, 92], [0, Math.PI, 0]);

    return scene;
  }

  track(...items: Array<{ dispose: () => void }>): void {
    this.disposables.push(...items);
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
  scene.background = new Color(0x06070a);
  scene.environment = studio.environment;
  scene.environmentIntensity = 0.95;

  // A gradient shell around the vitrine. It is inside the camera's far plane
  // and behind every object, so the composition has depth without a plane
  // edge appearing when the camera orbits.
  const shellGeometry = new SphereGeometry(300, 32, 18);
  const shellMaterial = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTop: { value: new Color(0x0b0e13) },
      uBottom: { value: new Color(0x020304) },
      uGlow: { value: new Color(0x2c2318) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uBottom;
      uniform vec3 uGlow;
      varying vec3 vWorld;
      void main() {
        float h = clamp(vWorld.y / 300.0 * 0.5 + 0.5, 0.0, 1.0);
        vec3 color = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
        float glow = exp(-dot(vWorld.xy - vec2(-55.0, 30.0), vWorld.xy - vec2(-55.0, 30.0)) / 36000.0);
        color += uGlow * glow * 0.85;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const shell = new Mesh(shellGeometry, shellMaterial);
  shell.renderOrder = -100;
  scene.add(shell);
  studio.track(shellGeometry, shellMaterial);

  const camera = new PerspectiveCamera(25, 16 / 9, 1, 700);
  camera.position.set(40, -50, 143);
  camera.lookAt(new Vector3(0.6, -0.9, 0.4));
  return { scene, studio, camera };
}

export function qualitySettings(tier: QualityTier) {
  return QUALITY[tier];
}

export function applyMaterialDim(material: MeshPhysicalMaterial, factor: number): void {
  const base = material.userData.baseColor as Color | undefined;
  if (base) material.color.copy(base).multiplyScalar(factor);
}
