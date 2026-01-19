/**
 * ResultValidationCard - Card component for result validation workflow
 * 
 * Displays test results with approval/rejection actions.
 */

import React from 'react';
import { Badge, Icon, IconButton } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { LabCard, FlagsSection } from '../shared/LabCard';
import { ResultRejectionPopover } from './ResultRejectionPopover';
import { ResultStatusBadge } from '../shared/StatusBadges';

interface TestWithContext {
  orderId: string;
  patientId: string;
  patientName: string;
  testName: string;
  testCode: string;
  sampleType?: string;
  sampleId?: string;
  priority: string;
  status: string;
  collectedAt?: string;
  collectedBy?: string;
  resultEnteredAt?: string;
  enteredBy?: string;
  referringPhysician?: string;
  results?: Record<string, unknown>;
  flags?: string[];
  technicianNotes?: string;
  [key: string]: unknown;
}

interface ResultValidationCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (reason?: string, type?: 're-test' | 're-collect') => void;
  onClick?: () => void;
}

export const ResultValidationCard: React.FC<ResultValidationCardProps> = ({
  test,
  commentKey,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
  onClick,
}) => {
  const { openModal } = useModal();
  const { getUserName } = useUserDisplay();

  if (!test.results) return null;

  const resultCount = Object.keys(test.results).length;
  const hasFlags = test.flags && test.flags.length > 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openModal(ModalType.VALIDATION_DETAIL, {
      test, commentKey, comments, onCommentsChange, onApprove, onReject,
    });
  };

  // Badges ordered by importance for validation workflow
  const badges = (
    <>
      <h3 className="text-sm font-medium text-gray-900">{test.testName}</h3>
      {hasFlags && (
        <Badge size="sm" variant="danger">
          {test.flags!.length} FLAG{test.flags!.length > 1 ? 'S' : ''}
        </Badge>
      )}
      <Badge variant={test.priority} size="sm" />
      <Badge variant={test.sampleType} size="sm" />
      <Badge size="sm" variant="default" className="text-gray-600">{test.testCode}</Badge>
    </>
  );

  // Approve/Reject actions
  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
      <ResultRejectionPopover
        testName={test.testName}
        testCode={test.testCode}
        patientName={test.patientName}
        onReject={onReject}
      />
      <IconButton
        onClick={(e) => { e.stopPropagation(); onApprove(); }}
        icon={<Icon name="check" />}
        variant="success"
        size="sm"
        title="Approve Results"
      />
    </div>
  );

  // Additional info (result entry time)
  const additionalInfo = test.resultEnteredAt && (
    <span className="text-xs text-gray-500">
      Results entered <span className="text-gray-700">{formatDate(test.resultEnteredAt)}</span>
      {test.enteredBy && <span> by {getUserName(test.enteredBy)}</span>}
    </span>
  );

  // Results grid - each item stays on a single line
  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
      {Object.entries(test.results).map(([key, value]) => {
        const resultValue = typeof value === 'object' && value !== null && 'value' in value
          ? (value as { value: unknown }).value
          : value;
        const unit = typeof value === 'object' && value !== null && 'unit' in value
          ? (value as { unit: string }).unit
          : '';
        const status = typeof value === 'object' && value !== null && 'status' in value
          ? (value as { status: string }).status as 'normal' | 'high' | 'low' | 'critical'
          : 'normal';

        return (
          <div key={key} className="flex items-center gap-8 min-w-0 whitespace-nowrap">
            <span className="text-xs text-gray-500 shrink-0" title={key}>{key}:</span>
            <span className={`text-sm font-medium shrink-0 ${
              status === 'critical' ? 'text-red-600 font-bold' :
              status === 'high' || status === 'low' ? 'text-amber-600' :
              'text-gray-900'
            }`}>
              {String(resultValue)}
              {unit && <span className="text-xs text-gray-400 ml-1 font-normal">{unit}</span>}
            </span>
            <ResultStatusBadge status={status} />
          </div>
        );
      })}
    </div>
  );

  return (
    <LabCard
      onClick={handleCardClick}
      context={{
        patientName: test.patientName,
        orderId: test.orderId,
        referringPhysician: test.referringPhysician,
      }}
      sampleInfo={{
        sampleId: test.sampleId,
        collectedAt: test.collectedAt,
        collectedBy: test.collectedBy,
      }}
      additionalInfo={additionalInfo}
      badges={badges}
      actions={actions}
      content={content}
      contentTitle={`Results (${resultCount})`}
      flags={hasFlags ? <FlagsSection flags={test.flags!} /> : undefined}
    />
  );
};
