import { EscalationCard, ResultValidationCard } from '../workflow';
import { LabValidationQueueSection } from '../components/LabValidationQueueSection';
import { EmptyState, getEmptyCopy, PANEL_EMPTY_STATE } from '@/components/display';
import type { PendingEscalationItem } from '../api/results';
import type { ValidationQueueRow } from '../types/queues';
import type { QualityIssueResult } from '@/types/lab-operations';

interface ResultValidationQueueViewProps {
  isEmpty: boolean;
  hasEscalated: boolean;
  hasValidation: boolean;
  canResolveEscalation: boolean;
  isMobile: boolean;
  escalations: PendingEscalationItem[];
  validationRows: ValidationQueueRow[];
  comments: Record<string, string>;
  pendingValidateKey: string | null;
  isValidatePending: boolean;
  getCommentKey: (row: ValidationQueueRow) => string;
  onOpenEscalation: (item: PendingEscalationItem) => void;
  onCommentsChange: (key: string, value: string) => void;
  onApprove: (orderTestId: number, orderId: number) => void;
  onReject: (row: ValidationQueueRow, result: QualityIssueResult) => void;
  onOpenValidation: (row: ValidationQueueRow) => void;
}

export function ResultValidationQueueView({
  isEmpty,
  hasEscalated,
  hasValidation,
  canResolveEscalation,
  isMobile,
  escalations,
  validationRows,
  comments,
  pendingValidateKey,
  isValidatePending,
  getCommentKey,
  onOpenEscalation,
  onCommentsChange,
  onApprove,
  onReject,
  onOpenValidation,
}: ResultValidationQueueViewProps) {
  if (isEmpty) {
    return (
      <EmptyState
        {...PANEL_EMPTY_STATE}
        title={getEmptyCopy().pendingValidation.title}
        description={getEmptyCopy().pendingValidation.description}
      />
    );
  }

  return (
    <div className="space-y-space-8">
      {hasEscalated && (
        <LabValidationQueueSection
          title={
            canResolveEscalation ? 'Supervisor exceptions' : 'Awaiting supervisor approval'
          }
          count={escalations.length}
        >
          {escalations.map((item, idx) => (
            <EscalationCard
              key={`escalated-${item.id}-${idx}`}
              item={item}
              onClick={() => onOpenEscalation(item)}
              isMobile={isMobile}
            />
          ))}
        </LabValidationQueueSection>
      )}

      {hasValidation && (
        <LabValidationQueueSection title="Pending validation" count={validationRows.length}>
          {validationRows.map((row, idx) => {
            const commentKey = getCommentKey(row);
            return (
              <ResultValidationCard
                key={`validation-${row.orderTestId}-${idx}`}
                row={row}
                commentKey={commentKey}
                comments={comments[commentKey] ?? ''}
                onCommentsChange={onCommentsChange}
                onApprove={() => onApprove(row.orderTestId, row.orderId)}
                onReject={result => onReject(row, result)}
                onClick={() => onOpenValidation(row)}
                isApproving={pendingValidateKey === commentKey && isValidatePending}
                isMobile={isMobile}
              />
            );
          })}
        </LabValidationQueueSection>
      )}
    </div>
  );
}
