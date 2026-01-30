/**
 * RetestQueueCard - Retest queue summary with attempt badge.
 */

import React from 'react';
import { AttemptCounterBadge } from './AttemptCounterBadge';
import type { RetestItem } from '../types';

export interface RetestQueueCardProps {
  items: RetestItem[];
  onViewQueue?: () => void;
}

export const RetestQueueCard: React.FC<RetestQueueCardProps> = ({ items, onViewQueue }) => {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-text-secondary">Retest queue</p>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((item, i) => (
          <li
            key={`${item.orderId}-${item.testCode}-${i}`}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="truncate text-text-primary">
              {item.patientName} · {item.testName}
            </span>
            <AttemptCounterBadge attempt={item.attemptCount} max={item.maxAttempts} />
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
          className="text-xxs text-action-primary font-medium hover:underline"
        >
          View entry queue →
        </button>
      )}
    </div>
  );
}
