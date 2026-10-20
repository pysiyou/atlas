/**
 * Renders every frame in the modal stack. Lower frames stay mounted and inert.
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
      {stack.map((frame, index) => {
        const entry = getRegisteredModal(frame.type);
        if (!entry) return null;
        const isActive = index === stack.length - 1;
        const frameKey = modalFrameKey(frame);
        return createElement(entry.component, {
          key: frameKey,
          isOpen: true,
          onClose: closeModal,
          isActive,
          ...modalFramePayload(frame),
        });
      })}
    </>
  );
};
