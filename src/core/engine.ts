import {
  ACESFilmicToneMapping,
  Mesh,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  type Object3D,
  type PerspectiveCamera,
  type Scene,
  type Texture,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FinishLibrary } from './materials';
import { createStudioScene, type Studio } from './studio';
import { QUALITY, type QualityTier } from '../calibre/quality';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as Texture | null },
    uResolution: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uGrain: { value: 0.018 },
    uVignette: { value: 0.62 },
    uExposureBoost: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      // A gentle S-curve before the vignette keeps the metal from going flat.
      color = color * color * (3.0 - 2.0 * color) * 0.22 + color * 0.78;
      vec2 p = (vUv - 0.5) * vec2(1.0, 1.06);
      float vignette = smoothstep(0.86, 0.28, length(p));
      color *= mix(1.0, 0.72 + vignette * 0.28, uVignette);
      float grain = hash(vUv * uResolution + fract(uTime) * 91.7) - 0.5;
      color += grain * uGrain;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export interface EngineOptions {
  readonly canvas: HTMLCanvasElement;
  readonly tier: QualityTier;
  readonly still: boolean;
}

/**
 * Owns the renderer, camera, orbit controls and the post chain. The scene is
 * built once by the exhibit; the engine never learns about watch parts.
 */
export class Engine {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly studio: Studio;
  readonly finishes: FinishLibrary;
  readonly outline: OutlinePass;
  readonly composer: EffectComposer;
  readonly gradePass: ShaderPass;
  tier: QualityTier;
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly still: boolean;
  private readonly smaa: SMAAPass;
  private readonly bloom: UnrealBloomPass;
  private time = 0;

  constructor(options: EngineOptions) {
    this.canvas = options.canvas;
    this.still = options.still;
    this.container = options.canvas.parentElement ?? document.body;
    this.tier = options.tier;
    const settings = QUALITY[this.tier];

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setClearColor(0x040507, 1);
    this.renderer.info.autoReset = false;

    const { scene, studio, camera } = createStudioScene(this.renderer, this.tier);
    this.scene = scene;
    this.studio = studio;
    this.camera = camera;
    this.finishes = new FinishLibrary(this.renderer);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(1.5, -1.1, 0.4);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.45;
    this.controls.zoomSpeed = 0.7;
    this.controls.minDistance = 52;
    this.controls.maxDistance = 380;
    this.controls.minPolarAngle = 0.38;
    this.controls.maxPolarAngle = 2.72;
    this.controls.autoRotate = !this.still;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.update();

    const size = this.measure();
    const width = Math.max(1, size.width * this.renderer.getPixelRatio());
    const height = Math.max(1, size.height * this.renderer.getPixelRatio());

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new Vector2(width * settings.bloomScale, height * settings.bloomScale),
      0.12,
      0.5,
      1.15,
    );
    this.bloom.enabled = settings.bloom;
    this.composer.addPass(this.bloom);

    this.outline = new OutlinePass(new Vector2(width, height), this.scene, this.camera);
    this.outline.edgeStrength = 3.4;
    this.outline.edgeGlow = 0.18;
    this.outline.edgeThickness = 1.1;
    this.outline.pulsePeriod = 0;
    this.outline.visibleEdgeColor.setHex(0xe8c98a);
    this.outline.hiddenEdgeColor.setHex(0x4b3c22);
    this.composer.addPass(this.outline);

    this.smaa = new SMAAPass();
    this.smaa.enabled = settings.smaa;
    this.composer.addPass(this.smaa);

    this.composer.addPass(new OutputPass());

    this.gradePass = new ShaderPass(GradeShader);
    this.gradePass.uniforms.uGrain = { value: settings.grain ? 0.016 : 0 };
    this.composer.addPass(this.gradePass);

    this.applySize();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.applySize()).observe(this.container);
    }
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => this.applySize();

  private measure(): { width: number; height: number } {
    const rect = this.container.getBoundingClientRect();
    return { width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) };
  }

  private applySize(): void {
    const { width, height } = this.measure();
    const settings = QUALITY[this.tier];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(width, height);
    const pixelRatio = this.renderer.getPixelRatio();
    this.gradePass.uniforms.uResolution = { value: new Vector2(width * pixelRatio, height * pixelRatio) };
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  /**
   * Structural draw-call count: meshes times material groups. This is the
   * number the 250-call budget refers to; post-processing adds its own passes
   * on top and is reported separately.
   */
  sceneTriangles(): number {
    let triangles = 0;
    this.scene.traverseVisible((object) => {
      if (!(object instanceof Mesh)) return;
      const geometry = object.geometry;
      if (geometry.index) triangles += geometry.index.count / 3;
      else if (geometry.attributes.position) triangles += geometry.attributes.position.count / 3;
    });
    return Math.round(triangles);
  }

  sceneDrawCalls(): number {
    let calls = 0;
    this.scene.traverseVisible((object) => {
      if (!(object instanceof Mesh)) return;
      const material = object.material;
      calls += Array.isArray(material) ? material.length : 1;
    });
    return calls;
  }

  setSelection(objects: Object3D[]): void {
    this.outline.selectedObjects = objects;
    this.outline.enabled = QUALITY[this.tier].outline && objects.length > 0;
  }

  setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled && !this.still;
  }

  /** Demote to lite once the exhibit has proof that frames are slow. */
  demote(): void {
    if (this.tier === 'lite') return;
    this.tier = 'lite';
    const settings = QUALITY.lite;
    this.bloom.enabled = settings.bloom;
    this.smaa.enabled = settings.smaa;
    this.gradePass.uniforms.uGrain = { value: 0 };
    this.studio.keyLight.shadow.map?.dispose();
    this.studio.keyLight.shadow.map = null;
    this.studio.keyLight.shadow.mapSize.set(1024, 1024);
    this.applySize();
  }

  render(deltaSeconds: number): void {
    this.time += deltaSeconds;
    this.controls.update();
    (this.gradePass.uniforms.uTime as { value: number }).value = this.still ? 0.35 : this.time;
    this.renderer.info.reset();
    this.composer.render();
  }

  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.controls.dispose();
    this.finishes.dispose();
    this.studio.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }

  get pixelRatio(): number {
    return this.renderer.getPixelRatio();
  }
}
