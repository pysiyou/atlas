/**
 * Renders the current modal frame (at most one visible at a time).
 */

import React, { createElement, useEffect } from 'react';
import { useModal, useModalStack } from '@/lib/context/ModalContext';
import { modalFrameKey, modalFramePayload } from '@/lib/context/modalTypes';
import { getRegisteredModal, initializeModalRegistry } from './modalRegistry';
import { logger } from '@/utils/logger';

initializeModalRegistry();

/**
 * ModalRenderer Component
 *
 * Sample lookup is intentionally not mounted here — SAMPLE_DETAIL loads its own
 * sample by id so authenticated routes do not fetch the full samples list.
 */
export const ModalRenderer: React.FC = () => {
  const stack = useModalStack();
  const { closeModal } = useModal();

  const unknownType = stack.find(frame => !getRegisteredModal(frame.type))?.type;

  useEffect(() => {
    if (!unknownType) return;
    logger.warn(`No modal registered for type: ${unknownType}`);
    closeModal();
  }, [unknownType, closeModal]);

  return (
    <>
      {stack.map(frame => {
        const entry = getRegisteredModal(frame.type);
        if (!entry) return null;
        const frameKey = modalFrameKey(frame);
        return createElement(entry.component, {
          key: frameKey,
          isOpen: true,
          onClose: closeModal,
          isActive: true,
          ...modalFramePayload(frame),
        });
      })}
    </>
  );
};
