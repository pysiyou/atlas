/**
 * Animated modal dialog panel (header + scrollable content).
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { IconButton } from '@/components/primitives';
import { DialogHeader } from './DialogChrome';

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

        <div className="grow overflow-hidden relative flex flex-col min-h-0">
          {children}
        </div>
      </motion.div>
    </div>
));

