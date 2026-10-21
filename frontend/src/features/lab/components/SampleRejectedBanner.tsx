/**
 * Warning banner when a resulted test's linked sample was rejected after result entry.
 */
import { Alert } from '@/components/display';
import { RecordId } from '@/features/shared/components';
import {text, FG } from '@/theme/recipes';
import { LAB_COPY } from '../constants/labConstants';

export interface SampleRejectedBannerProps {
  sampleId?: number;
  sampleRejectionReason?: string;
  size?: 'default' | 'compact';
}

export function SampleRejectedBanner({
  sampleId,
  sampleRejectionReason,
  size = 'default',
}: SampleRejectedBannerProps) {
  if (!sampleId) return null;

  const isCompact = size === 'compact';

  return (
    <Alert variant="warning" className={isCompact ? 'py-space-1-5' : 'py-space-2'}>
      <div className="space-y-space-1">
        <div>
          <p className={`font-semibold ${isCompact ? text({ role: 'caption' }) : text({ role: 'body' })}`}>
            {LAB_COPY.quality.sampleRejected} — Validator Decision Required
          </p>
          <p
            className={`${FG.labelMuted} leading-tight mt-space-0-5 ${isCompact ? text({ role: 'caption' }) : text({ role: 'body' })}`}
          >
            {LAB_COPY.entity.sample} <RecordId type="sample" value={sampleId} /> was rejected
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
          <p>This result was entered before sample rejection.</p>
          <p className="font-medium">
            You may still approve this result (clinical judgment) or choose another action:
          </p>
          <ul className="list-disc list-inside pl-space-2 space-y-space-0-5 mt-space-1">
            <li>Approve result (add validation notes explaining decision)</li>
            <li>Request recollection with new sample</li>
            <li>Cancel this test</li>
          </ul>
        </div>
      </div>
    </Alert>
  );
}
