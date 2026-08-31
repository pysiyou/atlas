/**
 * Base Modal Component
 *
 * A reusable modal component with animations, backdrop, and accessibility features.
 * Based on the cargoplan modal implementation.
 */

import React, { memo, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Portal } from './Portal';
import { ModalBackdrop } from './ModalBackdrop';
import { ModalDialog } from './ModalDialog';
import { useModalFocusTrap } from './useModalFocusTrap';

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

/**
 * Main Modal component
 */
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
