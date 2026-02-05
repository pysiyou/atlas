import type { Gender, AffiliationDuration, Relationship, Affiliation } from '@/types';

export interface PatientFormData {
  fullName: string;
  dateOfBirth: string;
  gender?: Gender;
  phone: string;
  email: string;
  height: string;
  weight: string;
  street: string;
  city: string;
  postalCode: string;
  hasAffiliation: boolean;
  affiliationDuration?: AffiliationDuration;
  emergencyContactFullName: string;
  emergencyContactRelationship?: Relationship;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  chronicConditions: string;
  currentMedications: string;
  allergies: string;
  previousSurgeries: string;
  familyHistory: string;
  smoking: boolean;
  alcohol: boolean;
}

export interface PatientFormSectionProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean | number | undefined) => void;
  existingAffiliation?: Affiliation;
  onRenew?: () => void;
}
