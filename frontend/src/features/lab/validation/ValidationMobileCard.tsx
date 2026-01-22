/**
 * ValidationMobileCard - Mobile-friendly card component for result validation
 * 
 * Simplified card layout for small screens, similar to PatientCard/PaymentCard style.
 * Shows essential information in a compact, touch-friendly format.
 */

import React from 'react';
import { Badge, IconButton } from '@/shared/ui';
import { formatDate } from '@/utils';
import { getPatientName } from '@/utils/typeHelpers';
import { usePatients } from '@/hooks';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import type { TestWithContext } from '@/types';
import { RejectionDialog } from '../components';

interface ValidationMobileCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (reason?: string, type?: 're-test' | 're-collect') => void;
  onClick?: () => void;
  orderHasValidatedTests?: boolean;
}

export const ValidationMobileCard: React.FC<ValidationMobileCardProps> = ({
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
  const { patients } = usePatients();

  if (!test.results) return null;

  const patientName = getPatientName(test.patientId, patients);
  const resultCount = Object.keys(test.results).length;
  const hasFlags = test.flags && test.flags.length > 0;
  const isRetest = test.isRetest === true;
  const hasRejectionHistory = test.resultRejectionHistory && test.resultRejectionHistory.length > 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openModal(ModalType.VALIDATION_DETAIL, {
      test, commentKey, comments, onCommentsChange, onApprove, onReject, orderHasValidatedTests,
    });
  };

  // Get first few result values for preview
  const resultPreview = Object.entries(test.results).slice(0, 2).map(([key, value]) => {
    const resultValue = typeof value === 'object' && value !== null && 'value' in value
      ? (value as { value: unknown }).value
      : value;
    return { key, value: String(resultValue) };
  });

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
    >
      {/* Header: Test name + Sample ID */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="min-w-0 overflow-hidden">
          <div className="text-sm font-semibold text-gray-900 truncate">{test.testName}</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-sky-600 font-medium font-mono truncate">{test.testCode}</div>
            {test.sampleId && !test.sampleId.includes('PENDING') && (
              <div className="text-xs text-sky-600 font-medium font-mono truncate" title={test.sampleId}>
                • {test.sampleId}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content: Patient, results preview, entry date */}
      <div className="grow">
        <div className="space-y-1">
          <div className="text-xs text-gray-700 font-medium">{patientName}</div>
          <div className="text-xs text-gray-500">{test.orderId}</div>
          {resultPreview.length > 0 && (
            <div className="text-xs text-gray-600 mt-2 space-y-0.5">
              {resultPreview.map(({ key, value }) => (
                <div key={key} className="truncate">
                  {key}: <span className="font-medium">{value}</span>
                </div>
              ))}
              {resultCount > 2 && (
                <div className="text-gray-500">+{resultCount - 2} more</div>
              )}
            </div>
          )}
          {test.resultEnteredAt && (
            <div className="text-xs text-gray-500 mt-1">
              Entered: {formatDate(test.resultEnteredAt)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Badges (left) + Approve/Reject buttons (right) */}
      <div className="flex justify-between items-center gap-2 mt-auto pt-3">
        <div className="flex items-center gap-2">
          {hasFlags && (
            <Badge variant="danger" size="xs">
              {test.flags!.length} FLAG{test.flags!.length > 1 ? 'S' : ''}
            </Badge>
          )}
          {test.priority && <Badge variant={test.priority} size="xs" />}
          <Badge variant={test.sampleType} size="xs" />
          {(isRetest || hasRejectionHistory) && (
            <Badge variant="warning" size="xs">RE-TEST</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <RejectionDialog
              orderId={test.orderId}
              testCode={test.testCode}
              testName={test.testName}
              patientName={patientName}
              orderHasValidatedTests={orderHasValidatedTests}
              onReject={() => {
                onReject(undefined, undefined);
              }}
            />
          </div>
          <IconButton 
            variant="approve" 
            size="sm"
            title="Approve Results"
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
          />
        </div>
      </div>
    </div>
  );
};
