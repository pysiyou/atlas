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
  usePatientContextList,
} from './api/patients.api';
export type { PatientsFilter } from './api/patients.api';

export {
  affiliationAPI,
  useAffiliationPricing,
  useAffiliationPrice,
  useSelectedAffiliationPrice,
} from './api/affiliations.api';

export { AgeFilter } from './components/AgeFilter';
