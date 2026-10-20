/**
 * In-progress lab drafts keyed by orderTestId.
 * Lives outside ModalContext so reopen restores values and queue cards can preview them.
 */

import { create } from 'zustand';

export interface EntryDraft {
  results: Record<string, string>;
  technicianNotes: string;
}

interface LabDraftState {
  entry: Record<number, EntryDraft>;
  validationComments: Record<number, string>;
  getEntryDraft: (orderTestId: number) => EntryDraft | undefined;
  setEntryResults: (orderTestId: number, results: Record<string, string>) => void;
  setEntryResultParam: (orderTestId: number, paramCode: string, value: string) => void;
  setEntryNotes: (orderTestId: number, notes: string) => void;
  seedEntryDraft: (orderTestId: number, draft: EntryDraft) => void;
  clearEntryDraft: (orderTestId: number) => void;
  getValidationComments: (orderTestId: number) => string;
  setValidationComments: (orderTestId: number, comments: string) => void;
  clearValidationComments: (orderTestId: number) => void;
  clearAllDrafts: () => void;
}

const EMPTY_ENTRY: EntryDraft = { results: {}, technicianNotes: '' };

export const useLabDraftStore = create<LabDraftState>((set, get) => ({
  entry: {},
  validationComments: {},

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
    if (get().entry[orderTestId]) return;
    set(state => ({
      entry: { ...state.entry, [orderTestId]: draft },
    }));
  },

  clearEntryDraft: orderTestId => {
    set(state => {
      if (!(orderTestId in state.entry)) return state;
      const next = { ...state.entry };
      delete next[orderTestId];
      return { entry: next };
    });
  },

  getValidationComments: orderTestId => get().validationComments[orderTestId] ?? '',

  setValidationComments: (orderTestId, comments) => {
    set(state => ({
      validationComments: { ...state.validationComments, [orderTestId]: comments },
    }));
  },

  clearValidationComments: orderTestId => {
    set(state => {
      if (!(orderTestId in state.validationComments)) return state;
      const next = { ...state.validationComments };
      delete next[orderTestId];
      return { validationComments: next };
    });
  },

  clearAllDrafts: () => set({ entry: {}, validationComments: {} }),
}));

/** Call from logout / session expiry so the next user cannot see leftover drafts. */
export function clearAllLabDrafts(): void {
  useLabDraftStore.getState().clearAllDrafts();
}
