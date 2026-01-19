import React, { useState } from 'react';
import { Popover, IconButton, Icon, Button, Textarea, Alert, Badge } from '@/shared/ui';
import { useAuth } from '@/hooks';
import type { RejectionReason } from '@/types';

// Reusing the rejection reasons from the modal (or ideally moving to a shared constant)
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
  const { currentUser } = useAuth();
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [notes, setNotes] = useState('');
  const [requireRecollection, setRequireRecollection] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleConfirm = async () => {
    if (reasons.length === 0) return;
    if (reasons.includes('other') && !notes.trim()) return;

    setIsSubmitting(true);
    // Simulate short delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    onConfirm(reasons, notes, requireRecollection);
    setIsSubmitting(false);
  };

  const toggleReason = (value: RejectionReason) => {
    setReasons(prev => 
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value]
    );
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && reasons.length > 0) {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reasons, notes, requireRecollection]);

  return (
    <div className="w-90 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[600px]">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{patientName}</h4>
            {isRecollection && (
              <Badge size="sm" variant="warning">Recollection</Badge>
            )}
            {rejectionHistoryCount > 0 && (
              <Badge size="sm" variant="error">{rejectionHistoryCount} Previous Rejection{rejectionHistoryCount > 1 ? 's' : ''}</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">
             {sampleType?.toUpperCase()} - {sampleId}
          </p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 mt-0.5">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Warning Alert */}
        {rejectionHistoryCount > 1 ? (
          <Alert variant="danger" className="py-2">
              <div className="space-y-0.5">
                <p className="font-medium text-xs">⚠️ Multiple Rejections Detected</p>
                <p className="text-[10px] opacity-90 leading-tight">
                  This sample has been rejected {rejectionHistoryCount} times already. Consider escalating to supervisor or investigating systematic issues.
                </p>
              </div>
          </Alert>
        ) : (
          <Alert variant="warning" className="py-2">
              <div className="space-y-0.5">
                <p className="font-medium text-xs">Action Required</p>
                <p className="text-[10px] opacity-90 leading-tight">
                  {patientName
                    ? `Sample for ${patientName} will be marked as rejected.`
                    : 'The sample will be marked as rejected.'
                  }
                </p>
              </div>
          </Alert>
        )}

        {/* Rejection Reason */}
        <div className="space-y-2">
           <label className="block text-xs font-medium text-gray-700">Rejection Reasons</label>
           <div className="border border-gray-200 rounded-md max-h-[200px] overflow-y-auto">
             {REJECTION_REASONS.map((r) => (
               <label 
                 key={r.value} 
                 className={`
                   flex items-start p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors
                   ${reasons.includes(r.value) ? 'bg-blue-50/50' : ''}
                 `}
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

        {/* Recollection Toggle (Card Style) */}
        <div>
           <label className="block text-xs font-medium text-gray-500 mb-1">Next Step</label>
           <div 
             className={`
               relative flex items-start p-3 cursor-pointer rounded-lg border transition-all duration-200
               ${requireRecollection
                 ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                 : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
               }
             `}
             onClick={() => setRequireRecollection(!requireRecollection)}
           >
             <div className="flex items-center h-4 mt-0.5">
               <input
                 type="checkbox"
                 checked={requireRecollection}
                 onChange={() => setRequireRecollection(!requireRecollection)}
                 className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 rounded"
               />
             </div>
             <div className="ml-2.5">
               <span className={`block text-xs font-medium ${requireRecollection ? 'text-blue-900' : 'text-gray-900'}`}>
                 Require Recollection
               </span>
               <span className={`block text-[10px] mt-0.5 ${requireRecollection ? 'text-blue-700' : 'text-gray-500'}`}>
                 A new pending sample will be created for this order.
               </span>
             </div>
           </div>
        </div>

        {/* Notes */}
        <Textarea
          label="Notes"
          required={reasons.includes('other')}
          rows={2}
          placeholder="Additional details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          helperText={reasons.includes('other') ? 'Required when "Other" is selected' : undefined}
          className="text-xs"
        />
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
         <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <Icon name="alert-circle" className="w-3.5 h-3.5" />
          <span>Rejecting as {currentUser?.name || 'Lab Staff'}</span>
         </div>
         <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirm}
              isLoading={isSubmitting}
              disabled={reasons.length === 0 || (reasons.includes('other') && !notes.trim())}
            >
              Reject
            </Button>
         </div>
      </div>
    </div>
  );
};

interface SampleRejectionPopoverProps {
  sampleId: string;
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
  rejectionHistoryCount?: number;
  onReject: (reasons: RejectionReason[], notes: string, requireRecollection: boolean) => Promise<void> | void;
}

export const SampleRejectionPopover: React.FC<SampleRejectionPopoverProps> = ({
  sampleId,
  sampleType,
  patientName,
  isRecollection,
  rejectionHistoryCount,
  onReject,
}) => {
  return (
    <Popover
      placement="bottom-end"
      offsetValue={8}
      trigger={
        <IconButton
          icon={<Icon name="close" />}
          variant="danger"
          size="sm"
          title="Reject Sample"
        />
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
};
