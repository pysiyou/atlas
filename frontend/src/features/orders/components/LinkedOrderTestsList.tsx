/**
 * Plain-text list of order tests with navigation to order test detail.
 */

import React from 'react';
import { EntityId } from '@/components/display';
import type { OrderTest } from '@/types';
import { displayId } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { INLINE_LINK, TYPE } from '@/components/theme/recipes';

export type LinkedOrderTestsListProps = {
  tests: OrderTest[];
  onOpen: (test: OrderTest) => void;
};

export const LinkedOrderTestsList: React.FC<LinkedOrderTestsListProps> = ({ tests, onOpen }) => {
  if (tests.length === 0) return null;

  return (
    <ul className={`space-y-space-0-5 leading-snug ${TYPE.value}`}>
      {tests.map(test => (
        <li
          key={test.id ?? `${test.testCode}-${test.createdAt}`}
          className="flex flex-wrap items-center justify-between gap-x-space-2 min-h-0"
        >
          <div className="min-w-0 flex flex-wrap items-baseline gap-x-space-2 gap-y-0">
            <span className="font-medium text-text-primary">{test.testName}</span>
            <EntityId variant="inline">{test.testCode}</EntityId>
            {test.id != null ? (
              <span className={TYPE.meta}>{displayId.orderTest(test.id)}</span>
            ) : null}
            <span className={TYPE.meta}>{formatStatusBadgeLabel(test.status)}</span>
          </div>
          <button type="button" className={`shrink-0 ${INLINE_LINK}`} onClick={() => onOpen(test)}>
            View
          </button>
        </li>
      ))}
    </ul>
  );
};
