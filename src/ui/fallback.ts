import { CATALOGUE } from '../calibre/catalogue';

/**
 * The no-WebGL path is a designed page, not an error: it names the calibre,
 * explains what the exhibit needs, and lists every part with its job. It is
 * also the copy a reader gets without JavaScript where the static markup
 * carries the essentials.
 */
export function showFallback(root: HTMLElement, reason: string): void {
  const app = document.getElementById('app');
  const veil = document.getElementById('veil');
  const stageCanvas = document.getElementById('scene');
  const dock = document.querySelector<HTMLElement>('.dock');
  const inspector = document.getElementById('inspector');
  const fallback = document.getElementById('fallback');

  app?.setAttribute('data-ready', 'false');
  app?.setAttribute('data-fallback', 'true');
  veil?.classList.add('is-gone');
  if (stageCanvas) stageCanvas.style.display = 'none';
  if (dock) dock.style.display = 'none';
  if (inspector) inspector.style.display = 'none';
  if (fallback) fallback.hidden = false;

  root.textContent = '';
  const intro = document.createElement('p');
  intro.className = 'fallback-lede';
  intro.textContent = reason;
  root.append(intro);

  const list = document.createElement('dl');
  list.className = 'fallback-list';
  for (const entry of CATALOGUE) {
    const group = document.createElement('div');
    group.className = 'fallback-part';
    const term = document.createElement('dt');
    term.textContent = entry.name;
    const description = document.createElement('dd');
    description.textContent = entry.job;
    group.append(term, description);
    list.append(group);
  }
  root.append(list);
}
