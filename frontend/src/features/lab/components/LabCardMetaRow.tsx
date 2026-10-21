/**
 * Plain-text metadata row for lab cards (queue age, volumes, lineage — not enums).
 */

import React, { type ReactNode } from 'react';
import { cn } from '@/utils';
import { EntityId } from '@/components/display';
import { QUEUE_CARD_TYPE, MODAL_HEADER_TYPE } from '@/theme/recipes';
import { getQueueAgeInfo } from '../utils/labQueue';
import { TONE } from '@/theme/recipes';
import type { Sample, TestWithContext } from '@/types';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { LAB_CONFIG } from '../constants';
import { displayId } from '@/utils';

function collectNodes(children: ReactNode): ReactNode[] {
  return React.Children.toArray(children).filter(child => child != null && child !== '');
}

export function LabCardMetaRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const items = collectNodes(children);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        QUEUE_CARD_TYPE.metadata,
        'flex min-w-0 flex-wrap items-center gap-x-space-2 gap-y-space-0-5 leading-snug',
        className
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <span className={QUEUE_CARD_TYPE.separator} aria-hidden>•</span>
          ) : null}
          <span className="min-w-0">{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function QueueAgeMeta({ since }: { since?: string | null }) {
  const info = getQueueAgeInfo(since);
  if (!info) return null;
  const tone =
    info.variant === 'danger'
      ? TONE.danger.fg
      : info.variant === 'warning'
        ? TONE.warning.fg
        : 'text-text-secondary';
  return <span className={tone}>{info.label}</span>;
}

/** Queue cards — only show waiting time when it is elevated (warning/danger). */
export function QueueAgeAlert({ since }: { since?: string | null }) {
  const info = getQueueAgeInfo(since);
  if (!info || info.variant === 'default') return null;
  return <QueueAgeMeta since={since} />;
}

export function LabModalMetaRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const items = collectNodes(children);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        MODAL_HEADER_TYPE.meta,
        'flex min-w-0 flex-wrap items-center gap-x-space-2 gap-y-space-0-5 leading-snug',
        className
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <span className={QUEUE_CARD_TYPE.separator} aria-hidden>•</span>
          ) : null}
          <span className="min-w-0">{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function TestRejectionTailMeta({ test }: { test: TestWithContext }) {
  const ctx = deriveRetestContext(test);

  if (ctx.showRetestBadge && test.retestOfTestId != null) {
    return (
      <LabCardMetaRow>
        <span>
          Re-test of <EntityId type="orderTest" value={test.retestOfTestId} variant="inline" />
        </span>
        {ctx.showAttemptInMeta ? (
          <span className={ctx.attemptNumber >= ctx.attemptMax - 1 ? TONE.warning.fg : undefined}>
            Attempt {ctx.attemptNumber}/{ctx.attemptMax}
          </span>
        ) : null}
      </LabCardMetaRow>
    );
  }
  if (ctx.showRecollectionLink && test.sampleOriginalSampleId != null) {
    return (
      <LabCardMetaRow>
        <span>
          Recollection of{' '}
          <EntityId type="sample" value={test.sampleOriginalSampleId} variant="inline" />
        </span>
        {ctx.showAttemptInMeta ? (
          <span className={ctx.attemptNumber >= ctx.attemptMax - 1 ? TONE.warning.fg : undefined}>
            Attempt {ctx.attemptNumber}/{ctx.attemptMax}
          </span>
        ) : null}
      </LabCardMetaRow>
    );
  }
  if (ctx.showAttemptInMeta) {
    const typeLabel = ctx.attemptType === 'retest' ? 'Re-test' : 'Recollection';
    return (
      <LabCardMetaRow>
        <span className={ctx.attemptNumber >= ctx.attemptMax - 1 ? TONE.warning.fg : undefined}>
          {typeLabel} attempt {ctx.attemptNumber}/{ctx.attemptMax}
        </span>
      </LabCardMetaRow>
    );
  }
  return null;
}

export function SampleRejectionTailMeta({
  sample,
  showAttempt = true,
}: {
  sample: Sample;
  showAttempt?: boolean;
}) {
  if (!sample.isRecollection || sample.originalSampleId == null) return null;
  const attempt = sample.recollectionAttempt ?? 1;
  const max = LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;

  return (
    <LabCardMetaRow>
      <span>
        Recollection of{' '}
        <EntityId type="sample" value={sample.originalSampleId} variant="inline" />
      </span>
      {showAttempt && attempt > 1 ? (
        <span className={attempt >= max - 1 ? TONE.warning.fg : undefined}>
          Attempt {attempt}/{max}
        </span>
      ) : null}
    </LabCardMetaRow>
  );
}

export function RecollectionRequestedMeta({
  recollectionSampleId,
}: {
  recollectionSampleId?: number | null;
}) {
  if (recollectionSampleId == null) return null;
  return (
    <span>
      Recollection requested:{' '}
      <EntityId type="sample" value={recollectionSampleId} variant="inline" />
    </span>
  );
}

export function BarcodeMeta({ sampleId }: { sampleId: number }) {
  return <span className="font-mono text-text-secondary">{displayId.sample(sampleId)}</span>;
}
