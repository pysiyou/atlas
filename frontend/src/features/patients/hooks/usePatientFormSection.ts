import type { PatientFormInput } from '../schemas/patientFormSchemas';
import { useFormContext } from 'react-hook-form';

/** Control + errors for patient form sections inside {@link FormProvider}. */
export function usePatientFormSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<PatientFormInput>();
  return { control, errors };
}
