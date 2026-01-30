/**
 * SupervisorActionFeed - Role-gated list of escalated items with Resolve action.
 * Admin/lab-technician-plus only. Resolve opens escalation resolution modal.
 */

import React from 'react';
import { Button, Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { displayId } from '@/utils';
import { AttemptCounterBadge } from './AttemptCounterBadge';
import { TATTimerBadge } from './TATTimerBadge';
import type { PendingEscalationItem } from '@/types/lab-operations';

const MAX_RETEST_ATTEMPTS = 3;

export interface SupervisorActionFeedProps {
  items: PendingEscalationItem[];
  onResolve: (item: PendingEscalationItem) => void;
}

export const SupervisorActionFeed: React.FC<SupervisorActionFeedProps> = ({
  items,
  onResolve,
}) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-secondary">Supervisor actions</p>
      <ul className="space-y-2">
        {items.slice(0, 10).map(item => (
          <li key={item.id}>
            <div className="rounded border border-border bg-surface p-3 text-xs">
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
              <div className="mt-3 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Icon name={ICONS.actions.eye} className="text-white" />}
                  onClick={() => onResolve(item)}
                >
                  Resolve
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {items.length > 10 && (
        <p className="text-xxs text-text-tertiary">+{items.length - 10} more</p>
      )}
    </div>
  );
}
