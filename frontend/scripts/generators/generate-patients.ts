/**
 * Patient Data Generator
 * Generates 100+ patients with diverse profiles for comprehensive testing
 */

import { faker } from '@faker-js/faker';
import { generatePatientId, generateAssuranceNumber } from '../utils/id-generator';
import { weightedRandom, chance } from '../utils/probability';
import { generateMedicalHistory } from '../utils/medical-data';
import {
  getDateInRange,
  getDateOfBirthForAge,
  addMonths,
  toISOString,
  getWorkingHoursTime,
} from '../utils/date-utils';

// Types (matching src/types/patient.ts)
type Gender = 'male' | 'female' | 'other';
type AffiliationDuration = 1 | 3 | 6 | 12 | 24;
type MedicalComplexity = 'none' | 'simple' | 'moderate' | 'complex';

interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  affiliation?: {
    assuranceNumber: string;
    startDate: string;
    endDate: string;
    duration: AffiliationDuration;
  };
  emergencyContact: {
    name: string;
    phone: string;
  };
  medicalHistory: {
    chronicConditions: string[];
    currentMedications: string[];
    allergies: string[];
    previousSurgeries: string[];
    familyHistory: string;
    lifestyle: {
      smoking: boolean;
      alcohol: boolean;
    };
  };
  registrationDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

// Congo cities for realistic addresses
const CONGO_CITIES = [
  { city: 'Kinshasa', postalCode: 'KIN' },
  { city: 'Lubumbashi', postalCode: 'LBB' },
  { city: 'Mbuji-Mayi', postalCode: 'MBM' },
  { city: 'Kananga', postalCode: 'KNG' },
  { city: 'Kisangani', postalCode: 'KSG' },
  { city: 'Bukavu', postalCode: 'BKV' },
  { city: 'Goma', postalCode: 'GOM' },
  { city: 'Kolwezi', postalCode: 'KWZ' },
  { city: 'Likasi', postalCode: 'LKS' },
  { city: 'Matadi', postalCode: 'MTD' },
];

// Congolese street name patterns
const STREET_PATTERNS = [
  'Avenue {name}',
  'Boulevard {name}',
  'Rue {name}',
  'Avenue du {num} {month}',
  'Boulevard du {num} Juin',
  'Rue de la {noun}',
  'Avenue des {plural}',
];

const STREET_NAMES = [
  'Lumumba', 'Kasavubu', 'Mobutu', 'Kabila', 'Tshisekedi',
  'Kasa-Vubu', 'Sendwe', 'Munongo', 'Kimbangu', 'Kalala',
];

const STREET_NOUNS = ['Paix', 'Liberté', 'Victoire', 'République', 'Indépendance'];
const STREET_PLURALS = ['Martyrs', 'Héros', 'Anciens Combattants', 'Nations Unies'];

// Staff user IDs for createdBy/updatedBy
const STAFF_IDS = ['USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005'];

/**
 * Generate a Congolese street address
 */
function generateStreetAddress(): string {
  const pattern = faker.helpers.arrayElement(STREET_PATTERNS);

  return pattern
    .replace('{name}', faker.helpers.arrayElement(STREET_NAMES))
    .replace('{num}', String(faker.number.int({ min: 1, max: 30 })))
    .replace('{month}', faker.helpers.arrayElement(['Janvier', 'Juin', 'Juillet', 'Octobre']))
    .replace('{noun}', faker.helpers.arrayElement(STREET_NOUNS))
    .replace('{plural}', faker.helpers.arrayElement(STREET_PLURALS));
}

/**
 * Generate a Congolese phone number
 */
function generatePhoneNumber(): string {
  const prefixes = ['081', '082', '083', '084', '085', '089', '097', '099'];
  const prefix = faker.helpers.arrayElement(prefixes);
  const number = faker.string.numeric(7);
  return `+243 ${prefix} ${number.slice(0, 3)} ${number.slice(3)}`;
}

/**
 * Generate a Congolese name
 */
