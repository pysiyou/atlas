/**
 * Test factories for Patient entities
 * Uses @faker-js/faker for realistic test data
 */

import { faker } from '@faker-js/faker';
import type {
  Patient,
  Address,
  EmergencyContact,
  MedicalHistory,
  VitalSigns,
  Affiliation,
} from '@/types';

/**
 * Creates a mock Address object
 */
export const createMockAddress = (overrides?: Partial<Address>): Address => ({
  street: faker.location.streetAddress(),
  city: faker.location.city(),
  postalCode: faker.location.zipCode(),
  ...overrides,
});

/**
 * Creates a mock EmergencyContact object
 */
export const createMockEmergencyContact = (
  overrides?: Partial<EmergencyContact>
): EmergencyContact => ({
  fullName: faker.person.fullName(),
  relationship: faker.helpers.arrayElement([
    'spouse',
    'parent',
    'child',
    'sibling',
    'friend',
    'other',
  ]),
  phone: faker.phone.number(),
  email: faker.internet.email(),
  ...overrides,
});

/**
 * Creates a mock MedicalHistory object
 */
export const createMockMedicalHistory = (overrides?: Partial<MedicalHistory>): MedicalHistory => ({
  chronicConditions: faker.helpers.arrayElements(
    ['Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis'],
    { min: 0, max: 2 }
  ),
  currentMedications: faker.helpers.arrayElements(
    ['Metformin', 'Lisinopril', 'Atorvastatin', 'Albuterol'],
    { min: 0, max: 2 }
  ),
  allergies: faker.helpers.arrayElements(['Penicillin', 'Peanuts', 'Latex', 'Sulfa'], {
    min: 0,
    max: 1,
  }),
  previousSurgeries: faker.helpers.arrayElements(
    ['Appendectomy', 'C-Section', 'Knee Replacement'],
    { min: 0, max: 1 }
  ),
  familyHistory: faker.lorem.sentence(),
  lifestyle: {
    smoking: faker.datatype.boolean(),
    alcohol: faker.datatype.boolean(),
  },
  ...overrides,
});

/**
 * Creates mock VitalSigns object
 */
export const createMockVitalSigns = (overrides?: Partial<VitalSigns>): VitalSigns => ({
  temperature: faker.number.float({ min: 36.0, max: 37.5, fractionDigits: 1 }),
  heartRate: faker.number.int({ min: 60, max: 100 }),
  systolicBP: faker.number.int({ min: 100, max: 130 }),
  diastolicBP: faker.number.int({ min: 60, max: 85 }),
  respiratoryRate: faker.number.int({ min: 12, max: 20 }),
  oxygenSaturation: faker.number.int({ min: 95, max: 100 }),
  ...overrides,
});

/**
 * Creates mock Affiliation object
 */
export const createMockAffiliation = (overrides?: Partial<Affiliation>): Affiliation => {
  const startDate = faker.date.recent().toISOString();
  const duration = faker.helpers.arrayElement([6, 12, 24]) as 1 | 3 | 6 | 12 | 24;
  const endDate = faker.date.future().toISOString();

  return {
    assuranceNumber: `ASS-${faker.string.numeric(8)}-${faker.string.numeric(3)}`,
    startDate,
    endDate,
    duration,
    ...overrides,
  };
};

/**
 * Creates a mock Patient object with realistic data
 */
export const createMockPatient = (overrides?: Partial<Patient>): Patient => {
  const createdAt = faker.date.past({ years: 1 }).toISOString();
  const registrationDate = faker.date.past({ years: 2 }).toISOString();

  return {
    id: faker.number.int({ min: 1, max: 10000 }),
    fullName: faker.person.fullName(),
    dateOfBirth: faker.date.past({ years: 50, refDate: new Date(2000, 0, 1) }).toISOString(),
    gender: faker.helpers.arrayElement(['male', 'female']) as 'male' | 'female',
    phone: faker.phone.number(),
    email: faker.internet.email(),
    height: faker.number.int({ min: 150, max: 200 }),
    weight: faker.number.int({ min: 50, max: 120 }),
    address: createMockAddress(),
    affiliation: faker.datatype.boolean() ? createMockAffiliation() : undefined,
    emergencyContact: createMockEmergencyContact(),
    medicalHistory: createMockMedicalHistory(),
    vitalSigns: faker.datatype.boolean() ? createMockVitalSigns() : undefined,
    registrationDate,
    createdBy: faker.number.int({ min: 1, max: 100 }),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
    updatedBy: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
};

/**
 * Creates an array of mock patients
 */
export const createMockPatients = (count: number, overrides?: Partial<Patient>): Patient[] => {
  return Array.from({ length: count }, () => createMockPatient(overrides));
};
