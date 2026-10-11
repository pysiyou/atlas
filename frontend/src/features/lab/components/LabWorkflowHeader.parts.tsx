/** Audit line rendering — shared by card alerts and modal headers. */

import { cn, formatDateTime } from '@/utils';
import { EntityId } from '@/components';
import { useUserLookup } from '@/lib/api/users';
import { LAB_CARD_TYPOGRAPHY, LAB_HEADER, LAB_MODAL_TYPOGRAPHY } from '../utils/labStyles';
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
    tone === 'modal' ? LAB_MODAL_TYPOGRAPHY.auditLine : LAB_HEADER.auditLine,
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
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.collectedAt)}
          </span>
          {line.collectedBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
                {getUserName(line.collectedBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'collection-only':
      return (
        <span className={base}>
          collected{' '}
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.collectedAt)}
          </span>
          {line.collectedBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
                {getUserName(line.collectedBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'previous-sample-rejected':
      return (
        <span className={cn(base, compact && tone === 'card' && 'hidden md:inline')}>
          Previous sample <span className="text-warning-fg font-normal">rejected</span>
          {' — '}
          <EntityId type="sample" value={line.sampleId} /> collected{' '}
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.collectedAt)}
          </span>
        </span>
      );
    case 'result-entered':
      return (
        <span className={base}>
          Results entered{' '}
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.enteredAt)}
          </span>
          {line.enteredBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
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
    <div className={cn(LAB_HEADER.auditStack, className)}>
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
