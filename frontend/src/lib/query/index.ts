/**
 * Query Module Exports
 * 
 * Centralized exports for TanStack Query configuration and utilities.
 */

// Query client and configuration
export { 
  getQueryClient, 
  createQueryClient, 
  resetQueryClient,
  cacheConfig,
} from './client';

// Query keys factory
export { queryKeys } from './keys';
export type { QueryKeys } from './keys';

// Provider component
export { QueryProvider } from './QueryProvider';
