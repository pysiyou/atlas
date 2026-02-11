/**
 * Modal Registry
 * Maps modal types to their component configurations.
 * getProps receives typed modalProps per ModalType via ModalPropsMap.
 */

import type { ComponentType } from 'react';
import { ModalType } from '@/shared/context/ModalContext';
import type { ModalPropsMap } from '@/shared/context/modalTypes';

/**
 * Base props that all modals receive
 */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Registry entry: component + getProps. At runtime getProps receives Record<string, unknown>;
 * registerModal types getProps per ModalType for type-safe registration.
 */
export interface ModalRegistryEntry {
  component: ComponentType<BaseModalProps>;
  getProps: (
    modalProps: Record<string, unknown>,
    baseProps: BaseModalProps,
    helpers: ModalHelpers
  ) => BaseModalProps | null;
}

/**
 * Helpers available to modal prop extractors
 */
export interface ModalHelpers {
  getSample: (sampleId: string) => unknown;
}

const registry: Partial<Record<ModalType, ModalRegistryEntry>> = {};

/**
 * Register a modal. getProps is typed to receive ModalPropsMap[T] for type-safe registration.
 */
export function registerModal<T extends ModalType, P extends BaseModalProps>(
  type: T,
  component: ComponentType<P>,
  getProps: (
    modalProps: ModalPropsMap[T],
    baseProps: BaseModalProps,
    helpers: ModalHelpers
  ) => P | null
): void {
  registry[type] = {
    component: component as ComponentType<BaseModalProps>,
    getProps: getProps as ModalRegistryEntry['getProps'],
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
