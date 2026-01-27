/**
 * HTML Escaping Utilities
 * Prevents XSS attacks by escaping user-controlled content
 */

/**
 * Escape HTML special characters to prevent XSS
 * Converts <, >, &, ", ' to their HTML entity equivalents
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
