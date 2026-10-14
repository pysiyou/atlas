/**
 * Sample section for order test detail modal — tabbed when multiple related samples.
 * Uses lab workflow Panel with fields inline (no nested section panels).
 */

import React, { useMemo, useState } from 'react';
import { Panel } from '@/components/surfaces';
import { useUserLookup } from '@/lib/api/users';
import { OrderTestDetailFieldGrid } from '../utils/orderTestDetailFieldColumns';
import { splitDetailFieldsIntoTwoColumns } from '../utils/orderTestDetailFieldLayout';
import type { Sample, Test } from '@/types';
import { buildSampleFields } from '../utils/buildSampleFields';
import { PanelHeaderSegmentTabs } from '@/components/display/PanelHeaderSegmentTabs';
import { INLINE_LINK, TYPE } from '@/components/theme/recipes';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { displayId } from '@/utils';

export interface OrderTestSampleTabsProps {
  samples: Sample[];
  linkedSampleId?: number;
  catalogTest?: Test;
  onViewFullSample: (sampleId: number) => void;
}

function sampleTabLabel(sample: Sample, linkedSampleId?: number): string {
  const id = displayId.sample(sample.sampleId);
  if (linkedSampleId != null && sample.sampleId === linkedSampleId) {
    return `${id} (linked)`;
  }
  if (sample.isRecollection) {
    return `${id} (recollect)`;
  }
  return id;
}

function CatalogSampleRequirements({ catalogTest }: { catalogTest: Test }) {
  return (
    <div className={`${TYPE.meta} space-y-space-2`}>
      <p>Expected sample type: {formatStatusBadgeLabel(catalogTest.sampleType)}</p>
      {catalogTest.sampleVolume ? <p>Volume: {catalogTest.sampleVolume}</p> : null}
      {catalogTest.fastingRequired ? <p>Fasting required</p> : null}
      {catalogTest.collectionNotes ? <p>{catalogTest.collectionNotes}</p> : null}
    </div>
  );
}

export const OrderTestSampleTabs: React.FC<OrderTestSampleTabsProps> = ({
  samples,
  linkedSampleId,
  catalogTest,
  onViewFullSample,
}) => {
  const { getUserName } = useUserLookup();
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
          <PanelHeaderSegmentTabs
            tabs={segmentTabs}
            activeId={resolvedActiveTabId}
            onTabChange={setActiveTabId}
          />
        )
      : undefined;

  if (samples.length === 0) {
    return (
      <Panel variant="lab" title="Collection Requirements & Instructions">
        <p className={TYPE.label}>No sample is linked to this test yet.</p>
        {catalogTest ? <CatalogSampleRequirements catalogTest={catalogTest} /> : null}
      </Panel>
    );
  }

  const activeSample =
    tabs.find(t => t.id === resolvedActiveTabId)?.sample ?? samples[0];

  return (
    <Panel variant="lab" title="Collection Requirements & Instructions" headerEnd={headerEnd}>
      <OrderTestDetailFieldGrid
        columns={splitDetailFieldsIntoTwoColumns(buildSampleFields(activeSample))}
        resolveUserDisplay={getUserName}
      />
      <button
        type="button"
        onClick={() => onViewFullSample(activeSample.sampleId)}
        className={`${INLINE_LINK} mt-space-1`}
      >
        View full sample
      </button>
    </Panel>
  );
};
