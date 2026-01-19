/**
 * ValidationDetailModal - Extended view for result validation
 * 
 * Provides a larger interface for validating test results with full review options.
 */

import React from 'react';
import { Badge, DetailField, Button, Icon, Popover } from '@/shared/ui';
import { ValidationForm } from './ValidationForm';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { AlertTriangle } from 'lucide-react';
import { LabDetailModal, DetailSection, DetailGrid, ModalFooter, StatusBadgeRow } from '../shared/LabDetailModal';
import { ResultRejectionPopoverContent } from './ResultRejectionPopover';
import type { TestWithContext } from '@/types';

interface ValidationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (reason: string, type: 're-test' | 're-collect') => void;
}

export const ValidationDetailModal: React.FC<ValidationDetailModalProps> = ({
  isOpen,
  onClose,
  test,
  commentKey,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
}) => {
  const { getUserName } = useUserDisplay();

  if (!test.results) return null;

  const handleApprove = () => {
    onApprove();
    onClose();
  };

  const hasFlags = test.flags && test.flags.length > 0;

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={`${test.testCode} - ${test.patientName}`}
      headerBadges={
        <StatusBadgeRow
          sampleType={test.sampleType}
          priority={test.priority}
          status={test.status}
          extraBadges={
            hasFlags && (
              <Badge size="sm" variant="danger" className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-red-600" />
                {test.flags!.length} flag{test.flags!.length !== 1 ? 's' : ''}
              </Badge>
            )
          }
        />
      }
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
      }}
      sampleInfo={test.sampleId && test.collectedAt ? {
        sampleId: test.sampleId,
        collectedAt: test.collectedAt,
        collectedBy: test.collectedBy,
      } : undefined}
      additionalContextInfo={
        test.resultEnteredAt && (
          <span className="text-xs text-gray-500">
            Results entered <span className="font-medium text-gray-700">{formatDate(test.resultEnteredAt)}</span>
            {test.enteredBy && <span> by {getUserName(test.enteredBy)}</span>}
          </span>
        )
      }
      footer={
        <ModalFooter
          statusIcon={hasFlags && <AlertTriangle size={16} className="text-red-500" />}
          statusMessage={hasFlags ? 'Review flags carefully before approving' : 'Verify all results match expected values'}
        >
          <Popover
            placement="top-end"
            offsetValue={8}
            trigger={
              <Button variant="danger" size="md" icon={<Icon name="close" />}>Reject</Button>
            }
          >
            {({ close }) => (
              <div data-popover-content onClick={(e) => e.stopPropagation()}>
                <ResultRejectionPopoverContent
                  onConfirm={(reason, type) => {
                    onReject(reason, type);
                    close();
                    onClose();
                  }}
                  onCancel={close}
                  testName={test.testName}
                  testCode={test.testCode}
                  patientName={test.patientName}
                />
              </div>
            )}
          </Popover>
          <Button onClick={handleApprove} variant="success" size="md" icon={<Icon name="check" />}>
            Approve
          </Button>
        </ModalFooter>
      }
    >
      {/* Validation Form */}
      <DetailSection
        title="Result Validation"
        headerRight={
          hasFlags && (
            <Badge size="sm" variant="danger" className="flex items-center gap-1">
              <AlertTriangle size={12} />
              Review Required
            </Badge>
          )
        }
      >
        <ValidationForm
          results={test.results}
          flags={test.flags}
          technicianNotes={test.technicianNotes}
          comments={comments}
          onCommentsChange={(value) => onCommentsChange(commentKey, value)}
          onApprove={handleApprove}
          onReject={(reason, type) => { onReject(reason, type); onClose(); }}
          testName={test.testName}
          testCode={test.testCode}
          patientName={test.patientName}
        />
      </DetailSection>

      {/* Test Details */}
      <DetailGrid>
        <DetailSection title="Collection Information">
          <div className="space-y-2">
            {test.sampleId && <DetailField label="Sample ID" value={test.sampleId} />}
            {test.collectedAt && (
              <DetailField
                label="Collected"
                value={
                  <div className="text-right">
                    <div>{formatDate(test.collectedAt)}</div>
                    {test.collectedBy && <div className="text-xs text-gray-500">{getUserName(test.collectedBy)}</div>}
                  </div>
                }
              />
            )}
            {test.sampleType && <DetailField label="Sample Type" value={test.sampleType.toUpperCase()} />}
          </div>
        </DetailSection>

        <DetailSection title="Result Entry Information">
          <div className="space-y-2">
            {test.resultEnteredAt && (
              <DetailField
                label="Entered"
                value={
                  <div className="text-right">
                    <div>{formatDate(test.resultEnteredAt)}</div>
                    {test.enteredBy && <div className="text-xs text-gray-500">{getUserName(test.enteredBy)}</div>}
                  </div>
                }
              />
            )}
            {test.testCode && <DetailField label="Test Code" value={test.testCode} />}
            {test.orderId && <DetailField label="Order ID" value={test.orderId} />}
          </div>
        </DetailSection>
      </DetailGrid>
    </LabDetailModal>
  );
};
