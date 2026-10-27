/**
 * Cursor tokens for clickable vs. static surfaces.
 * Pair with theme/components/interactive.css for native controls.
 */

export const INTERACTIVE = {
  clickable: 'cursor-pointer',
  notAllowed: 'cursor-not-allowed',
  default: 'cursor-default',
  text: 'cursor-text',
  help: 'cursor-help',
  grab: 'cursor-grab',
  grabbing: 'cursor-grabbing',
  /** Nested controls inside a clickable row/card — keeps child buttons on pointer. */
  actionIsland: 'cursor-default',
} as const;
