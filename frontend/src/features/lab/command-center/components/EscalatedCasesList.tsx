/**
 * EscalatedCasesList - List of escalated items with TAT and attempt badges.
 * All roles see this; click opens escalation resolution (or navigates to Escalation tab).
 */

import React from 'react';
import { displayId } from '@/utils';
import { AttemptCounterBadge } from './AttemptCounterBadge';
import { TATTimerBadge } from './TATTimerBadge';
import type { PendingEscalationItem } from '@/types/lab-operations';

export interface EscalatedCasesListProps {
  items: PendingEscalationItem[];
  onItemClick?: (item: PendingEscalationItem) => void;
}

const MAX_RETEST_ATTEMPTS = 3;

export const EscalatedCasesList: React.FC<EscalatedCasesListProps> = ({
  items,
  onItemClick,
}) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-secondary">Escalated cases</p>
      <ul className="space-y-2">
        {items.slice(0, 10).map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onItemClick?.(item)}
              className="w-full text-left rounded border border-border-default bg-surface-default p-3 text-xs hover:border-action-primary hover:bg-action-primary-muted-bg transition-colors"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium text-text-primary truncate">
                  {item.patientName} · {item.testName}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.isRetest && (
                    <AttemptCounterBadge
                      attempt={(item.retestNumber ?? 0) + 1}
                      max={MAX_RETEST_ATTEMPTS}
                    />
                  )}
                  <TATTimerBadge sinceIso={item.resultEnteredAt ?? item.orderDate} />
                </div>
              </div>
              <div className="mt-1 text-xxs text-text-tertiary font-mono">
                {displayId.order(item.orderId)} · {item.testCode}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {items.length > 10 && (
        <p className="text-xxs text-text-tertiary">+{items.length - 10} more</p>
      )}
    </div>
  );
}
