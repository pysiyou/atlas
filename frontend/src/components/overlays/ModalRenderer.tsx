/**
 * Modal Renderer
 *
 * Renders the active modal from context. To add a new modal: (1) add its type to ModalType
 * in ModalContext and ModalPropsMap in modalTypes; (2) register it in registerModals.ts
 * (single place for all modal registration).
 */

import React, { useMemo, createElement } from 'react';
import { useModal } from '@/lib/context/ModalContext';
import { useSampleLookup } from '@/features/lab/api/samples.api';
import { getRegisteredModal } from './modalRegistry';
import { initializeModalRegistry } from './registerModals';
import { logger } from '@/utils/logger';

// Initialize modal registry on module load
initializeModalRegistry();

/**
 * ModalRenderer Component
 *
 * Renders the appropriate modal based on modalType from context.
 * Uses registry pattern for easy extensibility.
 */
export const ModalRenderer: React.FC = () => {
  const { modalType, modalProps, closeModal } = useModal();
  const { getSample } = useSampleLookup();

  const isOpen = modalType !== null && modalProps !== null;

  const modalComponent = useMemo(() => {
    if (!isOpen || !modalType || !modalProps) return null;

    const entry = getRegisteredModal(modalType);
    if (!entry) {
      logger.warn(`No modal registered for type: ${modalType}`);
      return null;
    }

    const baseProps = { isOpen, onClose: closeModal };
    const helpers = { getSample };
    const componentProps = entry.getProps(modalProps, baseProps, helpers);

    if (!componentProps) {
      setTimeout(() => closeModal(), 0);
      return null;
    }

    return createElement(entry.component, componentProps);
  }, [isOpen, modalType, modalProps, closeModal, getSample]);

  return <>{modalComponent}</>;
};
