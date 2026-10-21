/**
 * Base Modal Component
 *
 * A reusable modal component with animations, backdrop, and accessibility features.
 */

import React, { memo, useCallback, useEffect, useRef, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Portal } from './Portal';
import { OVERLAY } from '@/theme/recipes';
import { DialogHeader } from './DialogChrome';
import { OverlayBackdrop, OVERLAY_PANEL_Z_INDEX } from './OverlayBackdrop';

const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  default: 'max-w-[600px]',
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const BASE_MODAL_CLASSES = `relative ${OVERLAY.shellShadowXl} w-full`;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  /** Status / workflow badges shown on the context line (after subtitle, when present). */
  badges?: React.ReactNode;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
  className?: string;
  disableClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'default';
  /** False when stacked under another modal — stay mounted, skip focus/Escape/backdrop. */
  isActive?: boolean;
}

function useModalFocusTrap({
  isOpen,
  isActive,
  modalRef,
  disableClose,
  onClose,
}: {
  isOpen: boolean;
  isActive: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  disableClose: boolean;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const timer = setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector(
        FOCUSABLE_SELECTOR
      ) as HTMLElement | null;
      firstFocusable?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, isActive, modalRef]);

  useEffect(() => {
    if (!isOpen || !isActive) return;

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
  }, [isOpen, isActive, disableClose, modalRef]);
}

const ModalDialog = memo(
  ({
    modalRef,
    maxWidthClass,
    className,
    title,
    subtitle,
    badges,
    children,
    onClose,
    disableClose = false,
    onModalClick,
    isActive,
  }: {
    modalRef: React.RefObject<HTMLDivElement | null>;
    maxWidthClass: string;
    className: string;
    title: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    badges?: React.ReactNode;
    children: React.ReactNode;
    onClose: () => void;
    disableClose?: boolean;
    onModalClick: (e: React.MouseEvent) => void;
    isActive: boolean;
  }) => (
    <div
      className="fixed inset-0 flex items-start justify-center lg:justify-end p-space-2 md:p-space-6 pointer-events-none"
      style={{ zIndex: isActive ? OVERLAY_PANEL_Z_INDEX : OVERLAY_PANEL_Z_INDEX - 10 }}
      inert={!isActive ? true : undefined}
      aria-hidden={!isActive}
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal={isActive}
        aria-labelledby="modal-title"
        variants={{
          initial: { opacity: 0, x: 15, y: 15 },
          animate: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 },
            },
          },
          exit: {
            opacity: 0,
            x: 10,
            y: 10,
            transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
          },
        }}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`${BASE_MODAL_CLASSES} ${maxWidthClass} ${className} flex flex-col h-[calc(100vh-16px)] md:h-[calc(100vh-48px)] origin-top lg:origin-top-right pointer-events-auto`}
        onClick={onModalClick}
      >
        <DialogHeader
          title={title}
          subtitle={subtitle}
          badges={badges}
          titleId="modal-title"
          onClose={() => {
            if (!isActive) return;
            onClose();
          }}
          disabled={disableClose}
        />

        <div className="grow overflow-hidden relative flex flex-col min-h-0">{children}</div>
      </motion.div>
    </div>
  )
);

ModalDialog.displayName = 'ModalDialog';

const Modal = memo(
  ({
    isOpen,
    onClose,
    title,
    subtitle,
    badges,
    children,
    closeOnBackdropClick = true,
    className = '',
    disableClose = false,
    size = 'default',
    isActive = true,
  }: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const maxWidthClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.default;

    const handleModalClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    const handleBackdropClickWrapper = useCallback(() => {
      if (!isActive) return;
      if (closeOnBackdropClick && !disableClose) {
        onClose();
      }
    }, [isActive, closeOnBackdropClick, disableClose, onClose]);

    useModalFocusTrap({ isOpen, isActive, modalRef, disableClose, onClose });

    return (
      <Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {isActive ? <OverlayBackdrop onClick={handleBackdropClickWrapper} /> : null}

              <ModalDialog
                modalRef={modalRef}
                maxWidthClass={maxWidthClass}
                className={className}
                title={title}
                subtitle={subtitle}
                badges={badges}
                children={children}
                onClose={onClose}
                disableClose={disableClose}
                onModalClick={handleModalClick}
                isActive={isActive}
              />
            </>
          )}
        </AnimatePresence>
      </Portal>
    );
  }
);

Modal.displayName = 'Modal';

export { Modal };
export type { ModalProps };
