import {
  CanvasTexture,
  LinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';

/**
 * Every finish is drawn into a canvas at boot: no image files, no HDRs, no
 * runtime fetches. Greyscale maps double as bump and roughness so one draw
 * call's texture work pays for both micro-shape and sheen.
 */

function canvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const element = document.createElement('canvas');
  element.width = size;
  element.height = size;
  const ctx = element.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { canvas: element, ctx };
}

function finishTexture(element: HTMLCanvasElement, repeat = 1): CanvasTexture {
  const texture = new CanvasTexture(element);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = NoColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Perlage: overlapping circular graining. Each spot is a set of concentric
 * rings with a bright crown and a dark trough, so raking light picks out the
 * fish-scale pattern on the main plate.
 */
export function createPerlageTexture(size = 1024): Texture {
  const { canvas: element, ctx } = canvas(size);
  ctx.fillStyle = '#8f8f8f';
  ctx.fillRect(0, 0, size, size);

  const random = seededRandom(0x5eed);
  const step = size / 13;
  for (let row = -1; row < 15; row += 1) {
    for (let col = -1; col < 15; col += 1) {
      const cx = col * step + (row % 2 === 0 ? step * 0.5 : 0) + (random() - 0.5) * 3;
      const cy = row * step * 0.86 + (random() - 0.5) * 3;
      const radius = step * 0.62;
      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(120,120,120,0.6)');
      gradient.addColorStop(0.55, 'rgba(156,156,156,0.6)');
      gradient.addColorStop(0.72, 'rgba(214,214,214,0.7)');
      gradient.addColorStop(0.82, 'rgba(96,96,96,0.65)');
      gradient.addColorStop(0.92, 'rgba(170,170,170,0.55)');
      gradient.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Fine circular scratches inside each spot.
      ctx.strokeStyle = 'rgba(180,180,180,0.18)';
      ctx.lineWidth = 1;
      for (let ring = 1; ring <= 5; ring += 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radius * ring) / 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  return finishTexture(element);
}

/**
 * Côtes de Genève: slightly curved parallel bands with a bright shoulder and a
 * dark trough, the pattern of a bridge finished on a rotating tin lap.
 */
export function createCotesTexture(size = 1024): Texture {
  const { canvas: element, ctx } = canvas(size);
  ctx.fillStyle = '#787878';
  ctx.fillRect(0, 0, size, size);

  const bands = 18;
  for (let band = 0; band < bands; band += 1) {
    const y = (band / bands) * size;
    const height = size / bands;
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, 'rgba(170,170,170,0.9)');
    gradient.addColorStop(0.18, 'rgba(126,126,126,0.85)');
    gradient.addColorStop(0.55, 'rgba(110,110,110,0.85)');
    gradient.addColorStop(0.82, 'rgba(150,150,150,0.85)');
    gradient.addColorStop(1, 'rgba(126,126,126,0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, size, height);
  }

  // Break the bands' machined edges with a little grain.
  const random = seededRandom(0xc07e5);
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 5200; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const shade = 90 + Math.floor(random() * 120);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 1.5, 1);
  }
  ctx.globalAlpha = 1;

  return finishTexture(element);
}

/** Circular graining for wheel faces: concentric tool marks, faintly irregular. */
export function createCircularGrainTexture(size = 512): Texture {
  const { canvas: element, ctx } = canvas(size);
  const center = size / 2;
  ctx.fillStyle = '#909090';
  ctx.fillRect(0, 0, size, size);
  const random = seededRandom(0x9a1e);
  for (let ring = 0; ring < size / 2; ring += 1.6) {
    const shade = 120 + Math.floor(random() * 90);
    ctx.strokeStyle = `rgba(${shade},${shade},${shade},0.5)`;
    ctx.lineWidth = 1 + random() * 1.2;
    ctx.beginPath();
    ctx.arc(center, center, ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  return finishTexture(element);
}

/** Sunray brushing: radial strokes, for the chapter ring and ratchet wheel. */
export function createSunrayTexture(size = 1024): Texture {
  const { canvas: element, ctx } = canvas(size);
  const center = size / 2;
  const random = seededRandom(0x5a17);
  ctx.fillStyle = '#8c8c8c';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2200; i += 1) {
    const angle = random() * Math.PI * 2;
    const shade = 105 + Math.floor(random() * 110);
    ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.12 + random() * 0.22})`;
    ctx.lineWidth = 0.6 + random() * 1.6;
    ctx.beginPath();
    ctx.moveTo(center + Math.cos(angle) * (size * 0.08), center + Math.sin(angle) * (size * 0.08));
    ctx.lineTo(center + Math.cos(angle) * center * 1.05, center + Math.sin(angle) * center * 1.05);
    ctx.stroke();
  }
  return finishTexture(element);
}

/** The vitrine backdrop: a cool pool of light falling off into obsidian. */
export function createBackdropTexture(size = 1024): Texture {
  const { canvas: element, ctx } = canvas(size);
  ctx.fillStyle = '#040507';
  ctx.fillRect(0, 0, size, size);

  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.44, size * 0.02, size * 0.5, size * 0.5, size * 0.62);
  gradient.addColorStop(0, '#4a4030');
  gradient.addColorStop(0.22, '#2a251c');
  gradient.addColorStop(0.55, '#121110');
  gradient.addColorStop(1, '#050506');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // A faint champagne glow at the upper left, where the key light would fall.
  const warm = ctx.createRadialGradient(size * 0.34, size * 0.26, 0, size * 0.34, size * 0.26, size * 0.4);
  warm.addColorStop(0, 'rgba(140,106,60,0.22)');
  warm.addColorStop(1, 'rgba(120,92,52,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(element);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Soft elliptical contact shadow, transparent at the rim. */
export function createShadowTexture(size = 512): Texture {
  const { canvas: element, ctx } = canvas(size);
  ctx.clearRect(0, 0, size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
  gradient.addColorStop(0.45, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(0.75, 'rgba(0,0,0,0.14)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(element);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A small chamfer/strip highlight used as a caustic on the chapter ring. */
export function createGoldGradientTexture(): Texture {
  const { canvas: element, ctx } = canvas(256);
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#f4e0b0');
  gradient.addColorStop(0.35, '#c9a45e');
  gradient.addColorStop(0.55, '#8d6a32');
  gradient.addColorStop(0.75, '#e8cd93');
  gradient.addColorStop(1, '#a37c40');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new CanvasTexture(element);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
