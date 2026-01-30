/**
 * RejectedRecollectList - Rejected samples awaiting recollection.
 */

import React from 'react';
import { displayId } from '@/utils';
import type { RejectedSampleSummary } from '../types';

export interface RejectedRecollectListProps {
  items: RejectedSampleSummary[];
  onViewQueue?: () => void;
}

export const RejectedRecollectList: React.FC<RejectedRecollectListProps> = ({
  items,
  onViewQueue,
}) => {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-text-secondary">Rejected — recollect</p>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((item, i) => (
          <li
            key={`${item.sampleId}-${i}`}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="truncate text-text-primary">
              {item.patientName} · {displayId.sample(item.sampleId)}
            </span>
            {item.rejectionReasons?.length ? (
              <span className="text-xxs text-amber-700 truncate max-w-[120px]" title={item.rejectionReasons.join(', ')}>
                {item.rejectionReasons[0]}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {items.length > 5 && (
        <p className="text-xxs text-text-tertiary">+{items.length - 5} more</p>
      )}
      {onViewQueue && (
        <button
          type="button"
          onClick={onViewQueue}
          className="text-xxs text-brand font-medium hover:underline"
        >
          View collection →
        </button>
      )}
    </div>
  );
}
