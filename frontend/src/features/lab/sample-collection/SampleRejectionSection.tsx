/**
 * SampleRejectionSection - Rejection history display section
 */

import React from 'react';
import { REJECTION_REASON_CONFIG } from '@/types/enums/rejection-reason';
import { formatDate } from '@/utils';
import { DetailSection } from '../shared/LabDetailModal';

interface SampleRejectionSectionProps {
  /** Section title */
  title: string;
  /** Rejection reason codes */
  reasons?: string[];
  /** Additional notes */
  notes?: string;
  /** User ID who rejected */
  rejectedBy?: string;
  /** Timestamp of rejection */
  rejectedAt?: string;
  /** Whether recollection is required */
  recollectionRequired?: boolean;
  /** ID of recollection sample if created */
  recollectionSampleId?: string;
  /** Visual variant - red for current rejection, yellow for history */
  variant?: 'red' | 'yellow';
  /** Function to resolve user ID to display name */
  getUserName: (id: string) => string;
}

/**
 * Rejection section component for displaying rejection details
 * Supports both current rejection (red) and historical rejection (yellow) styles
 */
export const SampleRejectionSection: React.FC<SampleRejectionSectionProps> = ({
  title,
  reasons,
  notes,
  rejectedBy,
  rejectedAt,
  recollectionRequired,
  recollectionSampleId,
  variant = 'red',
  getUserName,
}) => {
  const bulletColor = variant === 'red' ? 'bg-red-500' : 'bg-yellow-500';
  const textColor = variant === 'red' ? 'text-red-700' : 'text-yellow-700';
  const notesColor = variant === 'red' ? 'text-red-600' : 'text-yellow-600';

  return (
    <DetailSection title={title}>
      <ul className="space-y-1">
        {reasons && (
          <li className={`flex items-center text-xs ${textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
            <span className="font-medium">
              {reasons.map(r => REJECTION_REASON_CONFIG[r as keyof typeof REJECTION_REASON_CONFIG]?.label || r).join(', ')}
            </span>
          </li>
        )}
        {notes && (
          <li className={`flex items-center text-xs ${notesColor} italic`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
            "{notes}"
          </li>
        )}
        {rejectedBy && rejectedAt && (
          <li className="flex items-center text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
            <span>{getUserName(rejectedBy)} · {formatDate(rejectedAt)}</span>
          </li>
        )}
        {recollectionRequired && (
          <li className="flex items-center text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
            <span>Recollection required</span>
          </li>
        )}
        {recollectionSampleId && (
          <li className="flex items-center text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
            <span>Recollection sample: <span className="font-mono font-medium">{recollectionSampleId}</span></span>
          </li>
        )}
      </ul>
    </DetailSection>
  );
};
