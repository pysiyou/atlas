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

export { PatientGenderBadge } from './components/PatientGenderBadge';
export { AgeFilter } from '@/components/filters/AgeFilter';
export {
  renderPatientId,
  renderPatientNameWithAge,
} from './utils/patientTableColumnRenders';
export { formatAddress } from './utils/patientFormatters';

export { Patients as PatientsPage } from './pages/PatientsPage';
export { PatientList } from './pages/PatientList';
export { PatientDetail } from './pages/PatientDetail';
