/**
 * useBreakpoint Hook
 *
 * Detects the current screen breakpoint using window resize listener.
 * Returns the current breakpoint name based on Tailwind CSS breakpoints.
 *
 * Breakpoints:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Get the current breakpoint based on window width
 * @param width - Window width in pixels
 * @returns Current breakpoint name
 */
const getBreakpoint = (width: number): Breakpoint => {
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
};

/**
 * Hook to detect current screen breakpoint
 * @returns Current breakpoint name
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
 * ```
 */
export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    // Initialize with current window width (only on client)
    if (typeof window !== 'undefined') {
      return getBreakpoint(window.innerWidth);
    }
    return 'lg'; // Default to 'lg' for SSR
  });

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    /**
     * Handle window resize
     */
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    // Set initial breakpoint
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoint;
};

/**
 * Check if current breakpoint matches or is above the given breakpoint
 * @param current - Current breakpoint
 * @param target - Target breakpoint to check
 * @returns true if current breakpoint is at or above target
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * const isDesktop = isBreakpointAtLeast(breakpoint, 'lg');
 * ```
 */
export const isBreakpointAtLeast = (current: Breakpoint, target: Breakpoint): boolean => {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(current);
  const targetIndex = breakpointOrder.indexOf(target);
  return currentIndex >= targetIndex;
};

/**
 * Check if current breakpoint matches or is below the given breakpoint
 * @param current - Current breakpoint
 * @param target - Target breakpoint to check
 * @returns true if current breakpoint is at or below target
 */
export const isBreakpointAtMost = (current: Breakpoint, target: Breakpoint): boolean => {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(current);
  const targetIndex = breakpointOrder.indexOf(target);
  return currentIndex <= targetIndex;
};
