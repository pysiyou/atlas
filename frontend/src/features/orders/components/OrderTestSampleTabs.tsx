/**
 * Sample section for order test detail modal — tabbed when multiple related samples.
 * Uses lab workflow Panel with fields inline (no nested section panels).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from '@/components';
import type { DetailFieldConfig } from '@/components/display/DetailFieldGroup';
import { useUserLookup } from '@/lib/api/users';
import {
  OrderTestDetailFieldGrid,
  splitDetailFieldsIntoTwoColumns,
} from '../utils/orderTestDetailFieldColumns';
import {
  CONTAINER_COLOR_OPTIONS,
  CONTAINER_CONFIG,
  type ContainerType,
  type Sample,
  type Test,
} from '@/types';
import { formatVolume } from '@/features/lab/utils';
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

function buildSampleFields(sample: Sample): DetailFieldConfig[] {
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const hasCollection = (isCollected || isRejected) && 'collectedAt' in sample;

  const collectedVolume =
    hasCollection && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const remainingVolume =
    hasCollection && 'remainingVolume' in sample ? sample.remainingVolume : undefined;
  const containerColor =
    hasCollection && 'actualContainerColor' in sample ? sample.actualContainerColor : undefined;
  const containerType =
    hasCollection && 'actualContainerType' in sample
      ? sample.actualContainerType
      : sample.requiredContainerTypes?.[0];
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label ?? 'N/A'
    : undefined;

  const fields: DetailFieldConfig[] = [
    { label: 'Status', value: formatStatusBadgeLabel(sample.status) },
    { label: 'Type', value: formatStatusBadgeLabel(sample.sampleType) },
    {
      label: 'Priority',
      value: sample.priority ? formatStatusBadgeLabel(sample.priority) : undefined,
    },
    { label: 'Required', value: formatVolume(sample.requiredVolume) },
  ];

  if (isPending && sample.requiredContainerTypes?.length) {
    fields.push({
      label: 'Containers',
      value: sample.requiredContainerTypes
        .map(t => CONTAINER_CONFIG[t]?.label ?? t)
        .join(', '),
    });
  }

  if (hasCollection) {
    fields.push(
      { label: 'Collected', timestamp: sample.collectedAt, user: sample.collectedBy },
      {
        label: 'Vol. collected',
        value: collectedVolume !== undefined ? formatVolume(collectedVolume) : undefined,
      },
      {
        label: 'Remaining',
        value: remainingVolume !== undefined ? formatVolume(remainingVolume) : undefined,
      }
    );
    if (containerType) {
      const containerLabel =
        CONTAINER_CONFIG[containerType as ContainerType]?.label ?? containerType;
      const containerText =
        containerColor && colorName
          ? `${containerLabel} · ${colorName} top`
          : containerLabel;
      fields.push({ label: 'Container', value: containerText });
    }
  }

  if (sample.isRecollection) {
    fields.push(
      { label: 'Recollect #', value: String(sample.recollectionAttempt ?? '—') },
      {
        label: 'Original',
        value:
          sample.originalSampleId != null
            ? displayId.sample(sample.originalSampleId)
            : undefined,
      },
      { label: 'Reason', value: sample.recollectionReason }
    );
  }

  return fields;
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
  useEffect(() => {
    if (tabs.length === 0) {
      setActiveTabId('');
      return;
    }
    if (!tabs.some(t => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
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
            activeId={activeTabId}
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

  const activeSample = tabs.find(t => t.id === activeTabId)?.sample ?? samples[0];

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
