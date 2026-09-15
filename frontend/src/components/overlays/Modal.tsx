/**
 * Base Modal Component
 *
 * A reusable modal component with animations, backdrop, and accessibility features.
 */

import React, { memo, useCallback, useEffect, useRef, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconButton } from '@/components/primitives';
import { Portal } from './Portal';
import { DialogHeader } from './DialogChrome';

const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const BASE_MODAL_CLASSES =
  'relative bg-surface border border-border-default rounded-lg shadow-xl w-full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  children: React.ReactNode;
  confirmDisabled?: boolean;
  confirmText?: string;
  closeOnBackdropClick?: boolean;
  className?: string;
  disableClose?: boolean;
  maxWidth?: string;
  backdropOpacity?: number;
  backdropZIndex?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

function useModalFocusTrap({
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
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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

function ModalBackdrop({
  onClick,
  zIndex = 40,
  opacity = 0.3,
  className = '',
}: {
  onClick?: () => void;
  zIndex?: number;
  opacity?: number;
  className?: string;
}) {
  const inlineStyle: React.CSSProperties = {
    zIndex,
    backgroundColor: 'var(--overlay)',
    backdropFilter: 'blur(2px)',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 ${className}`}
      style={{ ...inlineStyle, opacity }}
      onClick={onClick}
    />
  );
}

const ModalDialog = memo(
  ({
    modalRef,
    maxWidthClass,
    className,
    title,
    subtitle,
    children,
    onClose,
    onConfirm,
    confirmDisabled = false,
    confirmText = 'Confirm',
    disableClose = false,
    onModalClick,
  }: {
    modalRef: React.RefObject<HTMLDivElement | null>;
    maxWidthClass: string;
    className: string;
    title: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm?: () => void;
    confirmDisabled?: boolean;
    confirmText?: string;
    disableClose?: boolean;
    onModalClick: (e: React.MouseEvent) => void;
  }) => (
    <div className="fixed inset-0 z-50 flex items-start justify-center lg:justify-end p-2 md:p-6 pointer-events-none">
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
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
          titleId="modal-title"
          onClose={onClose}
          disabled={disableClose}
          actions={
            onConfirm ? (
              <IconButton
                onClick={onConfirm}
                variant="confirm"
                size="md"
                disabled={confirmDisabled}
                title={confirmText}
              />
            ) : undefined
          }
        />

        <div className="grow overflow-hidden relative flex flex-col min-h-0">{children}</div>
      </motion.div>
    </div>
  )
);

const Modal = memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    title,
    subtitle,
    children,
    confirmDisabled = false,
    confirmText = 'Confirm',
    closeOnBackdropClick = true,
    className = '',
    disableClose = false,
    maxWidth = 'max-w-[600px]',
    backdropOpacity = 0.3,
    backdropZIndex = 40,
    size,
  }: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const maxWidthClass = size && SIZE_CLASSES[size] ? SIZE_CLASSES[size] : maxWidth;

    const handleModalClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    const handleBackdropClickWrapper = useCallback(() => {
      if (closeOnBackdropClick && !disableClose) {
        onClose();
      }
    }, [closeOnBackdropClick, disableClose, onClose]);

    useModalFocusTrap({ isOpen, modalRef, disableClose, onClose });

    return (
      <Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              <ModalBackdrop
                onClick={handleBackdropClickWrapper}
                opacity={backdropOpacity}
                zIndex={backdropZIndex}
              />

              <ModalDialog
                modalRef={modalRef}
                maxWidthClass={maxWidthClass}
                className={className}
                title={title}
                subtitle={subtitle}
                children={children}
                onClose={onClose}
                onConfirm={onConfirm}
                confirmDisabled={confirmDisabled}
                confirmText={confirmText}
                disableClose={disableClose}
                onModalClick={handleModalClick}
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
