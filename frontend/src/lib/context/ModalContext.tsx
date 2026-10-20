/**
 * Modal stack — serializable frames only. Actions and stack state live in separate contexts
 * so `openModal` consumers do not re-render when another modal opens.
 */

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  type ModalFrame,
  type ModalStack,
  popModalStack,
  pushModalFrame,
  replaceModalStack,
} from './modalTypes';

export { ModalType } from './modalTypes';
export type { ModalFrame, ModalStack, ModalType as ModalTypeName } from './modalTypes';

export interface ModalActions {
  /** Replace the stack (page/card open). */
  openModal: (frame: ModalFrame) => void;
  /** Append a nested frame (open from an already-open modal). */
  pushModal: (frame: ModalFrame) => void;
  /** Pop the top frame. */
  closeModal: () => void;
}

const NOOP_ACTIONS: ModalActions = {
  openModal: () => {},
  pushModal: () => {},
  closeModal: () => {},
};

const ModalActionsContext = createContext<ModalActions>(NOOP_ACTIONS);
const ModalStateContext = createContext<ModalStack>([]);

/**
 * Actions only. Safe to call from queue cards without subscribing to stack changes.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useModal(): ModalActions {
  return useContext(ModalActionsContext);
}

/**
 * Current stack. ModalRenderer is the only intended subscriber.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useModalStack(): ModalStack {
  return useContext(ModalStateContext);
}

interface ModalProviderProps {
  children: ReactNode;
}

/**
 * Holds the modal stack and stable action callbacks.
 */
export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [stack, setStack] = useState<ModalStack>([]);

  const openModal = useCallback((frame: ModalFrame) => {
    setStack(replaceModalStack(frame));
  }, []);

  const pushModal = useCallback((frame: ModalFrame) => {
    setStack(current => pushModalFrame(current, frame));
  }, []);

  const closeModal = useCallback(() => {
    setStack(current => popModalStack(current));
  }, []);

  const actions = useMemo(
    () => ({ openModal, pushModal, closeModal }),
    [openModal, pushModal, closeModal]
  );

  return (
    <ModalActionsContext.Provider value={actions}>
      <ModalStateContext.Provider value={stack}>{children}</ModalStateContext.Provider>
    </ModalActionsContext.Provider>
  );
};
