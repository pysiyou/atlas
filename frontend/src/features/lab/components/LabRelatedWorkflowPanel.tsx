/**
 * Related tests (same sample / same test code) and samples (recollection chain) in lab modals.
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '@/components/surfaces';
import { sampleAPI } from '../api/samples';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useOrder, getSampleRecollectionChain, TestRelatedTestsPanel } from '@/features/orders';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { Order, OrderTest, Sample } from '@/types';
import { displayId } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { text, INLINE_LINK_BUTTON } from '@/theme/recipes';

type LabRelatedTestsPanelProps = {
  orderId: number;
  orderTestId: number;
  isOpen: boolean;
  /** When the parent modal already loaded the order, skip a duplicate fetch. */
  order?: Order;
};

export const LabRelatedTestsPanel: React.FC<LabRelatedTestsPanelProps> = ({
  orderId,
  orderTestId,
  isOpen,
  order: orderProp,
}) => {
  const { openModal } = useModal();
  const shouldFetchOrder = isOpen && orderId > 0 && orderProp?.orderId !== orderId;
  const { order: fetchedOrder } = useOrder(shouldFetchOrder ? String(orderId) : undefined);
  const order = orderProp?.orderId === orderId ? orderProp : fetchedOrder;

  const orderTest = useMemo(
    () => (order?.tests ? order.tests.find(t => t.id === orderTestId) : undefined),
    [order, orderTestId]
  );

  const openOrderTest = (row: OrderTest) => {
    if (!order || row.id == null) return;
    openModal({
      type: ModalType.TEST_DETAIL,
      orderTestId: row.id,
      interaction: 'view',
    });
  };

  if (!order || !orderTest) {
    return null;
  }

  return (
    <TestRelatedTestsPanel order={order} orderTest={orderTest} onOpenOrderTest={openOrderTest} />
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
    <Panel preset="panel.compact.fullWidth" title="Related samples">
      <ul className={`space-y-space-2 ${text({ role: 'body' })}`}>
        {others.map(s => (
          <li
            key={s.sampleId}
            className="flex flex-wrap items-baseline justify-between gap-x-space-3 gap-y-space-1"
          >
            <div className="flex flex-wrap items-baseline gap-x-space-2">
              <span className="font-medium">{displayId.sample(s.sampleId)}</span>
              <span className={text({ role: 'body', intent: 'muted' })}>{formatStatusBadgeLabel(s.status)}</span>
              {s.isRecollection ? <span className={text({ role: 'body', intent: 'muted' })}>Recollection</span> : null}
            </div>
            <button
              type="button"
              className={INLINE_LINK_BUTTON}
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
