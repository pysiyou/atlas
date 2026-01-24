/**
 * Modal Context - Global modal state management
 *
 * Provides a centralized way to open and close modals throughout the application.
 * Similar to the cargoplan modal system.
 */

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

/**
 * Available modal types in the application
 */
export const ModalType = {
  SAMPLE_DETAIL: 'SAMPLE_DETAIL',
  PATIENT_DETAIL: 'PATIENT_DETAIL',
  ORDER_DETAIL: 'ORDER_DETAIL',
  CONFIRMATION: 'CONFIRMATION',
  RESULT_DETAIL: 'RESULT_DETAIL',
  VALIDATION_DETAIL: 'VALIDATION_DETAIL',
  NEW_ORDER: 'NEW_ORDER',
} as const;

export type ModalType = (typeof ModalType)[keyof typeof ModalType];

/**
 * Modal context interface
 */
interface ModalContextType {
  modalType: ModalType | null;
  modalProps: Record<string, unknown> | null;
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
  modalType: null,
  modalProps: null,
  openModal: () => {},
  closeModal: () => {},
});

/**
 * useModal Hook
 *
 * Provides access to modal UI state and actions.
 * Used to open and close modals throughout the application.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

/**
 * ModalProvider
 *
 * Manages modal UI state (what modal is open and its props).
 * Provides access to modal state via useModal hook.
 */
export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalProps, setModalProps] = useState<Record<string, unknown> | null>(null);

  /**
   * Open a modal with the specified type and props
   */
  const openModal = useCallback((type: ModalType, props?: Record<string, unknown>) => {
    setModalType(type);
    setModalProps(props || null);
  }, []);

  /**
   * Close the currently open modal
   */
  const closeModal = useCallback(() => {
    setModalType(null);
    setModalProps(null);
  }, []);

  const value = useMemo(
    () => ({
      modalType,
      modalProps,
      openModal,
      closeModal,
    }),
    [modalType, modalProps, openModal, closeModal]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};
