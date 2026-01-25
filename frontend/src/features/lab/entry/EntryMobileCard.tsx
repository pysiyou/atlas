/**
 * EntryMobileCard - Mobile-friendly card component for result entry
 *
 * Simplified card layout for small screens, similar to PatientCard/PaymentCard style.
 * Shows essential information in a compact, touch-friendly format.
 */

import React from 'react';
import { brandColors } from '@/shared/design-system/tokens/colors';
import { Badge, IconButton } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import { usePatientNameLookup } from '@/hooks/queries';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import type { Test, TestWithContext } from '@/types';
import { mobileCard } from '@/shared/design-system/tokens/components/card';

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
      className={mobileCard.base}
    >
      {/* Header: Test name + Sample ID */}
      <div className={mobileCard.header.container}>
        <div className="min-w-0 overflow-hidden">
          <div className={mobileCard.header.title}>{test.testName}</div>
          <div className="flex items-center gap-2">
            <div className={`text-xs ${brandColors.primary.icon} font-medium font-mono truncate`}>
              {test.testCode}
            </div>
            {test.sampleId && (
              <div
                className={`text-xs ${brandColors.primary.icon} font-medium font-mono truncate`}
                title={displayId.sample(test.sampleId)}
              >
                • {displayId.sample(test.sampleId)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content: Patient, collection date */}
      <div className={mobileCard.content.container}>
        <div className="space-y-1">
          <div className={`${mobileCard.content.text} font-medium`}>{patientName}</div>
          <div className={`${mobileCard.content.textSecondary} font-mono`}>{displayId.order(test.orderId)}</div>
          {test.collectedAt && (
            <div className={`${mobileCard.content.textSecondary} mt-1`}>
              Collected: {formatDate(test.collectedAt)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Badges (left) + Enter Results button (right) */}
      <div className={mobileCard.footer.container}>
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
