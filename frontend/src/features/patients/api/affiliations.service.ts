/**
 * Affiliation API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { REFERENCE_DATA_LIMIT } from '@/lib/api/constants';
import type { AffiliationPricing } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';

export const affiliationAPI = {
  async getPricing(): Promise<AffiliationPricing[]> {
    return apiClient.get<AffiliationPricing[]>('/affiliations/pricing', {
      limit: String(REFERENCE_DATA_LIMIT),
    });
  },

  async getPrice(duration: AffiliationDuration): Promise<AffiliationPricing> {
    return apiClient.get<AffiliationPricing>(`/affiliations/pricing/${duration}`);
  },
};
