/**
 * Appointments Page
 * Appointment scheduling and management
 *
 * NOTE: Appointments context removed - will be migrated to TanStack Query when API is ready
 */

import React from 'react';
import { SectionContainer, Icon } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';

export const Appointments: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Appointments</h1>
      <SectionContainer title="Coming Soon">
        <div className="text-center py-8">
          <Icon name={ICONS.dataFields.date} className="w-16 h-16 mx-auto mb-4 text-text-disabled" />
          <p className="text-sm text-text-primary">
            Appointment management will be available once the API is implemented.
          </p>
          <p className="text-sm text-text-tertiary mt-2">
            This feature will use TanStack Query hooks for data management.
          </p>
        </div>
      </SectionContainer>
    </div>
  );
};
