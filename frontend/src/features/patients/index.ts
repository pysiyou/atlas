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

export { PatientGenderBadge } from './components/PatientGenderBadge';
export {
  renderPatientId,
  renderPatientNameWithAge,
  renderPatientOrdersSummary,
  renderPatientSexAgeSecondary,
} from '@/utils/presentation';
export {
  formatAddress,
  formatPatientSexAgeLine,
  formatBirthdayWithAge,
  formatEmergencyContactDisplay,
  formatPatientDetailDate,
} from './utils/patientFormatters';
export { renderGeneralInfoDescriptionItems } from './components/GeneralInfoSection';
export { renderCareSnapshotDescriptionItems } from './components/CareSnapshotSection';
export { renderMedicalHistoryDescriptionItems } from './components/MedicalHistorySectionDisplay';

export { Patients as PatientsPage } from './pages/PatientsPage';
export { PatientList } from './pages/PatientList';
export { PatientDetail } from './pages/PatientDetail';
