// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { Inspector } from '../../src/ui/inspector';
import { showFallback } from '../../src/ui/fallback';
import { CATALOGUE, partById } from '../../src/calibre/catalogue';

beforeEach(() => {
  document.body.innerHTML = '';
});

function mountInspector(): Inspector {
  const root = document.createElement('aside');
  document.body.append(root);
  return new Inspector(root);
}

describe('inspector contract', () => {
  it('renders the selected part name, job, detail and spec', () => {
    const inspector = mountInspector();
    const entry = partById('balance-wheel');
    inspector.render({ mode: 'preview', id: 'balance-wheel' }, entry ?? null, 23, CATALOGUE.length);
    const root = document.querySelector('.inspector');
    expect(root?.textContent).toContain('Balance wheel');
    expect(root?.textContent).toContain(entry?.job ?? '');
    expect(root?.textContent).toContain(entry?.spec ?? '');
    expect(root?.querySelector('.inspector-status')?.textContent).toBe('Preview');
  });

  it('shows a pinned affordance and clears back to the invitation', () => {
    const inspector = mountInspector();
    inspector.render({ mode: 'pinned', id: 'barrel' }, partById('barrel') ?? null, 7, CATALOGUE.length);
    expect(document.querySelector('.inspector-status')?.textContent).toBe('Pinned');
    inspector.render({ mode: 'idle', id: null }, null, -1, CATALOGUE.length);
    expect(document.querySelector('.inspector-name')?.textContent).toBe('Point at a component');
    expect(document.querySelector('.inspector-status')?.textContent).toBe('Ready');
  });

  it('is a live region and never renders catalogue data as markup', () => {
    const inspector = mountInspector();
    const root = document.querySelector('.inspector') as HTMLElement;
    expect(root.getAttribute('aria-live')).toBe('polite');
    inspector.render({ mode: 'pinned', id: 'main-plate' }, partById('main-plate') ?? null, 0, CATALOGUE.length);
    expect(root.querySelectorAll('script').length).toBe(0);
  });
});

describe('fallback contract', () => {
  it('renders a styled list of every named part when WebGL is unavailable', () => {
    document.body.innerHTML = `
      <div id="app" data-ready="false"></div>
      <div id="veil"></div>
      <canvas id="scene"></canvas>
      <div class="dock"></div>
      <aside id="inspector"></aside>
      <section id="fallback" hidden><div id="fallback-parts"></div></section>
    `;
    showFallback(document.getElementById('fallback-parts') as HTMLElement, 'WebGL is unavailable in this browser.');
    const fallback = document.getElementById('fallback') as HTMLElement;
    expect(fallback.hidden).toBe(false);
    expect(fallback.textContent).toContain('WebGL is unavailable');
    expect(fallback.querySelectorAll('.fallback-part').length).toBe(CATALOGUE.length);
    expect(document.getElementById('app')?.dataset.fallback).toBe('true');
  });
});
