import {
  Raycaster,
  Spherical,
  Vector2,
  Vector3,
  type Object3D,
  type PerspectiveCamera,
} from 'three';
import { CATALOGUE, partById } from '../calibre/catalogue';
import { IDLE, reduceInspection, type InspectionEvent, type InspectionState } from '../calibre/inspection';
import { clamp } from '../calibre/constants';
import { escapeStepsAt } from '../calibre/escapement';
import {
  advanceClockMutable,
  initialClock,
  watchTime,
  windClock,
  type ClockState,
  type SlowMotionSelection,
  type SpeedSelection,
} from '../calibre/time';
import { trainAngles } from '../calibre/train';
import { currentStop, nextStop, previousStop, skipTour, startTour, type TourState } from '../calibre/tour';
import { clampExplosion } from '../calibre/explosion';
import type { QualityTier } from '../calibre/quality';
import type { Engine } from '../core/engine';
import { CameraFlight, type CameraPose } from '../core/camera';
import { fitHome } from '../core/framing';
import { WatchContext, type PartHandle } from './context';
import type { HudStats } from '../ui/hud';
import { Labels } from '../ui/labels';

export interface ExhibitSnapshot {
  readonly ready: boolean;
  readonly inspection: InspectionState;
  readonly explode: number;
  readonly speed: SpeedSelection;
  readonly slowMotion: SlowMotionSelection;
  readonly paused: boolean;
  readonly reserveHours: number;
  readonly displaySeconds: number;
  readonly labels: boolean;
  readonly tour: TourState;
  readonly quality: QualityTier;
  readonly time: string;
}

export interface ExhibitOptions {
  readonly engine: Engine;
  readonly reducedMotion: boolean;
  readonly still: boolean;
  readonly labelsRoot?: HTMLElement;
  readonly build: (ctx: WatchContext) => void;
}

const STILL_DISPLAY_SECONDS = 0.9;
/** A composed moment for screenshots: balance mid-swing, hands at ten past ten. */
const DIM_PREVIEW = 0.84;
const DIM_PINNED = 0.66;

/**
 * The exhibit owns the simulation state and the DOM contract. Scene builders
 * register pure updaters; nothing in the render loop allocates.
 */
export class Exhibit {
  readonly ctx: WatchContext;
  readonly camera: PerspectiveCamera;
  readonly flight: CameraFlight;
  private readonly engine: Engine;
  private readonly canvas: HTMLCanvasElement;
  private readonly reducedMotion: boolean;
  private readonly still: boolean;
  private clock: ClockState;
  private inspection: InspectionState = IDLE;
  private tour: TourState = { active: false, index: 0 };
  private speed: SpeedSelection = 1;
  private slowMotion: SlowMotionSelection = 1;
  private paused = false;
  private explode = 0;
  private labelsOn = false;
  private parts: PartHandle[] = [];
  private pickables: Object3D[] = [];
  private winding = 0;
  private disposed = false;
  private readonly raycaster = new Raycaster();
  private readonly pointerNdc = new Vector2();
  private readonly pointerSpherical = new Spherical();
  private readonly pointerWorld = new Vector3();
  private readonly offset = new Vector3();
  private pointerInside = false;
  private pointerDirty = false;
  private pointerDownAt = { x: 0, y: 0, time: 0 };
  private hoveredId: string | null = null;
  private lastInteraction = 0;
  private readonly labels: Labels | null;
  private readonly listeners = new Set<() => void>();
  private readonly clockListeners = new Set<(snapshot: ExhibitSnapshot) => void>();
  private lastClockEmit = 0;
  private homePose: CameraPose = { position: [40, -50, 143], target: [1.5, -1.1, 0.4] };
  private ready = false;
  private frame = 0;
  private lastFrameTime = 0;
  private fps = 0;
  private rafId = 0;

