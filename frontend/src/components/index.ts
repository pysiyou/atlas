/**
 * components/index.ts — Top-level barrel for @/components.
 *
 * These are the NEW canonical paths. Old subdirectory indexes (ui/, feedback/, data/, form/)
 * remain untouched and continue to work for any imports that haven't migrated yet.
 */

export * from './primitives';
export * from './inputs';
export * from './overlays';
export * from './display';
export * from './surfaces';
export * from './data-table';
export * from './loaders';
export * from './layout';
export * from './theme';
