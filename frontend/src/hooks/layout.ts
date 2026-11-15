/** Breakpoint, responsive layout, and document visibility. */

import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const getBreakpoint = (width: number): Breakpoint => {
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
};

export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window !== 'undefined') {
      return getBreakpoint(window.innerWidth);
    }
    return 'lg';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

export const isBreakpointAtLeast = (current: Breakpoint, target: Breakpoint): boolean => {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(current);
  const targetIndex = breakpointOrder.indexOf(target);
  return currentIndex >= targetIndex;
};

export const isBreakpointAtMost = (current: Breakpoint, target: Breakpoint): boolean => {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(current);
  const targetIndex = breakpointOrder.indexOf(target);
  return currentIndex <= targetIndex;
};

export interface ResponsiveLayoutConfig {
  breakpoint: Breakpoint;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
}

export const useResponsiveLayout = (): ResponsiveLayoutConfig => {
  const breakpoint = useBreakpoint();

  return {
    breakpoint,
    isSmall: isBreakpointAtMost(breakpoint, 'sm'),
    isMedium: breakpoint === 'md',
    isLarge: isBreakpointAtLeast(breakpoint, 'lg'),
    isXLarge: isBreakpointAtLeast(breakpoint, 'xl'),
  };
};

export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return visible;
}