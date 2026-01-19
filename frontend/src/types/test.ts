/**
 * Test Catalog and Laboratory Types
 */

import type { ContainerType, ContainerTopColor, SampleType } from './sample';
import type { Patient } from './patient';
import type { TestResult } from './order';

/**
 * Test category types - expanded to match catalog categories
 */
export type TestCategory =
  | 'hematology'
  | 'biochemistry'
  | 'microbiology'
  | 'serology'
  | 'urinalysis'
  | 'imaging'
  | 'immunology'
  | 'molecular'
  | 'toxicology'
  | 'coagulation'
  | 'chemistry'; // Alias for biochemistry

/**
 * Value type for test result items
 */
export type ValueType = 'NUMERIC' | 'SELECT' | 'TEXT';

/**
 * Demographic-specific reference range entry
 */
export interface DemographicRange {
  low?: number;
  high?: number;
}

/**
 * Reference range structure from catalog - supports demographic-specific ranges
 */
export interface CatalogReferenceRange {
  adult_general?: DemographicRange;
  adult_male?: DemographicRange;
  adult_female?: DemographicRange;
  pediatric?: DemographicRange;
  // Can be extended for age-specific ranges
}

/**
 * Critical range for alerting
 */
export interface CriticalRange {
  low?: number;
  high?: number;
}

/**
 * Legacy reference range interface (for backward compatibility)
 */
export interface ReferenceRange {
  min?: number;
  max?: number;
  text?: string;
  gender?: 'male' | 'female';
  ageMin?: number;
  ageMax?: number;
  criticalLow?: number;     // Below this is critical
  criticalHigh?: number;    // Above this is critical
}

/**
 * Sample requirements from catalog
 */
export interface SampleRequirements {
  sample_type: string;
  container: string;
  minimum_volume_ml: number;
  fasting_required: boolean;
  collection_notes?: string;
  rejection_criteria?: string[];
}

/**
 * Result item from catalog - individual test parameter/component
 */
export interface ResultItem {
  item_code: string;
  item_name: string;
  value_type: ValueType;
  unit: string;
  decimals_suggested?: number;
  reference_range?: CatalogReferenceRange; // Optional - some tests (qualitative, text) don't have ranges
  critical_range?: CriticalRange;
  allowed_values?: string[]; // For SELECT type
  citations?: string[];
}

/**
 * Test catalog entry structure (matches JSON)
 */
export interface TestCatalogEntry {
  test_code: string;
  display_name: string;
  synonyms: string[];
  category: string;
  panels?: string[];
  loinc_codes?: string[];
  method_common?: string;
  turnaround_time_hours: number;
  sample: SampleRequirements;
  result_items: ResultItem[];
  sources?: string[];
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  mapped_category: string;
  mapped_sample_type: string;
  container_types: ContainerType[];
  container_top_colors: ContainerTopColor[];
  sample_volume_description?: string;
  price: number;
}

/**
 * Test interface - application-level type
 */
export interface Test {
  code: string; // e.g., HEM001
  name: string;
  synonyms?: string[]; // Alternative names for search
  category: TestCategory;
  price: number; // Editable - catalog provides default
  turnaroundTime: number; // in hours
  sampleType: SampleType;
  sampleVolume: string;  // e.g., "3ml", "5-10ml"
  minimumVolume?: number;  // Minimum mL needed
  optimalVolume?: number;  // Optimal mL for best results
  specialRequirements?: string;
  referenceRanges: ReferenceRange[]; // Legacy format for backward compatibility
  parameters?: TestParameter[]; // For multi-parameter tests like CBC
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Container requirements
  containerTypes: ContainerType[];  // Required container types (cup/tube)
  containerTopColors: ContainerTopColor[]; // Required container top colors
  numberOfContainers?: number;      // How many containers needed

  // New fields from catalog
  panels?: string[]; // Related test panels
  loincCodes?: string[]; // LOINC codes
  methodology?: string; // Method description
  containerDescription?: string; // Detailed container description from sample.container
  collectionNotes?: string; // Special collection instructions
  rejectionCriteria?: string[]; // Sample rejection criteria
  fastingRequired?: boolean; // Whether fasting is required
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'; // Data confidence level
  notes?: string; // Additional test notes
}

/**
 * Test parameter - enhanced to support all value types
 */
export interface TestParameter {
  name: string;
  code: string;
  unit: string;
  referenceRange: string; // Legacy string format for display
  type: 'numeric' | 'text' | 'qualitative' | 'select'; // Extended type
  criticalLow?: number;
  criticalHigh?: number;
  decimalPlaces?: number;
  
  // New fields from catalog result_items
  valueType?: ValueType; // NUMERIC, SELECT, TEXT
  catalogReferenceRange?: CatalogReferenceRange; // Full demographic ranges
  allowedValues?: string[]; // For SELECT type
  decimalsSuggested?: number; // Suggested decimal precision
}

/**
 * Standardized interface for a test with its associated order and patient context.
 * Used in Result Entry and Validation lists.
 */
export interface TestWithContext {
  orderId: string;
  patientId: string;
  patientName: string;
  testName: string;
  testCode: string;
  sampleType?: string;
  sampleId?: string;
  priority: string;
  status: string;
  collectedAt?: string;
  collectedBy?: string;
  resultEnteredAt?: string;
  enteredBy?: string;
  resultValidatedAt?: string;
  validatedBy?: string;
  referringPhysician?: string;
  patient?: Patient; // Full patient object if needed
  results?: Record<string, TestResult>;
  flags?: string[];
  technicianNotes?: string;
  validationNotes?: string;
  [key: string]: unknown;
}
