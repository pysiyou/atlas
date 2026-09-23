/**
 * Patients Feature — public API
 */

export {
  patientAPI,
  usePatientsList,
  usePaginatedPatients,
  usePatient,
  usePatientSearch,
  usePatientOptions,
  usePatientNames,
  usePatientNameLookup,
  useCreatePatient,
  useUpdatePatient,
  usePaginatedPatientContextList,
} from './api/patients';
export type { PatientsFilter } from './api/patients';

export {
  affiliationAPI,
  useAffiliationPricing,
  useAffiliationPrice,
  useSelectedAffiliationPrice,
} from './api/affiliations';

export { AgeFilter } from '@/components/filters/AgeFilter';
export { PatientGenderBadge } from './components/PatientGenderBadge';
