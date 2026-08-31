/**
 * Animated modal dialog panel (header + scrollable content).
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { IconButton } from '@/components/primitives/IconButton';

const BASE_MODAL_CLASSES =
  'relative bg-surface border border-border-default rounded-lg shadow-xl w-full';

export interface ModalDialogProps {
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
}

export const ModalDialog = memo(({
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
}: ModalDialogProps) => (
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

        <div className="grow overflow-hidden relative flex flex-col min-h-0">
          {children}
        </div>
      </motion.div>
    </div>
));

