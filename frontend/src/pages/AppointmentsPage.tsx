/**
 * Appointments Page
 * Appointment scheduling and management
 *
 * NOTE: Appointments context removed - will be migrated to TanStack Query when API is ready
 */

import React from 'react';
import { SectionContainer, Icon } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';
import { heading, body } from '@/shared/design-system/tokens/typography';
import { neutralColors } from '@/shared/design-system/tokens/colors';
import { padding } from '@/shared/design-system/tokens/spacing';

export const Appointments: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className={heading.h2}>Appointments</h1>
      <SectionContainer title="Coming Soon">
        <div className={`text-center ${padding.vertical.xl}`}>
          <Icon name={ICONS.dataFields.date} className={`w-16 h-16 mx-auto mb-4 ${neutralColors.text.disabled}`} />
          <p className={body.default}>
            Appointment management will be available once the API is implemented.
          </p>
          <p className={`${body.small} ${neutralColors.text.muted} mt-2`}>
            This feature will use TanStack Query hooks for data management.
          </p>
        </div>
      </SectionContainer>
    </div>
  );
};
