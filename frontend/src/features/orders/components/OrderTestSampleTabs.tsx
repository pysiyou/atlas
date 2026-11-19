/**
 * Sample section for order test detail modal — tabbed when multiple related samples.
 * Uses lab workflow Panel with fields inline (no nested section panels).
 */

import { useMemo, useState } from 'react';
import { Panel } from '@/components/surfaces';
import { useUserLookup } from '@/lib/api';
import { OrderTestDescriptionItemGrid } from '../utils/OrderTestDescriptionColumns';
import { splitDescriptionItemsIntoTwoColumns } from '../utils/orderTestDescriptionLayout';
import type { Sample, OrderableTest } from '@/types';
import { buildSampleCollectionDescriptionItems } from '@/utils/presentation';
import { SegmentedControl } from '@/components/inputs/SegmentedControl';
import { text, INLINE_LINK_BUTTON } from '@/theme/recipes';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { displayId } from '@/utils';
import { usePanelCopy } from '@/strings';

export interface OrderTestSampleTabsProps {
  samples: Sample[];
  linkedSampleId?: string;
  catalogTest?: OrderableTest;
  onViewFullSample: (sampleId: string) => void;
}

function sampleTabLabel(sample: Sample, linkedSampleId?: string): string {
  const id = displayId.sample(sample.sampleId);
  if (linkedSampleId != null && sample.sampleId === linkedSampleId) {
    return `${id} (linked)`;
  }
  if (sample.isRecollection) {
    return `${id} (recollect)`;
  }
  return id;
}

function CatalogSampleRequirements({ catalogTest }: { catalogTest: OrderableTest }) {
  return (
    <div className={`${text({ role: 'body', intent: 'muted' })} space-y-space-2`}>
      <p>Expected sample type: {formatStatusBadgeLabel(catalogTest.sampleType)}</p>
      {catalogTest.sampleVolume ? <p>Volume: {catalogTest.sampleVolume}</p> : null}
      {catalogTest.minVolumeMl != null ? (
        <p>Min volume: {catalogTest.minVolumeMl} mL</p>
      ) : null}
      {catalogTest.optimalVolumeMl != null ? (
        <p>Optimal volume: {catalogTest.optimalVolumeMl} mL</p>
      ) : null}
      {catalogTest.fastingRequired ? <p>Fasting required</p> : null}
      {catalogTest.collectionNotes ? <p>{catalogTest.collectionNotes}</p> : null}
    </div>
  );
}

export function OrderTestSampleTabs({
  samples,
  linkedSampleId,
  catalogTest,
  onViewFullSample,
}: OrderTestSampleTabsProps) {
  const { getUserName } = useUserLookup();
  const panels = usePanelCopy();
  const tabs = useMemo(
    () =>
      samples.map(s => ({
        id: String(s.sampleId),
        label: sampleTabLabel(s, linkedSampleId),
        sample: s,
      })),
    [samples, linkedSampleId]
  );

  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id ?? '');
  const resolvedActiveTabId = useMemo(() => {
    if (tabs.length === 0) return '';
    if (tabs.some(t => t.id === activeTabId)) return activeTabId;
    return tabs[0].id;
  }, [tabs, activeTabId]);

  const segmentTabs = useMemo(
    () => tabs.map(t => ({ id: t.id, label: t.label })),
    [tabs]
  );

  const headerEnd =
    samples.length > 1
      ? (
          <SegmentedControl
            layout="scroll"
            options={segmentTabs}
            activeId={resolvedActiveTabId}
            onActiveIdChange={setActiveTabId}
          />
        )
      : undefined;

  if (samples.length === 0) {
    return (
      <Panel preset="panel.compact.standard" title={panels.orders.collectionRequirements}>
        <p className={text({ role: 'label' })}>No sample is linked to this test yet.</p>
        {catalogTest ? <CatalogSampleRequirements catalogTest={catalogTest} /> : null}
      </Panel>
    );
  }

  const activeSample =
    tabs.find(t => t.id === resolvedActiveTabId)?.sample ?? samples[0];

  return (
    <Panel preset="panel.compact.standard" title={panels.orders.collectionRequirements} headerEnd={headerEnd}>
      <OrderTestDescriptionItemGrid
        columns={splitDescriptionItemsIntoTwoColumns(
          buildSampleCollectionDescriptionItems(activeSample)
        )}
        resolveUserDisplay={getUserName}
      />
      <button
        type="button"
        onClick={() => onViewFullSample(activeSample.sampleId)}
        className={`${INLINE_LINK_BUTTON} mt-space-1`}
      >
        View full sample
      </button>
    </Panel>
  );
}
