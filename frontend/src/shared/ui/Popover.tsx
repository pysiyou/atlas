/**
 * Popover Component
 *
 * A reusable, self-positioning popover component that can be used throughout the application.
 * Based on the cargoplan popover implementation.
 *
 * Features:
 * - Automatic positioning with flip and shift behavior
 * - Smooth animations using framer-motion
 * - Click outside to dismiss
 * - Portal rendering to avoid z-index issues
 * - Responsive sizing
 *
 * Note: The react-hooks/refs rule is disabled because @floating-ui/react's refs.setFloating
 * and refs.setReference are callback ref setters, not ref.current accesses. This is a
 * false positive from the ESLint rule.
 */
/* eslint-disable react-hooks/refs */

import React, { useState, useEffect } from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  useInteractions,
  useClick,
  useRole,
  useDismiss,
  FloatingPortal,
  autoUpdate,
} from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

/**
 * Placement options for the popover
 */
export type PopoverPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'bottom-end'
  | 'bottom-start'
  | 'top-end'
  | 'top-start'
  | 'left-end'
  | 'left-start'
  | 'right-end'
  | 'right-start';

/**
 * Props for the Popover component
 */
export interface PopoverProps {
  /** The trigger element that opens the popover. Can be a React node or a function that receives isOpen state */
  trigger: React.ReactNode | ((props: { isOpen: boolean }) => React.ReactNode);
  /** The content to display in the popover. Can be a React node or a function that receives close callback */
  children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
  /** Placement of the popover relative to the trigger (default: "bottom") */
  placement?: PopoverPlacement;
  /** Animation duration in seconds (default: 0.2) */
  duration?: number;
  /** Offset distance from the trigger element in pixels (default: 8) */
  offsetValue?: number;
  /** Padding around viewport edges in pixels (default: 8) */
  viewportPadding?: number;
  /** Remove border from popover container */
  noBorder?: boolean;
  /** Custom className for the popover content */
  className?: string;
  /** Show backdrop overlay (default: true) */
  showBackdrop?: boolean;
  /** When true, prevents closing via backdrop click or escape (e.g. while submitting) */
  preventClose?: boolean;
}

// Global style for hiding scrollbars
const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

/**
 * Props for the FloatingContent inner component
 */
interface FloatingContentProps {
  floatingRef: (node: HTMLElement | null) => void;
  floatingStyles: React.CSSProperties;
  floatingProps: Record<string, unknown>;
  noBorder: boolean;
  className: string;
  onClose: () => void;
  children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
}

/**
 * Inner component for popover content to properly handle the floating ref
 * Extracted to avoid eslint react-hooks/refs false positive
 */
const FloatingContent: React.FC<FloatingContentProps> = ({
  floatingRef,
  floatingStyles,
  floatingProps,
  noBorder,
  className,
  onClose,
  children,
}) => {
  return (
    <div ref={floatingRef} style={floatingStyles} className="z-[100]">
      <motion.div
        {...floatingProps}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'bg-surface text-text-primary border border-border-default shadow-lg rounded overflow-hidden flex flex-col h-full',
          noBorder && 'border-0',
          className
        )}
      >
        <div className="hide-scrollbar h-full flex flex-col">
          {typeof children === 'function' ? children({ close: onClose }) : children}
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Popover component that automatically positions itself relative to a trigger element
 */
export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  placement = 'bottom',
  offsetValue = 8,
  viewportPadding = 8,
  noBorder = false,
  className = '',
  showBackdrop = true,
  preventClose = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Floating UI setup for positioning
  const { refs, floatingStyles, context, update } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift({
        padding: viewportPadding,
        crossAxis: true,
      }),
      size({
        apply({ availableHeight, availableWidth, elements }) {
          // Prevent popover from exceeding viewport
          // Set max dimensions - the content will respect these via CSS
          elements.floating.style.maxHeight = `${availableHeight}px`;
          elements.floating.style.maxWidth = `${availableWidth}px`;
          // Ensure the popover doesn't exceed available width
          if (availableWidth < 200) {
            // If available width is less than minimum, use available width
            elements.floating.style.width = `${availableWidth}px`;
          }
        },
        padding: viewportPadding,
      }),
    ],
  });

  // Force position recalculation when popover opens
  useEffect(() => {
    if (!isOpen) return;

    // Trigger update after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (refs.floating.current && update) {
        update();
      }
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [isOpen, update, refs.floating]);

  // Floating UI interactions - disable dismiss (outside click, escape) when preventClose
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useRole(context),
    useDismiss(context, { enabled: !preventClose }),
  ]);

  return (
    <>
      <style>{hideScrollbarStyle}</style>
      <div ref={refs.setReference} {...getReferenceProps()} className="w-full">
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop with blur effect (optional) */}
              {showBackdrop && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-99"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(2px)',
                  }}
                  onClick={() => { if (!preventClose) setIsOpen(false); }}
                />
              )}

              {/* Popover content - refs.setFloating is a callback ref setter from @floating-ui/react, safe to use during render */}
              <FloatingContent
                floatingRef={refs.setFloating}
                floatingStyles={floatingStyles}
                floatingProps={getFloatingProps()}
                noBorder={noBorder}
                className={className}
                onClose={() => setIsOpen(false)}
              >
                {children}
              </FloatingContent>
            </>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
};
