/**
 * Affiliation API Service
 * Handles all affiliation-related API calls
 */

import { apiClient } from './client';
import type { AffiliationPricing } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';

export const affiliationAPI = {
  /**
   * Get all active affiliation pricing options
   */
  async getPricing(): Promise<AffiliationPricing[]> {
    return apiClient.get<AffiliationPricing[]>('/affiliations/pricing');
  },

  /**
   * Get pricing for a specific affiliation duration
   */
  async getPrice(duration: AffiliationDuration): Promise<AffiliationPricing> {
    return apiClient.get<AffiliationPricing>(`/affiliations/pricing/${duration}`);
  },
};
