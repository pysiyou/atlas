/**
 * Modal Registry
 * Maps modal types to their component configurations
 * Makes adding new modals scalable without modifying ModalRenderer
 */

import type { ComponentType } from 'react';
import { ModalType } from '@/shared/context/ModalContext';

/**
 * Base props that all modals receive
 */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Registry entry for a modal
 */
interface ModalRegistryEntry<P extends BaseModalProps = BaseModalProps> {
  /** The modal component */
  component: ComponentType<P>;
  /** Function to extract component props from modal context props */
  getProps: (
    modalProps: Record<string, unknown>,
    baseProps: BaseModalProps,
    helpers: ModalHelpers
  ) => P | null;
}

/**
 * Helpers available to modal prop extractors
 */
export interface ModalHelpers {
  getSample: (sampleId: string) => unknown;
}

// Type-safe registry - using generic ModalRegistryEntry to allow various modal prop types
type ModalRegistry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in ModalType]?: ModalRegistryEntry<any>;
};

const registry: ModalRegistry = {};

/**
 * Register a modal component
 * Note: getProps return type is loosened to avoid strict type inference issues
 * with complex modal prop types. The runtime behavior is correct.
 */
export function registerModal<P extends BaseModalProps>(
  type: ModalType,
  component: ComponentType<P>,
  getProps: (
    modalProps: Record<string, unknown>,
    baseProps: BaseModalProps,
    helpers: ModalHelpers
  ) => P | null
): void {
  registry[type] = {
    component: component as ComponentType<BaseModalProps>,
    getProps: getProps as (
      modalProps: Record<string, unknown>,
      baseProps: BaseModalProps,
      helpers: ModalHelpers
    ) => BaseModalProps | null,
  };
}

/**
 * Get a registered modal
 */
export function getRegisteredModal(type: ModalType): ModalRegistryEntry | undefined {
  return registry[type];
}

/**
 * Check if a modal type is registered
 */
export function isModalRegistered(type: ModalType): boolean {
  return type in registry;
}

/**
 * Get all registered modal types
 */
export function getRegisteredModalTypes(): ModalType[] {
  return Object.keys(registry) as ModalType[];
}
