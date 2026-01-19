/**
 * ResultRejectionPopover - Popover for rejecting test results
 * 
 * Allows validators to reject results with a reason and specify follow-up action.
 */

import React, { useState } from 'react';
import { Popover, IconButton, Icon, Alert } from '@/shared/ui';
import { PopoverForm, RadioCard } from '../shared/PopoverForm';

interface ResultRejectionPopoverContentProps {
  onConfirm: (reason: string, type: 're-test' | 're-collect') => void;
  onCancel: () => void;
  testName?: string;
  testCode?: string;
  patientName?: string;
}

export const ResultRejectionPopoverContent: React.FC<ResultRejectionPopoverContentProps> = ({
  onConfirm,
  onCancel,
  testName,
  testCode,
  patientName,
}) => {
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'re-test' | 're-collect'>('re-test');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onConfirm(reason, type);
    setIsSubmitting(false);
  };

  const subtitle = [testName, testCode ? `(${testCode})` : '', patientName ? `- ${patientName}` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <PopoverForm
      title="Reject Results"
      subtitle={subtitle || undefined}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Reject"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!reason.trim()}
      footerInfo={
        <>
          <Icon name="alert-circle" className="w-3.5 h-3.5" />
          <span>Rejecting results</span>
        </>
      }
    >
      {/* Warning Alert */}
      <Alert variant="warning" className="py-2">
        <div className="space-y-0.5">
          <p className="font-medium text-xs">Action Required</p>
          <p className="text-[10px] opacity-90 leading-tight">
            You are rejecting results. Please specify the required follow-up action.
          </p>
        </div>
      </Alert>

      {/* Action Type Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up Action</label>
        <div className="grid grid-cols-1 gap-2">
          <RadioCard
            name="rejection-type"
            selected={type === 're-test'}
            onClick={() => setType('re-test')}
            label="Re-test Sample"
            description="Perform the test again using the existing sample."
            variant="blue"
          />
          <RadioCard
            name="rejection-type"
            selected={type === 're-collect'}
            onClick={() => setType('re-collect')}
            label="New Sample Required"
            description="Reject current sample and request new collection."
            variant="red"
          />
        </div>
      </div>

      {/* Rejection Reason */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Rejection Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          placeholder="Please explain why the results are being rejected..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>
    </PopoverForm>
  );
};

interface ResultRejectionPopoverProps {
  testName?: string;
  testCode?: string;
  patientName?: string;
  onReject: (reason: string, type: 're-test' | 're-collect') => void;
}

export const ResultRejectionPopover: React.FC<ResultRejectionPopoverProps> = ({
  testName,
  testCode,
  patientName,
  onReject,
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={8}
    trigger={
      <IconButton
        icon={<Icon name="close" />}
        variant="danger"
        size="sm"
        title="Reject Results"
      />
    }
  >
    {({ close }) => (
      <div data-popover-content onClick={(e) => e.stopPropagation()}>
        <ResultRejectionPopoverContent
          onConfirm={(reason, type) => {
            onReject(reason, type);
            close();
          }}
          onCancel={close}
          testName={testName}
          testCode={testCode}
          patientName={patientName}
        />
      </div>
    )}
  </Popover>
);
