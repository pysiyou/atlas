/**
 * Base Modal Component
 *
 * A reusable modal component with animations, backdrop, and accessibility features.
 * Based on the cargoplan modal implementation.
 */

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Portal } from './Portal';
import { IconButton } from '@/components/primitives/IconButton';

/**
 * Backdrop component with blur and opacity effects
 */
const Backdrop = ({
  onClick,
  zIndex = 40,
  opacity = 0.3,
  className = '',
}: {
  onClick?: () => void;
  zIndex?: number;
  opacity?: number;
  className?: string;
}) => {
  const inlineStyle: React.CSSProperties = {
    zIndex,
    backgroundColor: 'var(--overlay)', // usually a dark color
    backdropFilter: 'blur(2px)',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }} // We animate to 1, but we use the opacity prop to control the *max* opacity via style
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 ${className}`}
      style={{ ...inlineStyle, opacity }} // Apply the requested opacity here
      onClick={onClick}
    />
  );
};

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

const BASE_MODAL_CLASSES = 'relative bg-surface border border-border-default rounded-lg shadow-xl w-full';

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
 *
 * Features:
 * - Animated entrance/exit
 * - Backdrop with configurable opacity and blur
 * - Keyboard support (Escape to close)
 * - Focus trap
 * - Optional confirm button
 * - Responsive design
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

    /**
     * Prevent modal click from closing the modal
     */
    const handleModalClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    /**
     * Handle backdrop click
     */
    const handleBackdropClickWrapper = useCallback(() => {
      if (closeOnBackdropClick && !disableClose) {
        onClose();
      }
    }, [closeOnBackdropClick, disableClose, onClose]);

    /**
     * Handle keyboard events (Escape to close, Tab to trap focus)
     */
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !disableClose) {
          onClose();
          return;
        }

        // Focus trap
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      // Focus the first element when opening
      // Use a small timeout to allow animation/rendering to complete
      const timer = setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 50);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }, [isOpen, disableClose, onClose]);

    return (
      <Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              <Backdrop
                onClick={handleBackdropClickWrapper}
                opacity={backdropOpacity}
                zIndex={backdropZIndex}
              />

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
                  onClick={handleModalClick}
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-border-default bg-surface flex items-center justify-between shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <h2
                          id="modal-title"
                          className="text-lg font-semibold text-text-primary truncate"
                          title={typeof title === 'string' ? title : undefined}
                        >
                          {title}
                        </h2>
                        {subtitle && (
                          <span className="text-sm text-text-tertiary mt-0.5">{subtitle}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <IconButton
                        onClick={onClose}
                        variant="close"
                        size="md"
                        title="Close"
                        disabled={disableClose}
                      />

                      {onConfirm && (
                        <IconButton
                          onClick={onConfirm}
                          variant="confirm"
                          size="md"
                          disabled={confirmDisabled}
                          title={confirmText}
                        />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="grow overflow-hidden relative flex flex-col min-h-0">
                    {children}
                  </div>
                </motion.div>
              </div>
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
