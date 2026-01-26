/**
 * Billing Page
 * Billing and payment management
 *
 * NOTE: Billing context removed - will be migrated to TanStack Query when API is ready
 */

import React from 'react';
import { SectionContainer, Icon } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';

export const Billing: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Billing & Payments</h1>
      <SectionContainer title="Coming Soon">
        <div className="text-center py-8">
          <Icon name={ICONS.dataFields.creditCard} className="w-16 h-16 mx-auto mb-4 text-text-disabled" />
          <p className="text-sm text-text-primary">
            Billing management will be available once the API is implemented.
          </p>
          <p className="text-sm text-text-secondary mt-2">
            This feature will use TanStack Query hooks for data management.
          </p>
        </div>
      </SectionContainer>
    </div>
  );
};
