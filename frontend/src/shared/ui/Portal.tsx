/**
 * Portal Component
 * 
 * Renders children into a DOM node that exists outside the parent component hierarchy.
 * Used for modals, tooltips, and other overlay elements.
 */

import { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: Element;
}

/**
 * Portal component that renders children in a separate DOM tree
 * Uses useLayoutEffect to avoid hydration issues
 */
export const Portal: React.FC<PortalProps> = ({ 
  children, 
  container = document.body 
}) => {
  const [mounted, setMounted] = useState(false);

  // Use useLayoutEffect to set mounted state before paint
  // This is the recommended approach for portal mounting
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, container);
};
