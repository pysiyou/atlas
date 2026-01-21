/**
 * SampleRejectionPopover - Popover for rejecting collected samples
 * 
 * Allows lab staff to reject samples with reasons, notes, and recollection options.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Popover, IconButton, Icon, Alert, Badge } from '@/shared/ui';
import { PopoverForm, CheckboxCard } from '../shared/PopoverForm';
import type { RejectionReason } from '@/types';

/** Rejection reason options with labels and descriptions */
const REJECTION_REASONS: { value: RejectionReason; label: string; description: string }[] = [
  { value: 'hemolyzed', label: 'Hemolyzed', description: 'Red blood cell breakdown detected' },
  { value: 'clotted', label: 'Clotted', description: 'Sample clotted when anticoagulant was required' },
  { value: 'qns', label: 'Quantity Not Sufficient (QNS)', description: 'Insufficient volume for testing' },
  { value: 'wrong_container', label: 'Wrong Container', description: 'Collected in incorrect tube type' },
  { value: 'labeling_error', label: 'Labeling Error', description: 'Missing or incorrect patient identification' },
  { value: 'transport_delay', label: 'Transport Delay', description: 'Exceeded acceptable transport time' },
  { value: 'contaminated', label: 'Contaminated', description: 'Visible contamination present' },
  { value: 'lipemic', label: 'Lipemic', description: 'Lipemia interferes with testing' },
  { value: 'icteric', label: 'Icteric', description: 'Jaundice interferes with testing' },
  { value: 'other', label: 'Other', description: 'Other reason (specify in notes)' },
];

interface SampleRejectionPopoverContentProps {
  onConfirm: (reasons: RejectionReason[], notes: string, requireRecollection: boolean) => void;
  onCancel: () => void;
  sampleId: string;
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
  rejectionHistoryCount?: number;
}

const SampleRejectionPopoverContent: React.FC<SampleRejectionPopoverContentProps> = ({
  onConfirm,
  onCancel,
  sampleId,
  sampleType,
  patientName,
  isRecollection = false,
  rejectionHistoryCount = 0,
}) => {
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [notes, setNotes] = useState('');
  const [requireRecollection, setRequireRecollection] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = reasons.length > 0 && (!reasons.includes('other') || notes.trim());

  const handleConfirm = useCallback(async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onConfirm(reasons, notes, requireRecollection);
    setIsSubmitting(false);
  }, [isValid, reasons, notes, requireRecollection, onConfirm]);

  const toggleReason = (value: RejectionReason) => {
    setReasons(prev =>
      prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && isValid) {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isValid, handleConfirm, onCancel]);

  // Header badges for recollection and rejection history
  const headerBadges = (
    <>
      {isRecollection && <Badge size="sm" variant="warning">Recollection</Badge>}
      {rejectionHistoryCount > 0 && (
        <Badge size="sm" variant="error">
          {rejectionHistoryCount} Previous Rejection{rejectionHistoryCount > 1 ? 's' : ''}
        </Badge>
      )}
    </>
  );

  return (
    <PopoverForm
      title={patientName || 'Reject Sample'}
      subtitle={`${sampleType?.toUpperCase() || 'SAMPLE'} - ${sampleId}`}
      headerBadges={headerBadges}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Reject"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!isValid}
      footerInfo={
        <>
          <Icon name="alert-circle" className="w-3.5 h-3.5" />
          <span>Rejecting sample</span>
        </>
      }
    >
      {/* Warning Alert */}
      {rejectionHistoryCount > 1 ? (
        <Alert variant="danger" className="py-2">
          <div className="space-y-0.5">
            <p className="font-medium text-xs">Multiple Rejections Detected</p>
            <p className="text-[10px] opacity-90 leading-tight">
              This sample has been rejected {rejectionHistoryCount} times already. Consider escalating to supervisor.
            </p>
          </div>
        </Alert>
      ) : (
        <Alert variant="warning" className="py-2">
          <div className="space-y-0.5">
            <p className="font-medium text-xs">Action Required</p>
            <p className="text-[10px] opacity-90 leading-tight">
              {patientName ? `Sample for ${patientName} will be marked as rejected.` : 'The sample will be marked as rejected.'}
            </p>
          </div>
        </Alert>
      )}

      {/* Rejection Reasons */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">Rejection Reasons</label>
        <div className="border border-gray-200 rounded-md max-h-[200px] overflow-y-auto">
          {REJECTION_REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-start p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors ${reasons.includes(r.value) ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={reasons.includes(r.value)}
                  onChange={() => toggleReason(r.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-2 text-xs">
                <div className="font-medium text-gray-900">{r.label}</div>
                <div className="text-gray-500">{r.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Recollection Toggle */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Next Step</label>
        <CheckboxCard
          checked={requireRecollection}
          onChange={() => setRequireRecollection(!requireRecollection)}
          label="Require Recollection"
          description="A new pending sample will be automatically created and linked to this rejection."
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Notes {reasons.includes('other') && <span className="text-red-500">*</span>}
        </label>
        <textarea
          rows={2}
          placeholder="Additional details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        {reasons.includes('other') && !notes.trim() && (
          <p className="text-xs text-red-500 mt-1">Required when "Other" is selected</p>
        )}
      </div>
    </PopoverForm>
  );
};

interface SampleRejectionPopoverProps {
  /** Sample ID */
  sampleId: string;
  /** Sample type for display */
  sampleType?: string;
  /** Patient name for display */
  patientName?: string;
  /** Whether this is a recollection sample */
  isRecollection?: boolean;
  /** Number of previous rejections */
  rejectionHistoryCount?: number;
  /** Callback when rejection is confirmed */
  onReject: (reasons: RejectionReason[], notes: string, requireRecollection: boolean) => Promise<void> | void;
  /** Custom trigger element (uses default icon button if not provided) */
  trigger?: React.ReactNode;
}

export const SampleRejectionPopover: React.FC<SampleRejectionPopoverProps> = ({
  sampleId,
  sampleType,
  patientName,
  isRecollection,
  rejectionHistoryCount,
  onReject,
  trigger,
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={8}
    trigger={
      trigger || (
        <IconButton
          variant="delete"
          size="sm"
          title="Reject Sample"
        />
      )
    }
  >
    {({ close }) => (
      <div data-popover-content onClick={(e) => e.stopPropagation()}>
        <SampleRejectionPopoverContent
          sampleId={sampleId}
          sampleType={sampleType}
          patientName={patientName}
          isRecollection={isRecollection}
          rejectionHistoryCount={rejectionHistoryCount}
          onCancel={close}
          onConfirm={async (reasons, notes, requireRecollection) => {
            await onReject(reasons, notes, requireRecollection);
            close();
          }}
        />
      </div>
    )}
  </Popover>
);
