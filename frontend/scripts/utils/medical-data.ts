/**
 * Medical Data Constants and Generators
 * Realistic medical terminology for seed data generation
 */

import { faker } from '@faker-js/faker';
import { pickOne, pickRandom, chance } from './probability';

// Chronic conditions by category
export const CHRONIC_CONDITIONS = {
  cardiovascular: [
    'Hypertension',
    'Coronary artery disease',
    'Heart failure',
    'Atrial fibrillation',
    'Peripheral artery disease',
  ],
  metabolic: [
    'Type 2 Diabetes',
    'Type 1 Diabetes',
    'Hyperthyroidism',
    'Hypothyroidism',
    'Metabolic syndrome',
    'Obesity',
  ],
  respiratory: [
    'Asthma',
    'COPD',
    'Chronic bronchitis',
    'Sleep apnea',
  ],
  musculoskeletal: [
    'Osteoarthritis',
    'Rheumatoid arthritis',
    'Osteoporosis',
    'Chronic back pain',
    'Fibromyalgia',
  ],
  neurological: [
    'Migraine',
    'Epilepsy',
    'Multiple sclerosis',
    'Parkinson\'s disease',
  ],
  gastrointestinal: [
    'GERD',
    'Irritable bowel syndrome',
    'Crohn\'s disease',
    'Ulcerative colitis',
    'Chronic gastritis',
  ],
  renal: [
    'Chronic kidney disease',
    'Kidney stones',
  ],
  psychiatric: [
    'Depression',
    'Anxiety disorder',
    'Bipolar disorder',
  ],
};

// Common medications by condition category
export const MEDICATIONS = {
  cardiovascular: [
    'Lisinopril 10mg daily',
    'Amlodipine 5mg daily',
    'Metoprolol 25mg twice daily',
    'Losartan 50mg daily',
    'Hydrochlorothiazide 25mg daily',
    'Atorvastatin 20mg daily',
    'Aspirin 81mg daily',
    'Clopidogrel 75mg daily',
  ],
  metabolic: [
    'Metformin 500mg twice daily',
    'Metformin 1000mg twice daily',
    'Glipizide 5mg daily',
    'Insulin glargine 20 units at bedtime',
    'Levothyroxine 50mcg daily',
    'Levothyroxine 100mcg daily',
    'Methimazole 10mg daily',
  ],
  respiratory: [
    'Albuterol inhaler as needed',
    'Fluticasone inhaler twice daily',
    'Montelukast 10mg daily',
    'Tiotropium inhaler daily',
  ],
  musculoskeletal: [
    'Ibuprofen 400mg as needed',
    'Naproxen 500mg twice daily',
    'Meloxicam 15mg daily',
    'Prednisone 5mg daily',
    'Methotrexate 15mg weekly',
    'Calcium + Vitamin D supplement',
  ],
  neurological: [
    'Sumatriptan 50mg as needed',
    'Topiramate 50mg twice daily',
    'Levetiracetam 500mg twice daily',
    'Gabapentin 300mg three times daily',
  ],
  gastrointestinal: [
    'Omeprazole 20mg daily',
    'Pantoprazole 40mg daily',
    'Famotidine 20mg twice daily',
    'Mesalamine 800mg three times daily',
  ],
  psychiatric: [
    'Sertraline 50mg daily',
    'Escitalopram 10mg daily',
    'Fluoxetine 20mg daily',
    'Bupropion 150mg daily',
    'Lorazepam 0.5mg as needed',
  ],
  general: [
    'Multivitamin daily',
    'Vitamin D 2000 IU daily',
    'Fish oil 1000mg daily',
    'Probiotics daily',
  ],
};

// Common allergies
export const ALLERGIES = {
  medications: [
    'Penicillin',
    'Sulfa drugs',
    'Aspirin',
    'NSAIDs',
    'Codeine',
    'Morphine',
    'Tetracycline',
    'Erythromycin',
    'Fluoroquinolones',
    'ACE inhibitors',
  ],
  environmental: [
    'Pollen',
    'Dust mites',
    'Pet dander',
    'Mold',
    'Latex',
  ],
  food: [
    'Peanuts',
    'Tree nuts',
    'Shellfish',
    'Eggs',
    'Milk',
    'Soy',
    'Wheat',
    'Fish',
  ],
};

// Previous surgeries
export const SURGERIES = [
  'Appendectomy',
  'Cholecystectomy',
  'Hernia repair',
  'Cesarean section',
  'Knee arthroscopy',
  'Hip replacement',
  'Knee replacement',
  'Cataract surgery',
  'Tonsillectomy',
  'Hysterectomy',
  'Coronary bypass surgery',
  'Spinal fusion',
  'Rotator cuff repair',
  'Carpal tunnel release',
  'Thyroidectomy',
];

// Family history patterns
export const FAMILY_HISTORY = [
  'Father: Hypertension, Type 2 Diabetes',
  'Mother: Breast cancer (age 65), Osteoporosis',
  'Father: Heart attack (age 55), Hyperlipidemia',
  'Mother: Thyroid disease, Arthritis',
  'Parents: No significant medical history',
  'Father: Colon cancer (age 70); Mother: Hypertension',
  'Father: Type 2 Diabetes; Mother: Heart disease',
  'Paternal grandfather: Stroke; Father: Hypertension',
  'No known family history of chronic diseases',
  'Mother: Depression; Maternal grandmother: Dementia',
  'Father: Prostate cancer (age 72); Mother: Osteoarthritis',
  'Strong family history of cardiovascular disease',
  'Family history of autoimmune disorders',
];

