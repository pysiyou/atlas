/**
 * Modal stack — serializable frames only. Actions and stack state live in separate contexts
 * so `openModal` consumers do not re-render when another modal opens.
 *
 * Only one modal is visible at a time. Opening another closes the current modal first (exit
 * animation), then opens the new frame.
 */

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ModalFrame,
  type ModalStack,
  MODAL_EXIT_TRANSITION_MS,
  planModalOpen,
  popModalStack,
  replaceModalStack,
} from './modalTypes';

export { ModalType } from './modalTypes';
export type { ModalFrame, ModalStack, ModalType as ModalTypeName } from './modalTypes';

export interface ModalActions {
  /** Open a modal (closes any current modal first when one is already open). */
  openModal: (frame: ModalFrame) => void;
  /** Same as `openModal` — nested opens are not stacked. */
  pushModal: (frame: ModalFrame) => void;
  /** Close the current modal and cancel any pending open. */
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
  const stackRef = useRef(stack);

  const pendingOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  const clearPendingOpen = useCallback(() => {
    if (pendingOpenTimerRef.current != null) {
      clearTimeout(pendingOpenTimerRef.current);
      pendingOpenTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPendingOpen(), [clearPendingOpen]);

  const showModal = useCallback(
    (frame: ModalFrame) => {
      clearPendingOpen();
      const plan = planModalOpen(stackRef.current, frame);

      if (plan.kind === 'immediate') {
        setStack(plan.stack);
        return;
      }

      setStack(plan.stack);
      pendingOpenTimerRef.current = setTimeout(() => {
        pendingOpenTimerRef.current = null;
        setStack(replaceModalStack(plan.frame));
      }, MODAL_EXIT_TRANSITION_MS);
    },
    [clearPendingOpen]
  );

  const openModal = showModal;
  const pushModal = showModal;

  const closeModal = useCallback(() => {
    clearPendingOpen();
    setStack(current => popModalStack(current));
  }, [clearPendingOpen]);

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
