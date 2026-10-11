import { useMemo } from 'react';
import { useUserLookup } from '@/lib/api/users';
import { usePatientNameLookup } from '@/features/patients';
import { useLabWorkflowCardClickGuard } from '../hooks';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { useSampleRejectionDisplay } from '../hooks/useSampleRejectionDisplay';
import type { TestWithContext } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';

export interface ResultValidationCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  onClick: () => void;
  isApproving?: boolean;
  isMobile?: boolean;
}

export interface ResultValidationCardSharedData {
  test: TestWithContext;
  patientName: string;
  onApprove: () => void;
  onReject: ResultValidationCardProps['onReject'];
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejection: ReturnType<typeof useSampleRejectionDisplay>;
  rejection: ReturnType<typeof deriveRetestContext>;
  canValidate: boolean;
  canReject: boolean;
}

export function useResultValidationCardData(
  props: ResultValidationCardProps
): ResultValidationCardSharedData | null {
  const { test, onApprove, onReject, onClick, isApproving = false } = props;
  const { getUserName } = useUserLookup();
  const { getPatientName } = usePatientNameLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const canValidate = test.allowedActions?.validate !== false;
  const canReject = test.allowedActions?.reject !== false;
  const rejection = useMemo(() => deriveRetestContext(test), [test]);
  const sampleRejection = useSampleRejectionDisplay(test);

  if (!test.results) return null;

  return {
    test,
    patientName: getPatientName(test.patientId),
    onApprove,
    onReject,
    isApproving,
    handleCardClick,
    getUserName,
    sampleRejection,
    rejection,
    canValidate,
    canReject,
  };
}
