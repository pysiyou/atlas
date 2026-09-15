/**
 * SampleRejectedAlert — prominent warning when a test has a rejected sample.
 */

import React from 'react';
import { Alert } from '@/components';
import { displayId } from '@/utils';
import { LAB_COPY } from '../../constants/labCopy';

interface SampleRejectedAlertProps {
  sampleId?: number;
  sampleRejectionReason?: string;
  size?: 'default' | 'compact';
}

export const SampleRejectedAlert: React.FC<SampleRejectedAlertProps> = ({
  sampleId,
  sampleRejectionReason,
  size = 'default',
}) => {
  if (!sampleId) return null;

  const isCompact = size === 'compact';

  return (
    <Alert variant="warning" className={isCompact ? 'py-1.5' : 'py-2'}>
      <div className="space-y-1">
        <div>
          <p className={`font-semibold ${isCompact ? 'text-xxs' : 'text-xs'}`}>
            {LAB_COPY.quality.sampleRejected} — Validator Decision Required
          </p>
          <p className={`text-text-secondary leading-tight mt-0.5 ${isCompact ? 'text-xxs' : 'text-xs'}`}>
            {LAB_COPY.entity.sample} <span className="entity-id">{displayId.sample(sampleId)}</span> was rejected
            {sampleRejectionReason && (
              <>: <span className="italic">{sampleRejectionReason}</span></>
            )}
          </p>
        </div>
        <div className={`space-y-0.5 ${isCompact ? 'text-xxs' : 'text-xs'} text-text-tertiary leading-tight`}>
          <p>This result was entered before sample rejection.</p>
          <p className="font-medium">You may still approve this result (clinical judgment) or choose another action:</p>
          <ul className="list-disc list-inside pl-2 space-y-0.5 mt-1">
            <li>Approve result (add validation notes explaining decision)</li>
            <li>Request recollection with new sample</li>
            <li>Cancel this test</li>
          </ul>
        </div>
      </div>
    </Alert>
  );
};
