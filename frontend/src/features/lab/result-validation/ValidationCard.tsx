/**
 * ResultValidationCard - Card component for result validation workflow
 * 
 * Displays test results with approval/rejection actions.
 * Shows retest information and previous rejection history.
 */

import React from 'react';
import { Badge, Icon, IconButton, Alert } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { LabCard, FlagsSection } from '../shared/LabCard';
import { RejectionDialog } from '../shared';
import { ResultStatusBadge } from '../shared/StatusBadges';
import type { ResultRejectionRecord } from '@/types';

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
  // Retest tracking fields
  isRetest?: boolean;
  retestOfTestId?: string;
  retestNumber?: number;
  resultRejectionHistory?: ResultRejectionRecord[];
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
  /**
   * When true, the re-collect option is blocked because the order contains
   * validated tests. This prevents contradictory actions where a sample 
   * recollection would invalidate already-validated results.
   */
  orderHasValidatedTests?: boolean;
}

export const ResultValidationCard: React.FC<ResultValidationCardProps> = ({
  test,
  commentKey,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
  onClick,
  orderHasValidatedTests = false,
}) => {
  const { openModal } = useModal();
  const { getUserName } = useUserDisplay();

  if (!test.results) return null;

  const resultCount = Object.keys(test.results).length;
  const hasFlags = test.flags && test.flags.length > 0;

  // Determine if this is a retest or recollection
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber || 0;
  const rejectionHistory = test.resultRejectionHistory || [];
  const lastRejection = rejectionHistory.length > 0 ? rejectionHistory[rejectionHistory.length - 1] : null;
  
  // Check if this has any rejection history (covers both re-test and re-collect scenarios)
  const hasRejectionHistory = rejectionHistory.length > 0;
  // For re-collect, the last rejection type will be 're-collect'
  const isRecollection = lastRejection?.rejectionType === 're-collect';

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openModal(ModalType.VALIDATION_DETAIL, {
      test, commentKey, comments, onCommentsChange, onApprove, onReject, orderHasValidatedTests,
    });
  };

  // Badges ordered by importance for validation workflow
  // Note: Re-test/Re-collect badges are shown in the rejection banner below
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

  /**
   * Handle rejection result from the RejectionDialog.
   * 
   * IMPORTANT: The RejectionDialog already calls the API via useRejectionManager.
   * We must NOT call onReject here as that would trigger a second API call.
   * Instead, we just trigger a data refresh by calling onReject with a special
   * flag or empty values to signal that the API call already happened.
   * 
   * The result object contains:
   * - action: 'retest_same_sample' | 'recollect_new_sample'
   * - message: Success message from the API
   * - newTestId?: ID of the newly created retest (if applicable)
   */
  const handleRejectionResult = () => {
    // The RejectionDialog already called the API and the rejection succeeded.
    // We call onReject with undefined values to signal to the parent that
    // it should refresh data WITHOUT making another API call.
    // The parent (ResultValidationView.handleValidate) needs to check for this.
    onReject(undefined, undefined);
  };

  // Approve/Reject actions
  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
      <RejectionDialog
        orderId={test.orderId}
        testCode={test.testCode}
        testName={test.testName}
        patientName={test.patientName}
        orderHasValidatedTests={orderHasValidatedTests}
        onReject={handleRejectionResult}
      />
      <IconButton
        onClick={(e) => { e.stopPropagation(); onApprove(); }}
        variant="approve"
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

  // Results grid - using three-column layout for proper alignment of name, value, and badge
  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-40">
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
          <div 
            key={key} 
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-2 py-1.5 whitespace-nowrap"
          >
            {/* Parameter Name Column */}
            <span className="text-xs text-gray-500" title={key}>{key}:</span>
            
            {/* Value Column - left aligned */}
            <span className={`text-sm font-medium text-left ${
              status === 'critical' ? 'text-red-600 font-bold' :
              status === 'high' || status === 'low' ? 'text-amber-600' :
              'text-gray-900'
            }`}>
              {String(resultValue)}
              {unit && <span className="text-xs text-gray-400 ml-1 font-normal">{unit}</span>}
            </span>
            
            {/* Badge Column - fixed width for alignment */}
            <div className="w-16 flex justify-start">
              {status !== 'normal' ? (
                <ResultStatusBadge status={status} />
              ) : (
                // Empty placeholder to maintain column structure
                <span className="invisible">
                  <ResultStatusBadge status="high" />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Rejection banner (shows previous rejection info for both re-test and re-collect)
  const rejectionBanner = hasRejectionHistory && lastRejection ? (
    <Alert variant="warning" className="py-2">
      <div className="space-y-0.5">
        <p className="font-medium text-xs">
          {isRetest 
            ? `Re-test #${retestNumber} - Previous Result Rejected`
            : `Re-collect #${rejectionHistory.length} - Previous Sample Rejected`
          }
        </p>
        <p className="text-xxs opacity-90 leading-tight">
          Reason: {lastRejection.rejectionReason}
        </p>
        {rejectionHistory.length > 1 && (
          <p className="text-xxs opacity-75">
            ({rejectionHistory.length} previous rejection{rejectionHistory.length > 1 ? 's' : ''})
          </p>
        )}
      </div>
    </Alert>
  ) : undefined;

  // Additional info for retest/recollection tracking
  const rejectionTrackingInfo = hasRejectionHistory ? (
    <div className="flex items-center gap-2 flex-wrap">
      {isRetest && test.retestOfTestId && (
        <Badge size="sm" variant="warning" className="flex items-center gap-1">
          <Icon name="alert-circle" className="w-3 h-3" />
          Re-test of {test.retestOfTestId}
        </Badge>
      )}
      {isRecollection && !isRetest && (
        <Badge size="sm" variant="warning" className="flex items-center gap-1">
          <Icon name="alert-circle" className="w-3 h-3" />
          Recollection attempt #{rejectionHistory.length}
        </Badge>
      )}
    </div>
  ) : undefined;

  return (
    <LabCard
      onClick={handleCardClick}
      className={hasRejectionHistory ? 'border-l-4 border-l-yellow-400' : ''}
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
      additionalInfo={
        <>
          {additionalInfo}
          {rejectionTrackingInfo}
        </>
      }
      badges={badges}
      actions={actions}
      recollectionBanner={rejectionBanner}
      content={content}
      contentTitle={`Results (${resultCount})`}
      flags={hasFlags ? <FlagsSection flags={test.flags!} /> : undefined}
    />
  );
};
