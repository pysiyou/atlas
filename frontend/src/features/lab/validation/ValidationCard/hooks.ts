/**
 * ValidationCard hooks - shared data derivation for mobile/desktop variants
 */

import { useMemo } from 'react';
import { useUserLookup } from '@/lib/api/users.api';
import { usePatientNameLookup } from '@/features/patients';
import { useSampleLookup } from '../../api/samples.api';
import { useLabCardClickGuard, useTestWorkItemState } from '@/features/lab/hooks';
import { deriveRetestContext } from '../../utils/deriveRetestContext';
import { formatRejectionReasons } from '../../utils/labFormatters';
import type { TestWithContext, Sample } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';

export interface ValidationCardProps {
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

export interface ValidationCardSharedData {
  test: TestWithContext;
  patientName: string;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejectionReason?: string;
  workItem: ReturnType<typeof useTestWorkItemState>;
  rejection: ReturnType<typeof deriveRetestContext>;
}

function getSampleRejectionReason(
  test: TestWithContext,
  getSample: (sampleId: number) => Sample | undefined,
): string | undefined {
  if (!test.sampleId) return undefined;
  const sample = getSample(test.sampleId);
  if (sample?.status !== 'rejected') return undefined;
  return formatRejectionReasons(sample.rejectionReasons) ?? undefined;
}

export function useValidationCardData(props: ValidationCardProps): ValidationCardSharedData | null {
  const { test, onApprove, onReject, onClick, isApproving = false } = props;
  const { getUserName } = useUserLookup();
  const { getPatientName } = usePatientNameLookup();
  const { getSample } = useSampleLookup();
  const handleCardClick = useLabCardClickGuard(onClick);
  const workItem = useTestWorkItemState(test);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);

  if (!test.results) return null;

  const patientName = getPatientName(test.patientId);
  const sampleRejectionReason = getSampleRejectionReason(test, getSample);

  return {
    test,
    patientName,
    onApprove,
    onReject,
    isApproving,
    handleCardClick,
    getUserName,
    sampleRejectionReason,
    workItem,
    rejection,
  };
}
