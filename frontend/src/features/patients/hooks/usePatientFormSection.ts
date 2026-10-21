import { useFormContext } from 'react-hook-form';
import type { PatientFormInput } from '../schemas/patientFormSchemas';

/** Control + errors for patient form sections inside {@link FormProvider}. */
export function usePatientFormSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<PatientFormInput>();
  return { control, errors };
}
