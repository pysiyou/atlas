/**
 * Modal Registry
 * Maps modal types to their component configurations
 * Makes adding new modals scalable without modifying ModalRenderer
 */

import type { ComponentType } from 'react';
import { ModalType } from '@/shared/contexts/ModalContext';

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

// Type-safe registry
type ModalRegistry = {
  [K in ModalType]?: ModalRegistryEntry<any>;
};

const registry: ModalRegistry = {};

/**
 * Register a modal component
 */
export function registerModal<P extends BaseModalProps>(
  type: ModalType,
  component: ComponentType<P>,
  getProps: ModalRegistryEntry<P>['getProps']
): void {
  registry[type] = { component, getProps };
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
