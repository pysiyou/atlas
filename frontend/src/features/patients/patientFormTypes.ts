import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { PatientFormInput } from './schemas/patientFormSchemas';
import type { Affiliation } from '@/types';

export interface PatientFormSectionProps {
  control: Control<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
}

export interface PatientAffiliationSectionProps extends PatientFormSectionProps {
  setValue: UseFormSetValue<PatientFormInput>;
  existingAffiliation?: Affiliation;
  affiliationEnabled: boolean;
  onAffiliationEnabledChange: (enabled: boolean) => void;
  onRenew?: () => void;
}
