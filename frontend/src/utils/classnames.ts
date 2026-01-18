/**
 * Classname Utilities
 * Utility for conditionally joining classNames together
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

/**
 * Conditionally join classNames together
 * @param classes - Class values to join
 * @returns Joined class string
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((x): x is string | number => Boolean(x) && typeof x !== 'boolean')
    .map(String)
    .join(' ');
}
