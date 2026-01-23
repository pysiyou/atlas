/**
 * Orders Hook (Backward Compatibility Export)
 * 
 * This file now serves as a re-export layer for the refactored order hooks.
 * The implementation has been split into focused modules:
 * 
 * - orders/useOrderQueries.ts - Query hooks for fetching data
 * - orders/useOrderMutations.ts - Mutation hooks for modifying data  
 * - orders/useOrderUtils.ts - Utility hooks for search/lookup
 * 
 * All exports remain the same to maintain backward compatibility.
 * 
 * @deprecated Import directly from @/hooks/queries/orders instead
 * @module hooks/queries/useOrders
 */

export * from './orders';
