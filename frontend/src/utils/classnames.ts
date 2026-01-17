/**
 * Utility function to merge class names
 * Similar to clsx or classnames, but simpler
 * 
 * @param classes - Array of class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, condition]) => condition)
          .map(([className]) => className)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}
