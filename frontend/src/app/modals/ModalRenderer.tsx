/**
 * Renders the current modal frame (at most one visible at a time).
 */

import React, { createElement, useEffect, useState } from 'react';
import { Modal } from '@/components/overlays/Modal';
import { ModalLoadingBody } from '@/components/overlays/modalLoading';
import { Text } from '@/components/layout/Text';
import { useModal, useModalStack } from '@/lib/context/ModalContext';
import { modalFrameKey, modalFramePayload, type ModalFrame } from '@/lib/context/modalTypes';
import {
  getModalLoader,
  initializeModalRegistry,
  isModalTypeRegistered,
  type RegisteredModalComponent,
} from './modalRegistry';
import { logger } from '@/utils/logger';

initializeModalRegistry();

const modalComponentCache = new Map<string, RegisteredModalComponent>();

function modalLoadingTitle(frame: ModalFrame): string {
  switch (frame.type) {
    case 'SAMPLE_DETAIL':
      return 'Sample collection';
    case 'RESULT_DETAIL':
      return 'Result entry';
    case 'TEST_DETAIL':
      return 'Test';
    case 'ESCALATION_RESOLUTION_DETAIL':
      return 'Escalation';
    case 'NEW_ORDER':
      return 'Order';
    case 'REPORT_PREVIEW':
      return 'Report';
    default:
      return 'Loading';
  }
}

interface LazyRegisteredModalProps {
  frame: ModalFrame;
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
}

const LazyRegisteredModal: React.FC<LazyRegisteredModalProps> = ({
  frame,
  isOpen,
  onClose,
  isActive,
}) => {
  const cached = modalComponentCache.get(frame.type) ?? null;
  const loader = getModalLoader(frame.type);
  const [asyncLoad, setAsyncLoad] = useState<{
    type: string;
    component: RegisteredModalComponent | null;
    failed: boolean;
  }>({ type: frame.type, component: cached, failed: false });

  useEffect(() => {
    if (cached || !loader) return;
    let cancelled = false;
    void loader()
      .then(({ default: loaded }) => {
        if (cancelled) return;
        modalComponentCache.set(frame.type, loaded);
        setAsyncLoad({ type: frame.type, component: loaded, failed: false });
      })
      .catch(err => {
        if (cancelled) return;
        logger.error('Failed to load modal component', err);
        setAsyncLoad({ type: frame.type, component: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [cached, frame.type, loader]);

  const Component = cached ?? (asyncLoad.type === frame.type ? asyncLoad.component : null);
  const loadFailed = !cached && (!loader || (asyncLoad.type === frame.type && asyncLoad.failed));

  const sharedProps = {
    isOpen,
    onClose,
    isActive,
    ...modalFramePayload(frame),
  };

  if (loadFailed) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Unable to open"
        size="3xl"
        isActive={isActive}
      >
        <Text role="body" intent="muted">This dialog failed to load. Please try again.</Text>
      </Modal>
    );
  }

  if (!Component) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalLoadingTitle(frame)}
        size="3xl"
        isActive={isActive}
      >
        <ModalLoadingBody variant="workflow" />
      </Modal>
    );
  }

  return createElement(Component, sharedProps);
};

/**
 * ModalRenderer Component
 *
 * Sample lookup is intentionally not mounted here — SAMPLE_DETAIL loads its own
 * sample by id so authenticated routes do not fetch the full samples list.
 */
export const ModalRenderer: React.FC = () => {
  const stack = useModalStack();
  const { closeModal } = useModal();

  const unknownType = stack.find(frame => !isModalTypeRegistered(frame.type))?.type;

  useEffect(() => {
    if (!unknownType) return;
    logger.warn(`No modal registered for type: ${unknownType}`);
    closeModal();
  }, [unknownType, closeModal]);

  return (
    <>
      {stack.map(frame => (
        <LazyRegisteredModal
          key={modalFrameKey(frame)}
          frame={frame}
          isOpen
          onClose={closeModal}
          isActive
        />
      ))}
    </>
  );
};
