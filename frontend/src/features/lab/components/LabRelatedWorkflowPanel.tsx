/**
 * Related tests (same sample / same test code) and samples (recollection chain) in lab modals.
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '@/components';
import { sampleAPI } from '../api/samples';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useOrder } from '@/features/orders/api/orders';
import { LinkedOrderTestsList } from '@/features/orders/components/LinkedOrderTestsList';
import {
  getRelatedOrderTestEntries,
  getSampleRecollectionChain,
  getSiblingOrderTestsOnSample,
} from '@/features/orders/utils/orderTestRelations';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { OrderTest, Sample } from '@/types';
import type { TestWithContext } from '@/types';
import { displayId } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { INLINE_LINK, TYPE } from '@/components/theme/recipes';

type LabRelatedTestsPanelProps = {
  test: TestWithContext;
  isOpen: boolean;
};

export const LabRelatedTestsPanel: React.FC<LabRelatedTestsPanelProps> = ({ test, isOpen }) => {
  const { openModal } = useModal();
  const { order } = useOrder(isOpen && test.orderId > 0 ? String(test.orderId) : undefined);

  const currentRow = useMemo(
    (): Pick<OrderTest, 'id' | 'sampleId' | 'testCode'> => ({
      id: test.id,
      sampleId: test.sampleId,
      testCode: test.testCode,
    }),
    [test.id, test.sampleId, test.testCode]
  );

  const onSample = useMemo(
    () => (order ? getSiblingOrderTestsOnSample(order, currentRow) : []),
    [order, currentRow]
  );
  const sameTestEntries = useMemo(
    () => (order ? getRelatedOrderTestEntries(order, currentRow) : []),
    [order, currentRow]
  );

  const openOrderTest = (orderTest: OrderTest) => {
    if (!order) return;
    openModal(ModalType.ORDER_TEST_DETAIL, { order, orderTest, patient: null });
  };

  if (!order || (onSample.length === 0 && sameTestEntries.length === 0)) {
    return null;
  }

  return (
    <Panel variant="lab" title="Related tests" className="w-full">
      <div className="space-y-space-4">
        {onSample.length > 0 ? (
          <div className="space-y-space-2">
            <p className={TYPE.sectionTitle}>On same sample</p>
            <LinkedOrderTestsList tests={onSample} onOpen={openOrderTest} />
          </div>
        ) : null}
        {sameTestEntries.length > 0 ? (
          <div className="space-y-space-2">
            <p className={TYPE.sectionTitle}>Other entries for this test</p>
            <LinkedOrderTestsList tests={sameTestEntries} onOpen={openOrderTest} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
};

type LabRelatedSamplesPanelProps = {
  sample: Sample;
  isOpen: boolean;
  onOpenSample: (sampleId: number) => void;
};

export const LabRelatedSamplesPanel: React.FC<LabRelatedSamplesPanelProps> = ({
  sample,
  isOpen,
  onOpenSample,
}) => {
  const { data: orderSamples = [] } = useQuery({
    queryKey: queryKeys.samples.byOrder(String(sample.orderId)),
    queryFn: () => sampleAPI.getAll({ orderId: String(sample.orderId) }),
    enabled: isOpen && sample.orderId > 0,
    ...cacheConfig.dynamic,
  });

  const related = useMemo(
    () => getSampleRecollectionChain(sample.sampleId, orderSamples),
    [sample.sampleId, orderSamples]
  );

  const others = related.filter(s => s.sampleId !== sample.sampleId);
  if (others.length === 0) {
    return null;
  }

  return (
    <Panel variant="lab" title="Related samples" className="w-full">
      <ul className={`space-y-space-2 ${TYPE.value}`}>
        {others.map(s => (
          <li
            key={s.sampleId}
            className="flex flex-wrap items-baseline justify-between gap-x-space-3 gap-y-space-1"
          >
            <div className="flex flex-wrap items-baseline gap-x-space-2">
              <span className="font-medium">{displayId.sample(s.sampleId)}</span>
              <span className={TYPE.meta}>{formatStatusBadgeLabel(s.status)}</span>
              {s.isRecollection ? <span className={TYPE.meta}>Recollection</span> : null}
            </div>
            <button
              type="button"
              className={INLINE_LINK}
              onClick={() => onOpenSample(s.sampleId)}
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
};
