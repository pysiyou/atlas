/**
 * In-progress lab drafts keyed by orderTestId.
 * Lives outside ModalContext so reopen restores values and queue cards can preview them.
 */

import { create } from 'zustand';

export interface EntryDraft {
  results: Record<string, string>;
  technicianNotes: string;
  /** Invalidates the draft when status or resultEnteredAt changes on the server. */
  lifecycleKey: string;
}

export interface ValidationDraft {
  text: string;
  /** Invalidates the draft when status or resultEnteredAt changes on the server. */
  lifecycleKey: string;
}

/** Version key for in-progress drafts: status + last server result timestamp. */
export function entryDraftLifecycleKey(
  status?: string,
  resultEnteredAt?: string | null
): string {
  return `${status ?? ''}::${resultEnteredAt ?? ''}`;
}

/** Same tuple as entry drafts — server result version drives validation comment reset. */
export function validationDraftLifecycleKey(
  status?: string,
  resultEnteredAt?: string | null
): string {
  return entryDraftLifecycleKey(status, resultEnteredAt);
}

interface LabDraftState {
  entry: Record<number, EntryDraft>;
  validationDrafts: Record<number, ValidationDraft>;
  getEntryDraft: (orderTestId: number) => EntryDraft | undefined;
  setEntryResults: (orderTestId: number, results: Record<string, string>) => void;
  setEntryResultParam: (orderTestId: number, paramCode: string, value: string) => void;
  setEntryNotes: (orderTestId: number, notes: string) => void;
  seedEntryDraft: (orderTestId: number, draft: EntryDraft) => void;
  retainEntryDrafts: (orderTestIds: Iterable<number>) => void;
  retainValidationDrafts: (orderTestIds: Iterable<number>) => void;
  clearEntryDraft: (orderTestId: number) => void;
  getValidationComments: (orderTestId: number) => string;
  setValidationComments: (orderTestId: number, comments: string) => void;
  seedValidationDraft: (orderTestId: number, draft: ValidationDraft) => void;
  clearValidationComments: (orderTestId: number) => void;
  clearAllDrafts: () => void;
}

const EMPTY_ENTRY: EntryDraft = { results: {}, technicianNotes: '', lifecycleKey: '' };
const EMPTY_VALIDATION: ValidationDraft = { text: '', lifecycleKey: '' };

function pruneDraftMap<T extends Record<number, unknown>>(
  current: T,
  keep: Set<number>
): { next: T; changed: boolean } {
  let changed = false;
  const next = { ...current };
  for (const key of Object.keys(next)) {
    const id = Number(key);
    if (!keep.has(id)) {
      delete next[id];
      changed = true;
    }
  }
  return { next, changed };
}

