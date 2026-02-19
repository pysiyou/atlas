/**
 * Portal Component
 *
 * Renders children into a DOM node that exists outside the parent component hierarchy.
 * Used for modals, tooltips, and other overlay elements.
 */

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: Element;
}

/**
 * Client-only render detection using useSyncExternalStore
 * This is the recommended approach for detecting client-side rendering
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    // Subscribe function (no-op since this value never changes)
    () => () => {},
    // Get snapshot on client
    () => true,
    // Get snapshot on server
    () => false
  );
}

/**
 * Portal component that renders children in a separate DOM tree
 * Uses useSyncExternalStore to avoid hydration issues and comply with React rules
 */
export const Portal: React.FC<PortalProps> = ({ children, container = document.body }) => {
  const isClient = useIsClient();

  if (!isClient) return null;

  return createPortal(children, container);
};
