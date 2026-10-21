/**
 * Canonical design recipes — public barrel.
 *
 * ## Import convention
 * Import all recipe tokens from **`@/theme/recipes`** (or `@/theme`,
 * which re-exports this barrel). Do not import `@/theme/recipes/form`, `/lab`, etc.
 * from app or feature code — submodules exist for maintainability and are composed here.
 *
 * CSS variables live under `theme/tokens/`; composed Tailwind class stacks live in `recipes/*.ts`.
 * Tailwind scans this folder via `@source` in `src/index.css`.
 */
export * from './type';
export * from './tone';
export * from './surface';
export * from './spacing';
export * from './table';
export * from './panel';
export * from './overlay';
export * from './chrome';
export * from './control';
export * from './auth';
export * from './misc';
export * from './badge';
export * from './form';
export * from './lab';
export * from './dashboard';
