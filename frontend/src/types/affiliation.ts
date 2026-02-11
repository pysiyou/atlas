/**
 * Affiliation Pricing Types
 * Types for affiliation pricing and plan selection
 */

import type { AffiliationDuration } from '@/shared/types/enums';

/**
 * Affiliation pricing information from backend
 */
export interface AffiliationPricing {
  duration: AffiliationDuration;
  price: number;
  isActive: boolean;
}

/**
 * Affiliation plan combining duration config with pricing
 */
export interface AffiliationPlan {
  duration: AffiliationDuration;
  label: string;
  price: number;
  monthlyPrice: number; // Price per month for comparison
  isBestValue?: boolean; // Flag for "Best Value" badge (typically 12 months)
}
