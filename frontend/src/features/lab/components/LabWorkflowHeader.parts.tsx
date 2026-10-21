/** Audit line rendering — shared by card alerts and modal headers. */

import { cn, formatDateTime } from '@/utils';
import { EntityId } from '@/components/display';
import { useUserLookup } from '@/lib/api/users';
import { text, WORKLIST_EMPHASIZED_INLINE, WORKLIST_HEADER } from '@/theme/recipes';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';

export function LabAuditLineView({
  line,
  className,
  compact = false,
  tone = 'card',
}: {
  line: LabAuditLine;
  className?: string;
  compact?: boolean;
  tone?: 'card' | 'modal';
}) {
  const { getUserName } = useUserLookup();
  const base = cn(
    tone === 'modal' ? text({ role: 'label' }) : WORKLIST_HEADER.auditLine,
    className
  );
  const byUserClass = compact ? 'hidden md:inline' : undefined;

  switch (line.type) {
    case 'sample-collected':
      return (
        <span className={base}>
          Sample{' '}
          {typeof line.sampleId === 'number' ? (
            <EntityId type="sample" value={line.sampleId} />
          ) : (
            <EntityId>{line.sampleId}</EntityId>
          )}{' '}
          collected{' '}
          <span className={WORKLIST_EMPHASIZED_INLINE}>
            {formatDateTime(line.collectedAt)}
          </span>
          {line.collectedBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={WORKLIST_EMPHASIZED_INLINE}>
                {getUserName(line.collectedBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'collection-only':
      return (
        <span className={base}>
          Collected{' '}
          <span className={WORKLIST_EMPHASIZED_INLINE}>
            {formatDateTime(line.collectedAt)}
          </span>
          {line.collectedBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={WORKLIST_EMPHASIZED_INLINE}>
                {getUserName(line.collectedBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'recollection-lineage':
      return (
        <span className={base}>
          <span>Recollection of </span>
          <EntityId type="sample" value={line.sampleId} variant="inline" />
          {line.collectedAt ? (
            <>
              <span> — collected on </span>
              <span className={WORKLIST_EMPHASIZED_INLINE}>
                {formatDateTime(line.collectedAt)}
              </span>
            </>
          ) : null}
        </span>
      );
    case 'retest-lineage':
      return (
        <span className={base}>
          <span>Re-test of </span>
          <EntityId type="orderTest" value={line.orderTestId} variant="inline" />
        </span>
      );
    case 'test-recollection-lineage':
      return (
        <span className={base}>
          <span>Recollection of </span>
          <EntityId type="sample" value={line.sampleId} variant="inline" />
        </span>
      );
    case 'result-entered':
      return (
        <span className={base}>
          Results entered{' '}
          <span className={WORKLIST_EMPHASIZED_INLINE}>
            {formatDateTime(line.enteredAt)}
          </span>
          {line.enteredBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={WORKLIST_EMPHASIZED_INLINE}>
                {getUserName(line.enteredBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'custom':
      return <span className={base}>{line.content}</span>;
    default: {
      const _exhaustive: never = line;
      return _exhaustive;
    }
  }
}

export function LabAuditBlock({
  lines,
  className,
  compact = false,
  tone = 'card',
}: {
  lines: LabAuditLine[];
  className?: string;
  compact?: boolean;
  tone?: 'card' | 'modal';
}) {
  if (lines.length === 0) return null;
  return (
    <div className={cn(WORKLIST_HEADER.auditStack, className)}>
      {lines.map((line, index) => (
        <LabAuditLineView
          key={`${line.type}-${index}`}
          line={line}
          compact={compact}
          tone={tone}
        />
      ))}
    </div>
  );
}