export const useLabDraftStore = create<LabDraftState>((set, get) => ({
  entry: {},
  validationDrafts: {},

  getEntryDraft: orderTestId => get().entry[orderTestId],

  setEntryResults: (orderTestId, results) => {
    set(state => {
      const current = state.entry[orderTestId] ?? EMPTY_ENTRY;
      return {
        entry: {
          ...state.entry,
          [orderTestId]: { ...current, results },
        },
      };
    });
  },

  setEntryResultParam: (orderTestId, paramCode, value) => {
    set(state => {
      const current = state.entry[orderTestId] ?? EMPTY_ENTRY;
      return {
        entry: {
          ...state.entry,
          [orderTestId]: {
            ...current,
            results: { ...current.results, [paramCode]: value ?? '' },
          },
        },
      };
    });
  },

  setEntryNotes: (orderTestId, notes) => {
    set(state => {
      const current = state.entry[orderTestId] ?? EMPTY_ENTRY;
      return {
        entry: {
          ...state.entry,
          [orderTestId]: { ...current, technicianNotes: notes ?? '' },
        },
      };
    });
  },

  seedEntryDraft: (orderTestId, draft) => {
    const current = get().entry[orderTestId];
    if (current && current.lifecycleKey === draft.lifecycleKey) return;

    const hadPriorLifecycle = Boolean(current?.lifecycleKey);
    const nextLifecycleKey = draft.lifecycleKey ?? '';
    const lifecycleChanged =
      hadPriorLifecycle && current!.lifecycleKey !== nextLifecycleKey;

    /** Keep in-progress queue/modal edits until the server lifecycle actually changes. */
    if (current && !lifecycleChanged) {
      set(state => ({
        entry: {
          ...state.entry,
          [orderTestId]: {
            ...current,
            lifecycleKey: nextLifecycleKey || current.lifecycleKey,
          },
        },
      }));
      return;
    }

    set(state => ({
      entry: {
        ...state.entry,
        [orderTestId]: {
          results: draft.results ?? {},
          technicianNotes: draft.technicianNotes ?? '',
          lifecycleKey: nextLifecycleKey,
        },
      },
    }));
  },

  retainEntryDrafts: orderTestIds => {
    const keep = new Set(orderTestIds);
    set(state => {
      const { next, changed } = pruneDraftMap(state.entry, keep);
      return changed ? { entry: next } : state;
    });
  },

  retainValidationDrafts: orderTestIds => {
    const keep = new Set(orderTestIds);
    set(state => {
      const { next, changed } = pruneDraftMap(state.validationDrafts, keep);
      return changed ? { validationDrafts: next } : state;
    });
  },

  clearEntryDraft: orderTestId => {
    set(state => {
      if (!(orderTestId in state.entry)) return state;
      const next = { ...state.entry };
      delete next[orderTestId];
      return { entry: next };
    });
  },

  getValidationComments: orderTestId => get().validationDrafts[orderTestId]?.text ?? '',

  setValidationComments: (orderTestId, comments) => {
    set(state => {
      const current = state.validationDrafts[orderTestId] ?? EMPTY_VALIDATION;
      return {
        validationDrafts: {
          ...state.validationDrafts,
          [orderTestId]: { ...current, text: comments ?? '' },
        },
      };
    });
  },

  seedValidationDraft: (orderTestId, draft) => {
    const current = get().validationDrafts[orderTestId];
    if (current && current.lifecycleKey === draft.lifecycleKey) return;

    const hadPriorLifecycle = Boolean(current?.lifecycleKey);
    const nextLifecycleKey = draft.lifecycleKey ?? '';
    const lifecycleChanged =
      hadPriorLifecycle && current!.lifecycleKey !== nextLifecycleKey;

    let text = draft.text ?? '';
    if (current && !lifecycleChanged) {
      if (current.text.trim() !== '') {
        text = current.text;
      }
      set(state => ({
        validationDrafts: {
          ...state.validationDrafts,
          [orderTestId]: {
            text,
            lifecycleKey: nextLifecycleKey || current.lifecycleKey,
          },
        },
      }));
      return;
    }

    set(state => ({
      validationDrafts: {
        ...state.validationDrafts,
        [orderTestId]: {
          text,
          lifecycleKey: nextLifecycleKey,
        },
      },
    }));
  },

  clearValidationComments: orderTestId => {
    set(state => {
      if (!(orderTestId in state.validationDrafts)) return state;
      const next = { ...state.validationDrafts };
      delete next[orderTestId];
      return { validationDrafts: next };
    });
  },

  clearAllDrafts: () => set({ entry: {}, validationDrafts: {} }),
}));

/** Prune entry and validation drafts for visible queue rows. */
export function retainLabDrafts(options: {
  entryIds?: Iterable<number>;
  validationIds?: Iterable<number>;
}): void {
  const store = useLabDraftStore.getState();
  if (options.entryIds) {
    store.retainEntryDrafts(options.entryIds);
  }
  if (options.validationIds) {
    store.retainValidationDrafts(options.validationIds);
  }
}

/** Call from logout / session expiry so the next user cannot see leftover drafts. */
export function clearAllLabDrafts(): void {
  useLabDraftStore.getState().clearAllDrafts();
}