function generateCongoleseName(gender: Gender): string {
  const maleFirstNames = [
    'Jean-Pierre', 'Emmanuel', 'Patrick', 'François', 'Joseph', 'Albert',
    'Robert', 'Daniel', 'Michel', 'Pierre', 'Jacques', 'André', 'Paul',
    'Christian', 'David', 'Samuel', 'Olivier', 'Gauthier', 'Serge', 'Thierry',
  ];

  const femaleFirstNames = [
    'Marie', 'Claire', 'Sylvie', 'Josephine', 'Anne', 'Christine', 'Pauline',
    'Françoise', 'Jeanne', 'Bernadette', 'Monique', 'Thérèse', 'Catherine',
    'Angélique', 'Béatrice', 'Cécile', 'Denise', 'Esther', 'Grace', 'Hélène',
  ];

  const lastNames = [
    'Mukendi', 'Kabongo', 'Tshibangu', 'Mwamba', 'Kalala', 'Mutombo',
    'Kasongo', 'Tshilombo', 'Mbaya', 'Nzuzi', 'Lukusa', 'Kalonji',
    'Ilunga', 'Mbuyi', 'Ngoy', 'Kabeya', 'Tshimanga', 'Mwenze',
    'Kazadi', 'Mpiana', 'Ngandu', 'Kabemba', 'Tshiswaka', 'Lunda',
  ];

  const firstName = gender === 'female'
    ? faker.helpers.arrayElement(femaleFirstNames)
    : faker.helpers.arrayElement(maleFirstNames);

  const lastName = faker.helpers.arrayElement(lastNames);

  return `${firstName} ${lastName}`;
}

/**
 * Generate age distribution for comprehensive testing
 */
function generateAgeGroup(): { minAge: number; maxAge: number; label: string } {
  return weightedRandom([
    [{ minAge: 0, maxAge: 5, label: 'infant' }, 5],
    [{ minAge: 6, maxAge: 12, label: 'child' }, 8],
    [{ minAge: 13, maxAge: 17, label: 'adolescent' }, 7],
    [{ minAge: 18, maxAge: 30, label: 'young-adult' }, 20],
    [{ minAge: 31, maxAge: 50, label: 'adult' }, 30],
    [{ minAge: 51, maxAge: 65, label: 'middle-aged' }, 18],
    [{ minAge: 66, maxAge: 80, label: 'senior' }, 10],
    [{ minAge: 81, maxAge: 95, label: 'elderly' }, 2],
  ]);
}

/**
 * Generate affiliation type distribution
 */
type AffiliationType = 'active' | 'expired' | 'none';

function generateAffiliationType(): { type: AffiliationType; duration?: AffiliationDuration } {
  const type = weightedRandom<AffiliationType>([
    ['active', 45],
    ['expired', 15],
    ['none', 40],
  ]);

  if (type === 'active' || type === 'expired') {
    const duration = weightedRandom<AffiliationDuration>([
      [1, 10],
      [3, 20],
      [6, 25],
      [12, 30],
      [24, 15],
    ]);
    return { type, duration };
  }

  return { type };
}

/**
 * Generate medical complexity distribution
 */
function generateMedicalComplexityForAge(ageGroup: string): MedicalComplexity {
  // Older patients tend to have more complex medical histories
  switch (ageGroup) {
    case 'infant':
    case 'child':
      return weightedRandom([
        ['none', 70],
        ['simple', 25],
        ['moderate', 5],
        ['complex', 0],
      ]);
    case 'adolescent':
    case 'young-adult':
      return weightedRandom([
        ['none', 50],
        ['simple', 35],
        ['moderate', 12],
        ['complex', 3],
      ]);
    case 'adult':
      return weightedRandom([
        ['none', 30],
        ['simple', 40],
        ['moderate', 22],
        ['complex', 8],
      ]);
    case 'middle-aged':
      return weightedRandom([
        ['none', 15],
        ['simple', 35],
        ['moderate', 35],
        ['complex', 15],
      ]);
    case 'senior':
    case 'elderly':
      return weightedRandom([
        ['none', 5],
        ['simple', 20],
        ['moderate', 45],
        ['complex', 30],
      ]);
    default:
      return weightedRandom([
        ['none', 30],
        ['simple', 35],
        ['moderate', 25],
        ['complex', 10],
      ]);
  }
}

/**
 * Generate a single patient
 */
