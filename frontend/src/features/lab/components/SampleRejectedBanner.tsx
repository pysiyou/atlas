/**
 * Warning banner when a resulted test's linked sample was rejected after result entry.
 */
import { Alert } from '@/components/display';

import { RecordId } from '@/features/shared';
import {text, FG } from '@/theme/recipes';
import { useLabCopy } from '@/strings';

export interface SampleRejectedBannerProps {
  sampleId?: string | null;
  sampleRejectionReason?: string;
  size?: 'default' | 'compact';
}

export function SampleRejectedBanner({
  sampleId,
  sampleRejectionReason,
  size = 'default',
}: SampleRejectedBannerProps) {
  const labCopy = useLabCopy();
  if (!sampleId) return null;

  const isCompact = size === 'compact';
  const quality = labCopy.quality;

  return (
    <Alert variant="warning" className={isCompact ? 'py-space-1-5' : 'py-space-2'}>
      <div className="space-y-space-1">
        <div>
          <p className={`font-semibold ${isCompact ? text({ role: 'caption' }) : text({ role: 'body' })}`}>
            {quality.sampleRejected} — {quality.validatorDecisionRequired}
          </p>
          <p
            className={`${FG.labelMuted} leading-tight mt-space-0-5 ${isCompact ? text({ role: 'caption' }) : text({ role: 'body' })}`}
          >
            {labCopy.entity.sample} <RecordId type="sample" value={sampleId} /> {quality.wasRejected}
            {sampleRejectionReason && (
              <>
                : <span className="italic">{sampleRejectionReason}</span>
              </>
            )}
          </p>
        </div>
        <div
          className={`space-y-space-0-5 ${isCompact ? text({ role: 'caption' }) : text({ role: 'body' })} ${FG.captionMuted} leading-tight`}
        >
          <p>{quality.enteredBeforeRejection}</p>
          <p className="font-medium">{quality.approveOrAction}</p>
          <ul className="list-disc list-inside pl-space-2 space-y-space-0-5 mt-space-1">
            <li>{quality.actionApprove}</li>
            <li>{quality.actionRecollect}</li>
            <li>{quality.actionCancel}</li>
          </ul>
        </div>
      </div>
    </Alert>
  );
}
