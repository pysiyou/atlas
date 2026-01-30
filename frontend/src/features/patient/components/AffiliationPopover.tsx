import React from 'react';
import { Popover, FooterInfo } from '@/shared/ui';
import type { Affiliation } from '@/types';
import { AffiliationInfo } from './AffiliationInfoSection';
import { ICONS } from '@/utils';

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
        <div className="flex flex-col w-full max-w-xs">
          <div className="p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3 border-b border-border-subtle pb-2">
              Affiliation Details
            </h3>
            <AffiliationInfo affiliation={affiliation} />
          </div>
          <div className="px-4 py-3 bg-surface-canvas border-t border-border-subtle">
            <FooterInfo icon={ICONS.dataFields.user} text="Viewing affiliation" />
          </div>
        </div>
      )}
    </Popover>
  );
};