  constructor(options: ExhibitOptions) {
    this.engine = options.engine;
    this.camera = options.engine.camera;
    this.canvas = options.engine.renderer.domElement;
    this.reducedMotion = options.reducedMotion;
    this.still = options.still;
    this.ctx = new WatchContext(options.engine.finishes);
    this.flight = new CameraFlight(this.camera, this.engine.controls);
    this.clock = initialClock();
    if (this.reducedMotion) this.slowMotion = 0.1;
    options.build(this.ctx);
    this.parts = this.ctx.finishParts();
    this.labels = options.labelsRoot ? new Labels(options.labelsRoot) : null;
    if (this.labels) {
      this.labels.add('barrel', 'Mainspring barrel', new Vector3(-3.9, 3.2, 2.9));
      this.labels.add('center-wheel', 'Center wheel', new Vector3(0, 0.4, 3.9));
      this.labels.add('escape-wheel', 'Escape wheel', new Vector3(3.5, -6.1, 0.3));
      this.labels.add('balance-wheel', 'Balance', new Vector3(-0.4, -9.7, 2.9));
      this.labels.add('crown', 'Crown', new Vector3(21.9, 0.6, 2.6));
      this.labels.add('chapter-ring', 'Chapter ring', new Vector3(10.4, 9.6, 3.6));
    }
    for (const part of this.parts) {
      this.engine.scene.add(part.group);
      this.pickables.push(part.group);
    }
    this.ctx.applyExplosion(0);
    this.bindEvents();
    this.applyInspection(this.inspection);
    this.applyHome(true);
  }

  /* ---------------------------------------------------------------- lifecycle */

  start(): void {
    this.lastFrameTime = performance.now();
    const loop = (now: number): void => {
      if (this.disposed) return;
      const delta = Math.min(0.1, Math.max(0, (now - this.lastFrameTime) / 1000));
      this.lastFrameTime = now;
      this.tick(now, delta);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  markReady(): void {
    this.ready = true;
    this.emit();
  }

  private tick(now: number, delta: number): void {
    this.frame += 1;
    if (this.frame % 10 === 0) this.fps = delta > 0 ? 0.85 * this.fps + 0.15 / delta : this.fps;
    if (this.frame % 120 === 0 && this.engine.tier === 'high' && this.fps > 0 && this.fps < 45) {
      // Sustained slow frames: demote once, and say so in the HUD. At 60 fps
      // this is two seconds of evidence, not a single stutter.
      this.engine.demote();
      this.emit();
    }

    if (!this.paused && !this.still) {
      advanceClockMutable(this.clock, delta, this.speed, this.slowMotion);
    }
    if (this.still) {
      this.clock = { displaySeconds: STILL_DISPLAY_SECONDS, reserveHours: 37.4, running: true };
    }
    this.winding = Math.max(0, this.winding - delta * 1.8);

    if (now - this.lastClockEmit > 500) {
      this.lastClockEmit = now;
      for (const listener of this.clockListeners) listener(this.snapshot());
    }

    for (const updater of this.ctx.updaters) {
      updater(this.clock.displaySeconds, this.clock.reserveHours, { winding: this.winding });
    }
    this.flight.update(delta);

    if (this.pointerDirty && this.pointerInside) {
      this.pointerDirty = false;
      this.pickUnderPointer();
    }

    this.updateAutoOrbit(now);
    this.engine.render(delta);
    if (this.labels && this.labelsOn) {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      for (const id of ['barrel', 'center-wheel', 'escape-wheel', 'balance-wheel', 'crown', 'chapter-ring']) {
        this.labels.setLift(id, this.ctx.get(id)?.group.position.z ?? 0);
      }
      this.labels.update(this.camera, width, height, width > 1100 ? 380 : 0);
    }
    this.updateHud(now);
  }

  private applyHome(immediate: boolean): void {
    const fit = fitHome(this.camera.aspect, 24);
    this.homePose = { position: fit.position, target: fit.target };
    this.flight.flyTo(this.homePose, immediate || this.reducedMotion);
  }

  private handleResize = (): void => {
    if (this.inspection.mode === 'idle' && !this.tour.active) this.applyHome(true);
  };

  private updateAutoOrbit(now: number): void {
    const controls = this.engine.controls;
    if (this.still || this.reducedMotion || this.inspection.mode !== 'idle' || this.tour.active || this.flight.isActive) {
      controls.autoRotate = false;
      return;
    }
    controls.autoRotate = now - this.lastInteraction > 8000;
  }

  /* ------------------------------------------------------------------ picking */

  private bindEvents(): void {
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('focus', this.handleFocus);
    window.addEventListener('keydown', this.handleGlobalKeyDown);
    this.canvas.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.pointerInside = true;
    this.pointerDirty = true;
    this.lastInteraction = performance.now();
  };

  private handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
    this.pointerInside = false;
    this.pointerDirty = false;
    this.hoveredId = null;
    if (!this.tour.active) this.dispatch({ type: 'hover-end' });
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.pointerDownAt = { x: event.clientX, y: event.clientY, time: performance.now() };
    this.lastInteraction = performance.now();
    this.engine.controls.autoRotate = false;
    this.canvas.focus({ preventScroll: true });
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const moved = Math.hypot(event.clientX - this.pointerDownAt.x, event.clientY - this.pointerDownAt.y);
    if (moved > 6) return;
    const id = this.idAt(event.clientX, event.clientY);
    if (this.tour.active) {
      this.tour = skipTour(this.tour);
      this.emit();
      return;
    }
    if (id) {
      // A touch has no hover, so the first tap previews and the second pins.
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        if (this.inspection.mode === 'preview' && this.inspection.id === id) this.dispatch({ type: 'activate', id });
        else this.dispatch({ type: 'hover', id });
      } else {
        this.dispatch({ type: 'activate', id });
      }
    } else if (this.inspection.mode === 'pinned') {
      this.dispatch({ type: 'clear' });
    }
  };

