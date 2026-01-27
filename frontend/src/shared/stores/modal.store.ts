import { create } from 'zustand';

interface ModalState {
  modals: Record<string, { isOpen: boolean; data?: unknown }>;
  openModal: (id: string, data?: unknown) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  getModalData: <T>(id: string) => T | undefined;
}

export const useModalStore = create<ModalState>((set, get) => ({
  modals: {},

  openModal: (id, data) => set((state) => ({
    modals: { ...state.modals, [id]: { isOpen: true, data } },
  })),

  closeModal: (id) => set((state) => ({
    modals: { ...state.modals, [id]: { isOpen: false } },
  })),

  isModalOpen: (id) => get().modals[id]?.isOpen ?? false,

  getModalData: <T>(id: string) => get().modals[id]?.data as T | undefined,
}));
