/**
 * Base Modal Component
 *
 * A reusable modal component with animations, backdrop, and accessibility features.
 * Based on the cargoplan modal implementation.
 */

import React, { memo, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Portal } from "./Portal";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";

/**
 * Backdrop component with blur and opacity effects
 */
const Backdrop = ({
  onClick,
  zIndex = 40,
  opacity = 0.5,
  className = "",
}: {
  onClick?: () => void;
  zIndex?: number;
  opacity?: number;
  className?: string;
}) => {
  const inlineStyle: React.CSSProperties = {
    zIndex,
    backgroundColor: `rgba(0, 0, 0, ${opacity})`,
    backdropFilter: "blur(2px)",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 ${className}`}
      style={inlineStyle}
      onClick={onClick}
    />
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  subtitle?: string;
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
    confirmText = "Confirm",
    closeOnBackdropClick = true,
    className = "",
    disableClose = false,
    maxWidth = "max-w-[600px]",
    backdropOpacity = 0.3,
    backdropZIndex = 40,
    size,
  }: ModalProps) => {
    const sizeClasses: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
    };

    const maxWidthClass = size && sizeClasses[size] ? sizeClasses[size] : maxWidth;

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
     * Handle keyboard events (Escape to close)
     */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen && !disableClose) {
          onClose();
        }
      },
      [isOpen, disableClose, onClose]
    );

    // Register keyboard event listener
    useEffect(() => {
      if (isOpen) {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }
    }, [isOpen, handleKeyDown]);

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

              <div className="fixed inset-0 z-50 flex items-start justify-center lg:justify-end p-2 md:p-6">
                <motion.div
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
                  className={`
                    bg-white
                    border border-gray-200
                    shadow-xl rounded
                    ${maxWidthClass}
                    w-full
                    h-[calc(100vh-16px)] md:h-[calc(100vh-48px)]
                    flex flex-col
                    origin-top lg:origin-top-right
                    relative
                    ${className}
                  `}
                  onClick={handleModalClick}
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <h2
                          id="modal-title"
                          className="text-lg font-semibold text-gray-900 truncate"
                          title={title}
                        >
                          {title}
                        </h2>
                        {subtitle && (
                          <span className="text-sm text-gray-600 mt-0.5">
                            {subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <IconButton
                        onClick={onClose}
                        icon={<Icon name="cross" className="w-5 h-5" />}
                        variant="danger"
                        size="md"
                        title="Close"
                        disabled={disableClose}
                      />

                      {onConfirm && (
                        <IconButton
                          onClick={onConfirm}
                          icon={<Icon name="check" className="w-5 h-5" />}
                          variant="success"
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

Modal.displayName = "Modal";

export { Modal };
export type { ModalProps };
export default Modal;