function generatePatient(registrationDate: Date): Patient {
  // Generate demographics
  const gender = weightedRandom<Gender>([
    ['male', 48],
    ['female', 50],
    ['other', 2],
  ]);

  const ageGroup = generateAgeGroup();
  const age = faker.number.int({ min: ageGroup.minAge, max: ageGroup.maxAge });
  const dateOfBirth = getDateOfBirthForAge(age);

  const fullName = generateCongoleseName(gender);
  const cityData = faker.helpers.arrayElement(CONGO_CITIES);

  // Generate affiliation
  const affiliationType = generateAffiliationType();
  let affiliation: Patient['affiliation'] | undefined;

  if (affiliationType.type !== 'none' && affiliationType.duration) {
    const duration = affiliationType.duration;
    let startDate: Date;
    let endDate: Date;

    if (affiliationType.type === 'active') {
      // Active: started in the past, ends in the future
      const maxMonthsAgo = Math.max(1, duration - 1);
      const monthsAgo = faker.number.int({ min: 1, max: maxMonthsAgo });
      startDate = addMonths(new Date(), -monthsAgo);
      endDate = addMonths(startDate, duration);
    } else {
      // Expired: ended in the past
      const monthsExpired = faker.number.int({ min: 1, max: 6 });
      endDate = addMonths(new Date(), -monthsExpired);
      startDate = addMonths(endDate, -duration);
    }

    affiliation = {
      assuranceNumber: generateAssuranceNumber(startDate),
      startDate: toISOString(startDate),
      endDate: toISOString(endDate),
      duration,
    };
  }

  // Generate medical history based on age
  const medicalComplexity = generateMedicalComplexityForAge(ageGroup.label);
  const medicalHistory = generateMedicalHistory(medicalComplexity);

  // Generate emergency contact
  const emergencyContactGender = chance(50) ? 'male' : 'female';
  const emergencyContact = {
    name: generateCongoleseName(emergencyContactGender as Gender),
    phone: generatePhoneNumber(),
  };

  // Generate timestamps
  const createdAt = getWorkingHoursTime(registrationDate);
  const staffId = faker.helpers.arrayElement(STAFF_IDS);

  const patient: Patient = {
    id: generatePatientId(registrationDate),
    fullName,
    dateOfBirth: toISOString(dateOfBirth),
    gender,
    phone: generatePhoneNumber(),
    address: {
      street: generateStreetAddress(),
      city: cityData.city,
      postalCode: cityData.postalCode,
    },
    emergencyContact,
    medicalHistory,
    registrationDate: toISOString(registrationDate),
    createdBy: staffId,
    createdAt: toISOString(createdAt),
    updatedAt: toISOString(createdAt),
    updatedBy: staffId,
  };

  // Add optional fields
  if (chance(70)) {
    patient.email = faker.internet.email({
      firstName: fullName.split(' ')[0].toLowerCase(),
      lastName: fullName.split(' ')[1]?.toLowerCase() || 'patient',
    });
  }

  if (affiliation) {
    patient.affiliation = affiliation;
  }

  return patient;
}

/**
 * Generate all patients
 */
export function generatePatients(count: number = 100): Patient[] {
  console.log(`\n👤 Generating ${count} patients...`);

  const patients: Patient[] = [];

  // Generate patients across the past 30 days for varied registration dates
  for (let i = 0; i < count; i++) {
    const registrationDate = getDateInRange(30, 0);
    const patient = generatePatient(registrationDate);
    patients.push(patient);
  }

  // Sort by registration date
  patients.sort((a, b) =>
    new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime()
  );

  // Log statistics
  const stats = {
    total: patients.length,
    withAffiliation: patients.filter(p => p.affiliation).length,
    activeAffiliation: patients.filter(p => {
      if (!p.affiliation) return false;
      return new Date(p.affiliation.endDate) > new Date();
    }).length,
    expiredAffiliation: patients.filter(p => {
      if (!p.affiliation) return false;
      return new Date(p.affiliation.endDate) <= new Date();
    }).length,
    noAffiliation: patients.filter(p => !p.affiliation).length,
    genders: {
      male: patients.filter(p => p.gender === 'male').length,
      female: patients.filter(p => p.gender === 'female').length,
      other: patients.filter(p => p.gender === 'other').length,
    },
    withEmail: patients.filter(p => p.email).length,
    withChronicConditions: patients.filter(p => p.medicalHistory.chronicConditions.length > 0).length,
  };

  console.log('📊 Patient Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   With affiliation: ${stats.withAffiliation} (Active: ${stats.activeAffiliation}, Expired: ${stats.expiredAffiliation})`);
  console.log(`   No affiliation: ${stats.noAffiliation}`);
  console.log(`   Genders: M=${stats.genders.male}, F=${stats.genders.female}, O=${stats.genders.other}`);
  console.log(`   With email: ${stats.withEmail}`);
  console.log(`   With chronic conditions: ${stats.withChronicConditions}`);

  return patients;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const patients = generatePatients(100);
  console.log(JSON.stringify(patients, null, 2));
}
