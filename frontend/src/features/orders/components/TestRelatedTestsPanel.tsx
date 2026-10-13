/**
 * Related order tests — same sample tube and same test code (retest rows).
 */

import React, { useMemo } from 'react';
import { Panel } from '@/components';
import type { Order, OrderTest } from '@/types';
import { TYPE } from '@/components/theme/recipes';
import {
  getRelatedOrderTestEntries,
  getSiblingOrderTestsOnSample,
} from '../utils/orderTestRelations';
import { LinkedOrderTestsList } from './LinkedOrderTestsList';

export type TestRelatedTestsPanelProps = {
  order: Order;
  orderTest: OrderTest;
  onOpenOrderTest: (test: OrderTest) => void;
};

export const TestRelatedTestsPanel: React.FC<TestRelatedTestsPanelProps> = ({
  order,
  orderTest,
  onOpenOrderTest,
}) => {
  const onSample = useMemo(
    () => getSiblingOrderTestsOnSample(order, orderTest),
    [order, orderTest]
  );
  const sameTestEntries = useMemo(
    () => getRelatedOrderTestEntries(order, orderTest),
    [order, orderTest]
  );

  if (onSample.length === 0 && sameTestEntries.length === 0) {
    return null;
  }

  return (
    <Panel variant="lab" title="Related tests" className="w-full">
      <div className="space-y-space-3">
        {onSample.length > 0 ? (
          <div className="space-y-space-0-5">
            <p className={`${TYPE.sectionTitle} leading-tight`}>On same sample</p>
            <LinkedOrderTestsList tests={onSample} onOpen={onOpenOrderTest} />
          </div>
        ) : null}
        {sameTestEntries.length > 0 ? (
          <div className="space-y-space-0-5">
            <p className={`${TYPE.sectionTitle} leading-tight`}>Other entries for this test</p>
            <LinkedOrderTestsList tests={sameTestEntries} onOpen={onOpenOrderTest} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
};
