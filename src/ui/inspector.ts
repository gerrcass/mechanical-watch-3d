import type { PartCatalogueEntry } from '../calibre/catalogue';
import { isActive, type InspectionState } from '../calibre/inspection';

/**
 * The inspector is the only description surface: the canvas, the outline and
 * the screen-reader live region all say what this DOM card says. Built once,
 * updated through textContent so catalogue copy can never be parsed as HTML.
 */
export class Inspector {
  private readonly category: HTMLParagraphElement;
  private readonly name: HTMLHeadingElement;
  private readonly job: HTMLParagraphElement;
  private readonly detail: HTMLParagraphElement;
  private readonly specLabel: HTMLSpanElement;
  private readonly specValue: HTMLSpanElement;
  private readonly spec: HTMLDivElement;
  private readonly status: HTMLSpanElement;
  private readonly locate: HTMLButtonElement;
  private readonly indexCurrent: HTMLSpanElement;
  private readonly indexTotal: HTMLSpanElement;
  private readonly root: HTMLElement;
  private locateHandler: ((id: string) => void) | null = null;
  private currentId: string | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    root.classList.add('inspector', 'is-idle');
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');
    root.setAttribute('aria-label', 'Inspector');
    root.textContent = '';

    this.category = document.createElement('p');
    this.category.className = 'inspector-category';

    this.name = document.createElement('h2');
    this.name.className = 'inspector-name';

    this.job = document.createElement('p');
    this.job.className = 'inspector-job';

    this.detail = document.createElement('p');
    this.detail.className = 'inspector-detail';

    this.spec = document.createElement('div');
    this.spec.className = 'inspector-spec';
    this.specLabel = document.createElement('span');
    this.specLabel.className = 'inspector-spec-label';
    this.specLabel.textContent = 'Specification';
    this.specValue = document.createElement('span');
    this.specValue.className = 'inspector-spec-value';
    this.spec.append(this.specLabel, this.specValue);

    const actions = document.createElement('div');
    actions.className = 'inspector-actions';
    this.status = document.createElement('span');
    this.status.className = 'inspector-status';
    this.locate = document.createElement('button');
    this.locate.type = 'button';
    this.locate.textContent = 'Locate';
    this.locate.addEventListener('click', () => {
      if (this.locate.getAttribute('aria-disabled') === 'true') return;
      if (this.currentId) this.locateHandler?.(this.currentId);
    });
    actions.append(this.status, this.locate);

    const index = document.createElement('p');
    index.className = 'inspector-index';
    const left = document.createElement('span');
    const right = document.createElement('span');
    this.indexCurrent = left;
    this.indexTotal = right;
    index.append(left, right);

    root.append(this.category, this.name, this.job, this.detail, this.spec, actions, index);

    this.render({ mode: 'idle', id: null }, null, -1, 0);
  }

  onLocate(handler: (id: string) => void): void {
    this.locateHandler = handler;
  }

  render(state: InspectionState, entry: PartCatalogueEntry | null, index = -1, total = 0): void {
    const active = isActive(state) && entry !== null;
    this.root.classList.toggle('is-idle', !active);
    this.locate.setAttribute('aria-disabled', String(!active));

    if (!active || !entry) {
      this.currentId = null;
      this.category.textContent = 'Calibre MW-01';
      this.name.textContent = 'Point at a component';
      this.job.textContent = 'Hover or tap any part of the movement to hear what it does without leaving the object.';
      this.detail.textContent =
        'The inspector names the piece under your cursor, says what it is for, and gives its technical line. Click to pin it, then orbit around the calibre and read at your own pace.';
      this.spec.hidden = true;
      this.status.textContent = 'Ready';
      this.status.dataset.mode = 'idle';
      this.locate.textContent = 'Locate';
      this.indexCurrent.textContent = `${total} named parts`;
      this.indexTotal.textContent = 'MW-01 · illustrative';
      return;
    }

    this.currentId = entry.id;
    this.category.textContent = `${entry.category} · ${entry.layer}`;
    this.name.textContent = entry.name;
    this.job.textContent = entry.job;
    this.detail.textContent = entry.detail;
    this.spec.hidden = false;
    this.specValue.textContent = entry.spec;
    this.status.textContent = state.mode === 'pinned' ? 'Pinned' : 'Preview';
    this.status.dataset.mode = state.mode;
    this.locate.textContent = 'Locate';
    const pad = (value: number): string => value.toString().padStart(2, '0');
    this.indexCurrent.textContent = index >= 0 ? `${pad(index + 1)} / ${pad(total)}` : 'MW-01';
    this.indexTotal.textContent = state.mode === 'pinned' ? 'Pinned · Esc clears' : 'Click to pin · Esc clears';
  }
}
