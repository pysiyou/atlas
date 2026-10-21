/**
 * Plain-text list of order tests with navigation to order test detail.
 */

import React from 'react';
import { RecordId } from '@/features/shared/components';
import type { OrderTest } from '@/types';
import { displayId } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { text, INLINE_LINK_BUTTON } from '@/theme/recipes';

export type LinkedOrderTestsListProps = {
  tests: OrderTest[];
  onOpen: (test: OrderTest) => void;
};

export const LinkedOrderTestsList: React.FC<LinkedOrderTestsListProps> = ({ tests, onOpen }) => {
  if (tests.length === 0) return null;

  return (
    <ul className={`space-y-space-0-5 leading-snug ${text({ role: 'body' })}`}>
      {tests.map(test => (
        <li
          key={test.id ?? `${test.testCode}-${test.createdAt}`}
          className="flex flex-wrap items-center justify-between gap-x-space-2 min-h-0"
        >
          <div className="min-w-0 flex flex-wrap items-baseline gap-x-space-2 gap-y-0">
            <span className={`font-medium ${text({ role: 'body' })}`}>{test.testName}</span>
            <RecordId emphasis="inline">{test.testCode}</RecordId>
            {test.id != null ? (
              <span className={text({ role: 'body', intent: 'muted' })}>{displayId.orderTest(test.id)}</span>
            ) : null}
            <span className={text({ role: 'body', intent: 'muted' })}>{formatStatusBadgeLabel(test.status)}</span>
          </div>
          <button type="button" className={INLINE_LINK_BUTTON} onClick={() => onOpen(test)}>
            View
          </button>
        </li>
      ))}
    </ul>
  );
};
