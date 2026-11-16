/**
 * Related tests (same sample / same test code) and samples (recollection chain) in lab modals.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '@/components/surfaces';
import { sampleAPI } from '../api/samples';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useOrder, getSampleRecollectionChain, TestRelatedTestsPanel } from '@/features/orders';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { Order, OrderTest, Sample } from '@/types';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { text, INLINE_LINK_BUTTON } from '@/theme/recipes';
import { usePanelCopy } from '@/strings';

type LabRelatedTestsPanelProps = {
  orderId: number;
  orderTestId: number;
  isOpen: boolean;
  /** When the parent modal already loaded the order, skip a duplicate fetch. */
  order?: Order;
};

export function LabRelatedTestsPanel({
  orderId,
  orderTestId,
  isOpen,
  order: orderProp,
}: LabRelatedTestsPanelProps) {
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
}

type LabRelatedSamplesPanelProps = {
  sample: Sample;
  isOpen: boolean;
  onOpenSample: (sampleId: number) => void;
};

export function LabRelatedSamplesPanel({
  sample,
  isOpen,
  onOpenSample,
}: LabRelatedSamplesPanelProps) {
  const panels = usePanelCopy();
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
  const aliquots = orderSamples.filter(
    s => s.isAliquot && (s.parentSampleId === sample.sampleId || s.sampleId === sample.parentSampleId)
  );
  const aliquotOthers = aliquots.filter(s => s.sampleId !== sample.sampleId);

  if (others.length === 0 && aliquotOthers.length === 0) {
    return null;
  }

  return (
    <>
      {others.length > 0 ? (
        <Panel preset="panel.compact.fullWidth" title={panels.shared.relatedSamples}>
          <ul className={`space-y-space-2 ${text({ role: 'body' })}`}>
            {others.map(s => (
              <li
                key={s.sampleId}
                className="flex flex-wrap items-baseline justify-between gap-x-space-3 gap-y-space-1"
              >
                <div className="flex flex-wrap items-baseline gap-x-space-2">
                  <span className="font-medium">{s.accessionNumber}</span>
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
      ) : null}
      {aliquotOthers.length > 0 ? (
        <Panel preset="panel.compact.fullWidth" title="Aliquots">
          <ul className={`space-y-space-2 ${text({ role: 'body' })}`}>
            {aliquotOthers.map(s => (
              <li
                key={s.sampleId}
                className="flex flex-wrap items-baseline justify-between gap-x-space-3 gap-y-space-1"
              >
                <div className="flex flex-wrap items-baseline gap-x-space-2">
                  <span className="font-medium">{s.accessionNumber}</span>
                  <span className={text({ role: 'body', intent: 'muted' })}>
                    Aliquot {s.aliquotIndex ?? ''}
                  </span>
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
      ) : null}
    </>
  );
}
