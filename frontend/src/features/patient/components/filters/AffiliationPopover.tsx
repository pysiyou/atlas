import React from 'react';
import { Popover } from '@/shared/ui';
import type { Affiliation } from '@/types';
import { AffiliationInfo } from '../../sections/AffiliationInfoSection';

interface AffiliationPopoverProps {
  affiliation?: Affiliation;
  trigger: React.ReactNode;
}

/**
 * AffiliationPopover Component
 *
 * Displays patient affiliation information in a concise grid layout.
 * Triggered by an element passed via props.
 */
export const AffiliationPopover: React.FC<AffiliationPopoverProps> = ({ affiliation, trigger }) => {
  if (!affiliation) return null;

  return (
    <Popover trigger={trigger} placement="bottom-start" offsetValue={8}>
      {() => (
        <div className="p-4 w-full max-w-xs">
          <h3 className="text-sm font-medium text-text-primary mb-3 border-b border-border-subtle pb-2">
            Affiliation Details
          </h3>
          <AffiliationInfo affiliation={affiliation} />
        </div>
      )}
    </Popover>
  );
};
