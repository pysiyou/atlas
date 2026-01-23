/**
 * Order Detail Utility Functions
 */

/**
 * Formats a date to a readable string
 */
export const formatOrderDate = (date: string | Date, format: 'long' | 'short' = 'long'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
