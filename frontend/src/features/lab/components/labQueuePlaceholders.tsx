/**
 * Lab queue card placeholders — shaped skeletons per workflow tab.
 */

import { Card } from '@/components/surfaces';
import { Panel } from '@/components/surfaces';
import { CARD_HEADER_GRID, SPACING, text } from '@/theme/recipes';

export type LabQueuePlaceholderVariant =
  | 'entry'
  | 'validation'
  | 'escalation'
  | 'collection'
  | 'default';

const PLACEHOLDER_LABEL: Record<LabQueuePlaceholderVariant, string> = {
  entry: 'Loading result entry queue',
  validation: 'Loading validation queue',
  escalation: 'Loading escalation queue',
  collection: 'Loading collection queue',
  default: 'Loading queue',
};

function QueueCardHeaderSkeleton() {
  return (
    <div className={CARD_HEADER_GRID.shell} aria-hidden>
      <Panel preset="panel.pageEmbed.visible" loading loadingShape="fields" loadingRows={3} />
      <div className={CARD_HEADER_GRID.badgeColumn}>
        <Panel preset="panel.pageEmbed.visible" loading loadingShape="block" loadingRows={2} />
      </div>
    </div>
  );
}

function EntryQueueCardPlaceholderBody() {
  return (
    <div className={`flex flex-col ${SPACING.gapSection}`}>
      <QueueCardHeaderSkeleton />
      <Panel preset="panel.pageEmbed.visible" title="Parameters" loading loadingShape="list" loadingRows={2} />
    </div>
  );
}

function ValidationQueueCardPlaceholderBody() {
  return (
    <div className={`flex flex-col ${SPACING.gapSection}`}>
      <QueueCardHeaderSkeleton />
      <Panel
        preset="panel.compact.scrollAuto.maxH"
        title="Results"
        loading
        loadingShape="table"
        loadingTableColumns={3}
        loadingTableRows={3}
      />
      <Panel preset="panel.pageEmbed.visible" title="Validation notes" loading loadingShape="fields" loadingRows={2} />
    </div>
  );
}

function EscalationQueueCardPlaceholderBody() {
  return (
    <div className={`flex flex-col ${SPACING.gapSection}`}>
      <QueueCardHeaderSkeleton />
      <p className={text({ role: 'caption' })} aria-hidden>
        &nbsp;
      </p>
      <Panel preset="panel.pageEmbed.visible" loading loadingShape="fields" loadingRows={3} />
    </div>
  );
}

function CollectionQueueCardPlaceholderBody() {
  return (
    <div className={`flex flex-col ${SPACING.gapSection}`}>
      <QueueCardHeaderSkeleton />
      <Panel preset="panel.pageEmbed.visible" title="Tests" loading loadingShape="list" loadingRows={3} />
    </div>
  );
}

function DefaultQueueCardPlaceholderBody() {
  return <Panel preset="panel.pageEmbed.visible" loading loadingShape="block" loadingRows={4} />;
}

function placeholderBody(variant: LabQueuePlaceholderVariant) {
  switch (variant) {
    case 'entry':
      return <EntryQueueCardPlaceholderBody />;
    case 'validation':
      return <ValidationQueueCardPlaceholderBody />;
    case 'escalation':
      return <EscalationQueueCardPlaceholderBody />;
    case 'collection':
      return <CollectionQueueCardPlaceholderBody />;
    default:
      return <DefaultQueueCardPlaceholderBody />;
  }
}

export function LabQueueCardPlaceholder({
  variant = 'default',
}: {
  variant?: LabQueuePlaceholderVariant;
}) {
  return (
    <div aria-busy="true" aria-label={PLACEHOLDER_LABEL[variant]}>
      <Card
        padding="md"
        className="min-h-[140px]"
        loading
        loadingContent={placeholderBody(variant)}
      />
    </div>
  );
}
