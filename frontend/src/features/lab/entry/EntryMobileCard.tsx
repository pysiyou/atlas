/**
 * EntryMobileCard - Mobile-friendly card component for result entry
 *
 * Simplified card layout for small screens, similar to PatientCard/PaymentCard style.
 * Shows essential information in a compact, touch-friendly format.
 */

import React from 'react';
import { Badge, IconButton } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import { usePatientNameLookup } from '@/hooks/queries';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import type { Test, TestWithContext } from '@/types';

interface EntryMobileCardProps {
  test: TestWithContext;
  testDef: Test | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onClick?: () => void;
}

export const EntryMobileCard: React.FC<EntryMobileCardProps> = ({
  test,
  testDef,
  resultKey,
  results,
  technicianNotes,
  isComplete,
  onResultsChange,
  onNotesChange,
  onSave,
  onNext,
  onPrev,
  onClick,
}) => {
  const { openModal } = useModal();
  const { getPatientName } = usePatientNameLookup();

  if (!testDef?.parameters) return null;

  const patientName = getPatientName(test.patientId);
  const isRetest = test.isRetest === true;
  const isSampleRecollection = test.sampleIsRecollection === true;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openModal(ModalType.RESULT_DETAIL, {
      test,
      testDef,
      resultKey,
      results,
      technicianNotes,
      isComplete,
      onResultsChange,
      onNotesChange,
      onSave,
      onNext,
      onPrev,
    });
  };

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
            <div className="text-xs text-sky-600 font-medium font-mono truncate">
              {test.testCode}
            </div>
            {test.sampleId && (
              <div
                className="text-xs text-sky-600 font-medium font-mono truncate"
                title={displayId.sample(test.sampleId)}
              >
                • {displayId.sample(test.sampleId)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content: Patient, collection date */}
      <div className="grow">
        <div className="space-y-1">
          <div className="text-xs text-gray-700 font-medium">{patientName}</div>
          <div className="text-xs text-gray-500">{displayId.order(test.orderId)}</div>
          {test.collectedAt && (
            <div className="text-xs text-gray-500 mt-1">
              Collected: {formatDate(test.collectedAt)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Badges (left) + Enter Results button (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        <div className="flex items-center gap-2">
          {test.priority && <Badge variant={test.priority} size="xs" />}
          <Badge variant={test.sampleType} size="xs" />
          {(isRetest || isSampleRecollection) && (
            <Badge variant="warning" size="xs">
              {isRetest ? 'RE-TEST' : 'RECOLLECTION'}
            </Badge>
          )}
        </div>
        <IconButton
          variant="edit"
          size="sm"
          title="Enter Results"
          onClick={e => {
            e.stopPropagation();
            handleCardClick();
          }}
        />
      </div>
    </div>
  );
};