// Referring physicians
export const REFERRING_PHYSICIANS = [
  'Dr. Jean-Pierre Mukendi',
  'Dr. Marie Kabongo',
  'Dr. Patrick Tshibangu',
  'Dr. Sylvie Mwamba',
  'Dr. Emmanuel Kalala',
  'Dr. Claire Mutombo',
  'Dr. François Kasongo',
  'Dr. Josephine Tshilombo',
  'Dr. Albert Mbaya',
  'Dr. Christine Nzuzi',
  'Dr. Robert Lukusa',
  'Dr. Anne-Marie Kalonji',
];

// Clinical notes templates
export const CLINICAL_NOTES_TEMPLATES = [
  'Routine annual check-up. Patient reports feeling well.',
  'Follow-up for {condition}. Symptoms stable on current medication.',
  'New onset {symptom}. Ordered labs for evaluation.',
  'Pre-operative evaluation for elective surgery.',
  'Post-operative follow-up. Healing well.',
  'Medication adjustment needed. Previous dose ineffective.',
  'Screening tests as per age-appropriate guidelines.',
  'Patient concerned about {symptom}. Labs ordered to rule out underlying cause.',
  'Chronic disease monitoring. HbA1c and lipid panel requested.',
  'Fatigue and weight loss. Comprehensive workup ordered.',
  'Annual wellness visit. Preventive labs ordered.',
  'Complaint of {symptom} for past 2 weeks. Workup initiated.',
];

// Symptoms for clinical notes
export const SYMPTOMS = [
  'fatigue',
  'headache',
  'joint pain',
  'chest discomfort',
  'shortness of breath',
  'abdominal pain',
  'dizziness',
  'palpitations',
  'swelling in legs',
  'frequent urination',
  'unexplained weight loss',
  'persistent cough',
];

/**
 * Generate medical history based on complexity level
 */
export function generateMedicalHistory(complexity: 'none' | 'simple' | 'moderate' | 'complex'): {
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  previousSurgeries: string[];
  familyHistory: string;
  lifestyle: { smoking: boolean; alcohol: boolean };
} {
  let chronicConditions: string[] = [];
  let currentMedications: string[] = [];
  let allergies: string[] = [];
  let previousSurgeries: string[] = [];

  // Get all conditions as flat array
  const allConditions = Object.values(CHRONIC_CONDITIONS).flat();
  const allMedications = Object.values(MEDICATIONS).flat();
  const allAllergies = [
    ...ALLERGIES.medications,
    ...ALLERGIES.environmental,
    ...ALLERGIES.food,
  ];

  switch (complexity) {
    case 'none':
      // No conditions, maybe one allergy
      if (chance(20)) {
        allergies = pickRandom(allAllergies, 1);
      }
      break;

    case 'simple':
      // 1-2 conditions, related medications
      chronicConditions = pickRandom(allConditions, faker.number.int({ min: 1, max: 2 }));
      currentMedications = pickRandom(allMedications, faker.number.int({ min: 1, max: 3 }));
      if (chance(30)) {
        allergies = pickRandom(allAllergies, faker.number.int({ min: 1, max: 2 }));
      }
      if (chance(20)) {
        previousSurgeries = pickRandom(SURGERIES, 1);
      }
      break;

    case 'moderate':
      // 2-4 conditions, multiple medications
      chronicConditions = pickRandom(allConditions, faker.number.int({ min: 2, max: 4 }));
      currentMedications = pickRandom(allMedications, faker.number.int({ min: 3, max: 6 }));
      if (chance(50)) {
        allergies = pickRandom(allAllergies, faker.number.int({ min: 1, max: 3 }));
      }
      if (chance(40)) {
        previousSurgeries = pickRandom(SURGERIES, faker.number.int({ min: 1, max: 2 }));
      }
      break;

    case 'complex':
      // 4+ conditions, many medications, multiple allergies
      chronicConditions = pickRandom(allConditions, faker.number.int({ min: 4, max: 7 }));
      currentMedications = pickRandom(allMedications, faker.number.int({ min: 5, max: 10 }));
      allergies = pickRandom(allAllergies, faker.number.int({ min: 2, max: 5 }));
      previousSurgeries = pickRandom(SURGERIES, faker.number.int({ min: 1, max: 4 }));
      break;
  }

  return {
    chronicConditions,
    currentMedications,
    allergies,
    previousSurgeries,
    familyHistory: pickOne(FAMILY_HISTORY),
    lifestyle: {
      smoking: complexity === 'complex' ? chance(40) : chance(15),
      alcohol: chance(30),
    },
  };
}

/**
 * Generate clinical notes
 */
export function generateClinicalNotes(conditions: string[]): string {
  let template = pickOne(CLINICAL_NOTES_TEMPLATES);

  // Replace placeholders
  if (template.includes('{condition}') && conditions.length > 0) {
    template = template.replace('{condition}', pickOne(conditions));
  } else {
    template = template.replace('{condition}', 'chronic condition');
  }

  if (template.includes('{symptom}')) {
    template = template.replace('{symptom}', pickOne(SYMPTOMS));
  }

  return template;
}

/**
 * Get a random referring physician
 */
export function getRandomPhysician(): string {
  return pickOne(REFERRING_PHYSICIANS);
}
