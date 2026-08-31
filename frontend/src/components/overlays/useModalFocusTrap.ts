/**
 * Keyboard focus trap and escape-to-close for Modal.
 */

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useModalFocusTrap({
  isOpen,
  modalRef,
  disableClose,
  onClose,
}: {
  isOpen: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  disableClose: boolean;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus the first field only when the modal opens — not on every parent re-render.
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector(
        FOCUSABLE_SELECTOR
      ) as HTMLElement | null;
      firstFocusable?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, modalRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) {
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, disableClose, modalRef]);
}
