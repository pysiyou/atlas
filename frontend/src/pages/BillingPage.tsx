/**
 * Billing Page
 * Billing and payment management
 *
 * NOTE: Billing context removed - will be migrated to TanStack Query when API is ready
 */

import React from 'react';
import { SectionContainer, Icon } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';
import { heading, body, neutralColors } from '@/shared/design-system/tokens';
import { gap, padding } from '@/shared/design-system/tokens/spacing';

export const Billing: React.FC = () => {
  return (
    <div className={gap.lg}>
      <h1 className={heading.h1}>Billing & Payments</h1>
      <SectionContainer title="Coming Soon">
        <div className={`text-center ${padding.section.lg}`}>
          <Icon name={ICONS.dataFields.creditCard} className={`w-16 h-16 mx-auto mb-4 ${neutralColors.text.disabled}`} />
          <p className={body.default}>
            Billing management will be available once the API is implemented.
          </p>
          <p className={`${body.small} mt-2`}>
            This feature will use TanStack Query hooks for data management.
          </p>
        </div>
      </SectionContainer>
    </div>
  );
};
