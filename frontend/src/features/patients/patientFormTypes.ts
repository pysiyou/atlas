import type { UseFormSetValue } from 'react-hook-form';
import type { PatientFormInput } from './schemas/patientFormSchemas';
import type { Affiliation } from '@/types';

export interface PatientAffiliationSectionProps {
  setValue: UseFormSetValue<PatientFormInput>;
  existingAffiliation?: Affiliation;
  affiliationEnabled: boolean;
  onAffiliationEnabledChange: (enabled: boolean) => void;
  onRenew?: () => void;
}
