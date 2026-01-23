import React from 'react';
import { Modal } from '@/shared/ui';
import { AffiliationCard } from '../PatientDetailSections';
import type { Affiliation } from '@/types';

interface AffiliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  holderName: string;
  affiliation?: Affiliation;
}

/**
 * AffiliationModal Component
 * 
 * Displays patient affiliation information in a modal dialog.
 * Accessible from the header checkmark icon on all screen sizes.
 */
export const AffiliationModal: React.FC<AffiliationModalProps> = ({
  isOpen,
  onClose,
  holderName,
  affiliation,
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Lab Affiliation"
      size="md"
    >
      <div className="flex items-center justify-center p-6">
        <AffiliationCard
          holderName={holderName}
          affiliation={affiliation}
        />
      </div>
    </Modal>
  );
};