  /** Escape works even when focus is on a control: clearing is never a trap. */
  private handleGlobalKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.dispatch({ type: 'clear' });
      if (this.tour.active) {
        this.tour = skipTour(this.tour);
        this.emit();
      }
    }
  };

  private handleFocus = (): void => {
    this.emit();
  };

  private handleBlur = (): void => {
    this.emit();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key;
    if (key === 'Escape') {
      this.dispatch({ type: 'clear' });
      if (this.tour.active) {
        this.tour = skipTour(this.tour);
        this.emit();
      }
      event.preventDefault();
      return;
    }
    if (key === '[' || key === ']') {
      this.dispatch({ type: 'cycle', direction: key === ']' ? 1 : -1 });
      event.preventDefault();
      return;
    }
    if (key === 'Enter' || key === ' ') {
      if (this.inspection.mode === 'preview') this.dispatch({ type: 'pin' });
      event.preventDefault();
      return;
    }
    if (key === 'r' || key === 'R') {
      this.reset();
      event.preventDefault();
      return;
    }
    if (key.startsWith('Arrow')) {
      this.lastInteraction = performance.now();
      const controls = this.engine.controls;
      this.offset.copy(this.camera.position).sub(controls.target);
      this.pointerSpherical.setFromVector3(this.offset);
      if (key === 'ArrowLeft') this.pointerSpherical.theta += 0.09;
      if (key === 'ArrowRight') this.pointerSpherical.theta -= 0.09;
      if (key === 'ArrowUp') this.pointerSpherical.phi = clamp(this.pointerSpherical.phi - 0.07, controls.minPolarAngle, controls.maxPolarAngle);
      if (key === 'ArrowDown') this.pointerSpherical.phi = clamp(this.pointerSpherical.phi + 0.07, controls.minPolarAngle, controls.maxPolarAngle);
      this.offset.setFromSpherical(this.pointerSpherical);
      this.camera.position.copy(controls.target).add(this.offset);
      controls.update();
      event.preventDefault();
      return;
    }
    if (key === '+' || key === '=' || key === '-' || key === '_') {
      const factor = key === '+' || key === '=' ? 0.93 : 1.075;
      this.offset.copy(this.camera.position).sub(this.engine.controls.target);
      const length = clamp(this.offset.length() * factor, this.engine.controls.minDistance, this.engine.controls.maxDistance);
      this.offset.setLength(length);
      this.camera.position.copy(this.engine.controls.target).add(this.offset);
      this.engine.controls.update();
      event.preventDefault();
    }
  };

  private idAt(clientX: number, clientY: number): string | null {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNdc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    return this.pick();
  }

  private pick(): string | null {
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, true);
    for (const hit of hits) {
      let object: Object3D | null = hit.object;
      while (object) {
        const id = object.userData.partId as string | undefined;
        if (id) return id;
        object = object.parent;
      }
    }
    return null;
  }

  private pickUnderPointer(): void {
    const id = this.pick();
    if (id === this.hoveredId) return;
    this.hoveredId = id;
    if (id) this.dispatch({ type: 'hover', id });
    else this.dispatch({ type: 'hover-end' });
  }

  /* -------------------------------------------------------------- inspection */

  private dispatch(event: InspectionEvent): void {
    const next = reduceInspection(this.inspection, event);
    if (next.mode === this.inspection.mode && next.id === this.inspection.id) return;
    this.inspection = next;
    if (next.mode === 'idle') this.hoveredId = null;
    this.applyInspection(next);
    this.emit();
  }

  private applyInspection(state: InspectionState): void {
    const selectedId = state.mode === 'idle' ? null : state.id;
    // On a phone the inspector is a bottom sheet: lift the orbit target so a
    // selected part is framed in the upper half rather than behind the card.
    if (typeof window !== 'undefined' && window.innerWidth <= 860) {
      const controls = this.engine.controls;
      const home = fitHome(this.camera.aspect, 24);
      const lift = selectedId ? 6.5 : 0;
      const dy = home.target[1] - 6.5 + lift - controls.target.y;
      controls.target.y += dy;
      this.camera.position.y += dy;
      controls.update();
    }
    const selected = selectedId === null ? null : this.ctx.get(selectedId);
    this.engine.setSelection(selected ? [selected.group] : []);
    const dim = selectedId === null ? 1 : state.mode === 'pinned' ? DIM_PINNED : DIM_PREVIEW;
    for (const part of this.parts) {
      for (const material of part.materials) {
        this.engine.finishes.setDim(material, part.id === selectedId ? 1 : dim);
      }
    }
  }

  /** Programmatic inspection used by the debug API and the tour. */
  preview(id: string): void {
    if (!partById(id)) return;
    this.dispatch({ type: 'hover', id });
  }

  inspect(id: string): void {
    if (!partById(id)) return;
    this.dispatch({ type: 'activate', id });
  }

  clearInspection(): void {
    this.dispatch({ type: 'clear' });
  }

  enterPreviewFromKeyboard(): void {
    this.dispatch({ type: 'hover', id: CATALOGUE[0]?.id ?? 'main-plate' });
  }

  /* ------------------------------------------------------------------ public */

  setExplode(value: number): void {
    this.explode = clampExplosion(value);
    this.ctx.applyExplosion(this.explode);
    this.frameExplosion();
    this.emit();
  }

  /**
   * Pull back as the stack separates. The frame is computed from the current
   * orbit direction, so the explosion never fights the camera controls.
   */
  private frameExplosion(): void {
    if (this.flight.isActive) return;
    const fit = fitHome(this.camera.aspect, 24);
    const controls = this.engine.controls;
    // The hero view looks almost down the watch axis; an exploded stack only
    // reads from an oblique angle, so the view swings out as it separates.
    const hero = new Vector3(0.29, -0.38, 0.878).normalize();
    const oblique = new Vector3(0.12, -0.78, 0.62).normalize();
    const direction = hero.lerp(oblique, this.explode).normalize();
    const distance = fit.distance * (1 + this.explode * 0.28);
    const lift = this.explode * 5.2;
    controls.target.set(fit.target[0], fit.target[1] + this.explode * 1.6, fit.target[2] + lift);
    this.offset.copy(direction).multiplyScalar(distance);
    this.camera.position.copy(controls.target).add(this.offset);
    controls.update();
  }

  get explosion(): number {
    return this.explode;
  }

  setSpeed(speed: SpeedSelection): void {
    this.speed = speed;
    this.emit();
  }

  setSlowMotion(value: SlowMotionSelection): void {
    this.slowMotion = value;
    this.emit();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.emit();
  }

  togglePaused(): void {
    this.paused = !this.paused;
    this.emit();
  }

  setLabels(visible: boolean): void {
    this.labelsOn = visible;
    this.labels?.setVisible(visible);
    this.emit();
  }

  get labelsVisible(): boolean {
    return this.labelsOn;
  }

  wind(): void {
    this.clock = windClock(this.clock);
    this.winding = 1;
    this.lastInteraction = performance.now();
    this.emit();
  }

  reset(): void {
    this.inspection = IDLE;
    this.tour = { active: false, index: 0 };
    this.explode = 0;
    this.ctx.applyExplosion(0);
    this.applyHome(false);
    this.applyInspection(IDLE);
    this.emit();
  }

  startTour(): void {
    this.tour = startTour();
    this.gotoTourStop();
  }

  nextTourStop(): void {
    if (!this.tour.active) return;
    this.tour = nextStop(this.tour);
    this.gotoTourStop();
  }

  previousTourStop(): void {
    if (!this.tour.active) return;
    this.tour = previousStop(this.tour);
    this.gotoTourStop();
  }

  skipTour(): void {
    this.tour = skipTour(this.tour);
    this.emit();
  }

  private gotoTourStop(): void {
    const stop = currentStop(this.tour);
    if (!stop) return;
    this.inspect(stop.partId);
    this.setExplode(stop.explosion);
    this.flight.flyTo(stop.pose, this.reducedMotion);
    this.emit();
  }

  locate(id: string): void {
    const part = this.ctx.get(id);
    if (!part) return;
    const anchor = part.anchor;
    const distance = id === 'case-band' || id === 'crystal' || id === 'chapter-ring' ? 74 : 40;
    const direction = this.camera.position.clone().sub(this.engine.controls.target).normalize();
    const position: [number, number, number] = [
      anchor.x + direction.x * distance,
      anchor.y + direction.y * distance,
      Math.max(anchor.z + direction.z * distance, 12),
    ];
    this.flight.flyTo({ position, target: [anchor.x, anchor.y, anchor.z] }, this.reducedMotion);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** A low-rate clock feed for readouts that must not re-announce the inspector. */
  onClock(listener: (snapshot: ExhibitSnapshot) => void): () => void {
    this.clockListeners.add(listener);
    return () => this.clockListeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  snapshot(): ExhibitSnapshot {
    return {
      ready: this.ready,
      inspection: this.inspection,
      explode: this.explode,
      speed: this.speed,
      slowMotion: this.slowMotion,
      paused: this.paused,
      reserveHours: this.clock.reserveHours,
      displaySeconds: this.clock.displaySeconds,
      labels: this.labelsOn,
      tour: this.tour,
      quality: this.engine.tier,
      time: watchTime(this.clock.displaySeconds).label,
    };
  }

  get inspectionState(): InspectionState {
    return this.inspection;
  }

  get tourState(): TourState {
    return this.tour;
  }

  get clockState(): ClockState {
    return this.clock;
  }

  get partHandles(): readonly PartHandle[] {
    return this.parts;
  }

  /** Stats for the HUD and the debug API. */
  pickAtScreen(x: number, y: number): string | null {
    return this.idAt(x, y);
  }

  /** Screen position of a part's anchor, for the browser test's real picking. */
  projectPart(id: string): { x: number; y: number } | null {
    const part = this.ctx.get(id);
    if (!part) return null;
    const point = part.anchor.clone();
    point.z += part.group.position.z;
    point.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + (point.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-point.y * 0.5 + 0.5) * rect.height,
    };
  }

  cameraState(): { distance: number; target: [number, number, number]; flying: boolean } {
    const offset = this.camera.position.clone().sub(this.engine.controls.target);
    return {
      distance: offset.length(),
      target: [this.engine.controls.target.x, this.engine.controls.target.y, this.engine.controls.target.z],
      flying: this.flight.isActive,
    };
  }

  /** Debug-only visibility switch, used to inspect assemblies in isolation. */
  setPartVisible(id: string, visible: boolean): void {
    const part = this.ctx.get(id);
    if (part) part.group.visible = visible;
  }

  stats(): { fps: number; drawCalls: number; triangles: number; beats: number } {
    return {
      fps: this.fps,
      drawCalls: this.engine.sceneDrawCalls(),
      triangles: this.engine.sceneTriangles(),
      beats: escapeStepsAt(this.clock.displaySeconds),
    };
  }

  private updateHud(now: number): void {
    if (!this.hudVisible) return;
    const angles = trainAngles(this.clock.displaySeconds);
    this.hudCallback?.({
      fps: this.fps,
      drawCalls: this.engine.renderer.info.render.calls,
      triangles: this.engine.sceneTriangles(),
      speed: this.speed,
      slowMotion: this.slowMotion,
      angles,
      reserveHours: this.clock.reserveHours,
      beats: escapeStepsAt(this.clock.displaySeconds),
    }, now);
  }

  private hudVisible = false;
  private hudCallback: ((stats: HudStats, now: number) => void) | null = null;

  setHud(visible: boolean, callback: (stats: HudStats, now: number) => void): void {
    this.hudVisible = visible;
    this.hudCallback = callback;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('keydown', this.handleGlobalKeyDown);
    this.canvas.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
  }
}
