import type { PatientFormInput } from '../schemas/patientFormSchemas';

/** Default nested shells for create-mode patient form (React Hook Form). */
export const patientCreateDefaultValues = {
  fullName: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: {
    street: '',
    city: '',
    postalCode: '',
  },
  emergencyContact: {
    fullName: '',
    phone: '',
    email: '',
  },
  medicalHistory: {
    chronicConditions: [],
    currentMedications: [],
    allergies: [],
    previousSurgeries: [],
    familyHistory: '',
    lifestyle: {
      smoking: false,
      alcohol: false,
    },
  },
  vitalSigns: {},
} as unknown as Partial<PatientFormInput>;
