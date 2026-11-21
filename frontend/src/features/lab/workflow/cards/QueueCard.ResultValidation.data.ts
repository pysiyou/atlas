import { useMemo, useState } from 'react';
import { useUserLookup } from '@/lib/api';
import { useLabWorkflowCardClickGuard } from '../../hooks';
import { isLabActionAllowed } from '../../utils/queueDisplay';
import { useAuthStore } from '@/app/authStore';
import { canReleaseResults } from '../../pages/laboratoryPageAccess';
import { useSampleRejectionDisplay } from '../../hooks/useSampleRejectionDisplay';
import type { ValidationQueueRow } from '../../types/queues';
import {
  labModalWorkItemFromDto,
  retestContextFromRow,
  type LabOrderTestQueueRow,
} from '../../types/labQueueChrome';
import type { QualityIssueResult } from '@/types';

export interface ResultValidationCardProps {
  row: ValidationQueueRow;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: (criticalSeen?: boolean) => void;
  onReject: (result: QualityIssueResult) => void;
  onClick: () => void;
  isApproving?: boolean;
  isMobile?: boolean;
}

export interface ResultValidationCardSharedData {
  row: ValidationQueueRow;
  chromeRow: LabOrderTestQueueRow;
  patientName: string;
  onApprove: (criticalSeen?: boolean) => void;
  onReject: ResultValidationCardProps['onReject'];
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejection: ReturnType<typeof useSampleRejectionDisplay>;
  rejection: ReturnType<typeof retestContextFromRow>;
  canValidate: boolean;
  canReject: boolean;
  hasCriticalValues: boolean;
  criticalSeen: boolean;
  setCriticalSeen: (checked: boolean) => void;
}

export function useResultValidationCardData(
  props: ResultValidationCardProps
): ResultValidationCardSharedData | null {
  const { row, onApprove, onReject, onClick, isApproving = false } = props;
  const { getUserName } = useUserLookup();
  const { hasRole } = useAuthStore();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const chromeRow = useMemo(() => labModalWorkItemFromDto(row), [row]);
  const canValidate =
    canReleaseResults(hasRole) && isLabActionAllowed(row.allowedActions, 'validate');
  const canReject = isLabActionAllowed(row.allowedActions, 'reject');
  const rejection = useMemo(() => retestContextFromRow(chromeRow), [chromeRow]);
  const sampleRejection = useSampleRejectionDisplay(chromeRow);
  const hasCriticalValues = Boolean(row.hasCriticalValues);
  const [criticalSeen, setCriticalSeen] = useState(false);

  if (!row.results) return null;

  return {
    row,
    chromeRow,
    patientName: row.patientName || '—',
    onApprove,
    onReject,
    isApproving,
    handleCardClick,
    getUserName,
    sampleRejection,
    rejection,
    canValidate,
    canReject,
    hasCriticalValues,
    criticalSeen,
    setCriticalSeen,
  };
}