/**
 * Filter components exports
 * 
 * Note: AgeFilter has been moved to @/utils/filters/filter-controls/
 * AffiliationPopover remains here as it's a display component, not a filter
 */

export * from './AffiliationPopover';

// AffiliationStatus type (moved from PatientFilters)
export type AffiliationStatus = 'active' | 'inactive';
