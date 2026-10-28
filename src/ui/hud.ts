import type { TrainPart } from '../calibre/train';

export interface HudStats {
  readonly fps: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly speed: number;
  readonly slowMotion: number;
  readonly angles: Record<TrainPart, number>;
  readonly reserveHours: number;
  readonly beats: number;
}

const DEG = 180 / Math.PI;

export class Hud {
  private readonly element: HTMLElement;
  private lastUpdate = 0;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  setVisible(visible: boolean): void {
    this.element.hidden = !visible;
  }

  update(stats: HudStats, now: number): void {
    // The HUD is a diagnostic; four refreshes a second are plenty and keep the
    // DOM out of the frame budget.
    if (now - this.lastUpdate < 250) return;
    this.lastUpdate = now;
    const angle = (value: number): string => `${(value * DEG).toFixed(1)}°`.padStart(7, ' ');
    this.element.textContent = [
      `fps        ${stats.fps.toFixed(0).padStart(4, ' ')}`,
      `draw calls ${stats.drawCalls.toString().padStart(4, ' ')}`,
      `triangles  ${(stats.triangles / 1000).toFixed(1).padStart(5, ' ')}k`,
      `speed      ${stats.speed.toString().padStart(4, ' ')}×  slow ${stats.slowMotion}×`,
      `reserve    ${stats.reserveHours.toFixed(1).padStart(5, ' ')} h  beat ${stats.beats}`,
      `barrel ${angle(stats.angles.barrel)}   center ${angle(stats.angles.center)}`,
      `third  ${angle(stats.angles.third)}   fourth ${angle(stats.angles.fourth)}`,
      `escape ${angle(stats.angles.escape)}`,
    ].join('\n');
  }
}
