/**
 * Appointments Page
 * Appointment scheduling and management
 *
 * NOTE: Appointments context removed - will be migrated to TanStack Query when API is ready
 */

import React from 'react';
import { SectionContainer, Icon, PageHeaderBar } from '@/shared/ui';
import { ICONS } from '@/utils';

export const Appointments: React.FC = () => {
  return (
    <div className="min-h-0 flex-1 flex flex-col p-4 gap-6 overflow-hidden">
      <PageHeaderBar title="Appointments" />
      <SectionContainer title="Coming Soon">
        <div className="text-center py-8">
          <Icon name={ICONS.dataFields.date} className="w-16 h-16 mx-auto mb-4 text-fg-disabled" />
          <p className="text-sm text-fg">
            Appointment management will be available once the API is implemented.
          </p>
          <p className="text-sm text-fg-subtle mt-2">
            This feature will use TanStack Query hooks for data management.
          </p>
        </div>
      </SectionContainer>
    </div>
  );
};
