import React from 'react';
import { TYPE } from '@/components/theme/recipes';
import { Popover, FooterInfo } from '@/components';
import type { Affiliation } from '@/types';
import { AffiliationInfo } from './AffiliationInfoSection';
import { MODULE_ICONS } from '@/config/icons';

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
          <div className="p-panel">
            <h3 className={`${TYPE.amount} mb-space-3 border-b border-border-subtle pb-space-2`}>
              Affiliation Details
            </h3>
            <AffiliationInfo affiliation={affiliation} />
          </div>
          <div className="px-space-4 py-space-3 bg-surface-page border-t border-border-subtle">
            <FooterInfo icon={MODULE_ICONS.patients} label="Patients" />
          </div>
        </div>
      )}
    </Popover>
  );
};
