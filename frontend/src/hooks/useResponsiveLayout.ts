import { useBreakpoint, isBreakpointAtLeast, isBreakpointAtMost, type Breakpoint } from './useBreakpoint';

export interface ResponsiveLayoutConfig {
  breakpoint: Breakpoint;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
}

/**
 * Hook for common responsive layout patterns
 * Provides convenient breakpoint checks for layout decisions
 * 
 * @returns ResponsiveLayoutConfig with breakpoint information
 * 
 * @example
 * ```tsx
 * const { isSmall, isMedium, isLarge } = useResponsiveLayout();
 * 
 * return (
 *   <div className={isSmall ? 'flex-col' : 'flex-row'}>
 *     {content}
 *   </div>
 * );
 * ```
 */
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
