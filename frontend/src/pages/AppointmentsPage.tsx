/**
 * Appointments Page
 * Appointment scheduling and management
 *
 * NOTE: Appointments context removed - will be migrated to TanStack Query when API is ready
 */

import React from 'react';
import { SectionContainer, Icon } from '@/shared/ui';

export const Appointments: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
      <SectionContainer title="Coming Soon">
        <div className="text-center py-12">
          <Icon name="calendar" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            Appointment management will be available once the API is implemented.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This feature will use TanStack Query hooks for data management.
          </p>
        </div>
      </SectionContainer>
    </div>
  );
};
