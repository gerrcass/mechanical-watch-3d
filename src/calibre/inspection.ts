import { PART_IDS } from './catalogue';

/**
 * The inspection finite machine. Hover previews, activation pins, Escape
 * clears, brackets cycle. It is pure so the reducer, the DOM inspector, the
 * outline and the screen-reader live region can all derive from one state.
 */
export type InspectionMode = 'idle' | 'preview' | 'pinned';

export interface InspectionState {
  readonly mode: InspectionMode;
  readonly id: string | null;
}

export type InspectionEvent =
  | { readonly type: 'hover'; readonly id: string }
  | { readonly type: 'hover-end' }
  | { readonly type: 'activate'; readonly id: string }
  | { readonly type: 'pin' }
  | { readonly type: 'clear' }
  | { readonly type: 'cycle'; readonly direction: 1 | -1 };

export const IDLE: InspectionState = { mode: 'idle', id: null };

export function reduceInspection(state: InspectionState, event: InspectionEvent): InspectionState {
  switch (event.type) {
    case 'hover':
      // A pinned part is stable under the cursor; the camera may orbit while
      // the reader keeps their place.
      if (state.mode === 'pinned') return state;
      return { mode: 'preview', id: event.id };
    case 'hover-end':
      if (state.mode === 'preview') return IDLE;
      return state;
    case 'activate':
      if (state.mode === 'pinned' && state.id === event.id) return state;
      return { mode: 'pinned', id: event.id };
    case 'pin':
      if (state.mode === 'preview' && state.id !== null) return { mode: 'pinned', id: state.id };
      return state;
    case 'clear':
      return IDLE;
    case 'cycle': {
      const length = PART_IDS.length;
      const current = state.id === null ? -1 : PART_IDS.indexOf(state.id);
      // With nothing inspected, forward starts at the first part and backward
      // at the last; otherwise step and wrap.
      const nextIndex =
        current === -1
          ? event.direction === 1
            ? 0
            : length - 1
          : (current + event.direction + length) % length;
      const id = PART_IDS[nextIndex];
      if (id === undefined) return state;
      // Cycling keeps the pin: a keyboard reader who pinned a part expects the
      // next bracket to move the pin, not to drop back to a preview.
      return { mode: state.mode === 'pinned' ? 'pinned' : 'preview', id };
    }
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

export function isActive(state: InspectionState): boolean {
  return state.mode !== 'idle' && state.id !== null;
}
