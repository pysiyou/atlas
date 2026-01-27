/**
 * EditPatientModal - MIGRATION IN PROGRESS
 * 
 * NOTE: This component is being migrated to use React Hook Form + Zod.
 * The old form structure (usePatientForm, usePatientMutation) has been removed.
 * 
 * TODO: Complete migration to EditPatientModalV2 pattern with full React Hook Form integration.
 * For now, this is a placeholder that uses the new service hook.
 */

import React from 'react';
import type { Patient } from '@/types';
import { Modal } from '@/shared/ui';
import { usePatientService } from '../services/usePatientService';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  mode: 'create' | 'edit';
}

/**
 * TEMPORARY: Placeholder modal during migration
 * Full migration to React Hook Form + Zod in progress
 */
export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  // Service available for future use
  usePatientService();

  // TODO: Replace with full React Hook Form implementation
  // See EditPatientModalV2.tsx for the new pattern

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Patient' : 'New Patient'}
      maxWidth="max-w-3xl"
    >
      <div className="p-6">
        <p className="text-text-tertiary">
          Patient form migration in progress. Please use the API directly or wait for the full migration.
        </p>
        <p className="text-sm text-text-tertiary mt-2">
          New service hook (usePatientService) is available. Form sections need to be migrated to React Hook Form.
        </p>
      </div>
    </Modal>
  );
};
