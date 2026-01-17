import React, { useState } from 'react';
import { Popover, IconButton, Icon, Button, Textarea, Alert } from '@/shared/ui';
import { useAuth } from '@/hooks';

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
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'re-test' | 're-collect'>('re-test');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    // Simulate short delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    onConfirm(reason, type);
    setIsSubmitting(false);
  };

  return (
    <div className="w-90 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[600px]">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-start justify-between">
        <div className="space-y-0.5">
          <h4 className="font-medium text-gray-900">Reject Results</h4>
          {(testName || testCode || patientName) && (
            <p className="text-xs text-gray-500">
               {testName} {testCode ? `(${testCode})` : ''} {patientName ? `- ${patientName}` : ''}
            </p>
          )}
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 mt-0.5">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
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
              <div 
                className={`
                  relative flex items-start p-3 cursor-pointer rounded-lg border transition-all duration-200
                  ${type === 're-test' 
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => setType('re-test')}
              >
                <div className="flex items-center h-4 mt-0.5">
                  <input
                    type="radio"
                    name="rejection-type"
                    checked={type === 're-test'}
                    onChange={() => setType('re-test')}
                    className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-2.5">
                  <span className={`block text-xs font-medium ${type === 're-test' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Re-test Sample
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${type === 're-test' ? 'text-blue-700' : 'text-gray-500'}`}>
                    Perform the test again using the existing sample.
                  </span>
                </div>
              </div>

              <div 
                className={`
                  relative flex items-start p-3 cursor-pointer rounded-lg border transition-all duration-200
                  ${type === 're-collect' 
                    ? 'bg-red-50 border-red-200 ring-1 ring-red-200' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => setType('re-collect')}
              >
                <div className="flex items-center h-4 mt-0.5">
                  <input
                    type="radio"
                    name="rejection-type"
                    checked={type === 're-collect'}
                    onChange={() => setType('re-collect')}
                    className="h-3.5 w-3.5 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                </div>
                <div className="ml-2.5">
                  <span className={`block text-xs font-medium ${type === 're-collect' ? 'text-red-900' : 'text-gray-900'}`}>
                    New Sample Required
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${type === 're-collect' ? 'text-red-700' : 'text-gray-500'}`}>
                    Reject current sample and request new collection.
                  </span>
                </div>
              </div>
           </div>
        </div>

        {/* Rejection Reason */}
        <Textarea
          label="Rejection Reason"
          required
          rows={3}
          placeholder="Please explain why the results are being rejected..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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
              disabled={!reason.trim()}
            >
              Reject
            </Button>
         </div>
      </div>
    </div>
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
};
