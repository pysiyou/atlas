/**
 * Modal Renderer
 *
 * Renders the active modal from context. To add a new modal: (1) add its type to ModalType
 * in ModalContext and ModalPropsMap in modalTypes; (2) register it in modalRegistry.ts
 * (single place for all modal registration).
 */

import React, { Suspense, useEffect, useMemo, createElement } from 'react';
import { useModal } from '@/lib/context/ModalContext';
import { getRegisteredModal, initializeModalRegistry } from './modalRegistry';
import { logger } from '@/utils/logger';

initializeModalRegistry();

/**
 * ModalRenderer Component
 *
 * Renders the appropriate modal based on modalType from context.
 * Uses registry pattern for easy extensibility.
 *
 * Sample lookup is intentionally not mounted here — SAMPLE_DETAIL loads its own
 * sample by id so authenticated routes do not fetch the full samples list.
 */
export const ModalRenderer: React.FC = () => {
  const { modalType, modalProps, closeModal } = useModal();
  const isOpen = modalType !== null;

  const entry = modalType ? getRegisteredModal(modalType) : undefined;

  const componentProps = useMemo(() => {
    if (!isOpen || !modalType || !entry) return null;

    const baseProps = { isOpen, onClose: closeModal };
    return entry.getProps(modalProps ?? {}, baseProps, { getSample: () => undefined });
  }, [isOpen, modalType, modalProps, closeModal, entry]);

  useEffect(() => {
    if (!isOpen || !modalType) return;
    if (!entry) {
      logger.warn(`No modal registered for type: ${modalType}`);
      closeModal();
      return;
    }
    if (!componentProps) {
      closeModal();
    }
  }, [isOpen, modalType, entry, componentProps, closeModal]);

  const modalComponent = useMemo(() => {
    if (!componentProps || !entry) return null;
    return createElement(entry.component, componentProps);
  }, [componentProps, entry]);

  return <Suspense fallback={null}>{modalComponent}</Suspense>;
};
