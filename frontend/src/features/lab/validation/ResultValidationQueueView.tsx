import type { ValidationQueueRow } from '../types/queues';
import type { QualityIssueResult } from '@/types';
import { LabValidationQueueSection } from '../components/LabValidationQueueSection';
import { ResultValidationCard } from '../workflow';
import { EmptyState } from '@/components/display';
import { getEmptyCopy, PANEL_EMPTY_STATE, useLabCopy } from '@/strings';

interface ResultValidationQueueViewProps {
  isEmpty: boolean;
  hasValidation: boolean;
  isMobile: boolean;
  validationRows: ValidationQueueRow[];
  comments: Record<string, string>;
  pendingValidateKey: string | null;
  isValidatePending: boolean;
  getCommentKey: (row: ValidationQueueRow) => string;
  onCommentsChange: (key: string, value: string) => void;
  onApprove: (orderTestId: number, orderId: string, criticalSeen?: boolean) => void;
  onReject: (row: ValidationQueueRow, result: QualityIssueResult) => void;
  onOpenValidation: (row: ValidationQueueRow) => void;
}

export function ResultValidationQueueView({
  isEmpty,
  hasValidation,
  isMobile,
  validationRows,
  comments,
  pendingValidateKey,
  isValidatePending,
  getCommentKey,
  onCommentsChange,
  onApprove,
  onReject,
  onOpenValidation,
}: ResultValidationQueueViewProps) {
  const labCopy = useLabCopy();
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
      {hasValidation && (
        <LabValidationQueueSection title={labCopy.panels.pendingValidation} count={validationRows.length}>
          {validationRows.map((row, idx) => {
            const commentKey = getCommentKey(row);
            return (
              <ResultValidationCard
                key={`validation-${row.orderTestId}-${idx}`}
                row={row}
                commentKey={commentKey}
                comments={comments[commentKey] ?? ''}
                onCommentsChange={onCommentsChange}
                onApprove={criticalSeen => onApprove(row.orderTestId, row.orderId, criticalSeen)}
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
