/**
 * Test Catalog Loader and Transformer
 * Loads and transforms the comprehensive test catalog JSON into application Test types
 */

import type {
  Test,
  TestCategory,
  TestCatalogEntry,
  TestParameter,
  ResultItem,
  CatalogReferenceRange,
  ValueType
} from '@/types';
import type { SampleType } from '@/types';
import { logger } from './logger';

// Import catalog data - Vite handles JSON imports
import catalogJson from '../../data/test-catalog.json';

// Type assertion for catalog structure
const catalogData = catalogJson as { tests: TestCatalogEntry[] };

// Debug: Log catalog data structure on import
if (typeof window === 'undefined' || import.meta.env.DEV) {
  logger.debug('Catalog data imported', {
    hasData: !!catalogData,
    hasTests: !!catalogData?.tests,
    testCount: catalogData?.tests?.length || 0,
    firstTestCode: catalogData?.tests?.[0]?.test_code || 'N/A'
  });
}

/**
 * Map catalog category strings to internal TestCategory enum
 */
function mapCategory(catalogCategory: string): TestCategory {
  const categoryMap: Record<string, TestCategory> = {
    'hematology': 'hematology',
    'biochemistry': 'biochemistry',
    'chemistry': 'biochemistry', // Chemistry is alias for biochemistry
    'microbiology': 'microbiology',
    'serology': 'serology',
    'urinalysis': 'urinalysis',
    'imaging': 'imaging',
    'immunology': 'immunology',
    'molecular': 'molecular',
    'toxicology': 'toxicology',
    'coagulation': 'coagulation',
  };

  const normalized = catalogCategory.toLowerCase();
  return categoryMap[normalized] || 'biochemistry'; // Default fallback
}

/**
 * Map catalog sample type to internal SampleType enum
 */
function mapSampleType(catalogSampleType: string): SampleType {
  const sampleTypeMap: Record<string, SampleType> = {
    'blood': 'blood',
    'urine': 'urine',
    'stool': 'stool',
    'swab': 'swab',
    'tissue': 'tissue',
    'csf': 'csf',
    'sputum': 'sputum',
    'serum': 'serum',
    'plasma': 'plasma',
    'calculated': 'other', // Calculated values don't need samples
    'other': 'other',
  };

  const normalized = catalogSampleType.toLowerCase();
  return sampleTypeMap[normalized] || 'other';
}

/**
 * Convert catalog value type to legacy parameter type
 */
function mapValueTypeToParameterType(valueType: ValueType): 'numeric' | 'text' | 'qualitative' | 'select' {
  switch (valueType) {
    case 'NUMERIC':
      return 'numeric';
    case 'SELECT':
      return 'select';
    case 'TEXT':
      return 'text';
    default:
      return 'text';
  }
}

/**
 * Format reference range for display from catalog range
 * Handles cases where reference_range may be undefined or null
 */
function formatReferenceRangeString(
  range: CatalogReferenceRange | undefined | null,
  gender?: 'male' | 'female'
): string {
  // Handle missing range
  if (!range) {
    return 'N/A';
  }
  
  // Try gender-specific first
  if (gender === 'male' && range.adult_male) {
    const { low, high } = range.adult_male;
    if (low !== undefined && high !== undefined) {
      return `${low}-${high}`;
    }
  }
  
  if (gender === 'female' && range.adult_female) {
    const { low, high } = range.adult_female;
    if (low !== undefined && high !== undefined) {
      return `${low}-${high}`;
    }
  }
  
  // Fall back to general
  if (range.adult_general) {
    const { low, high } = range.adult_general;
    if (low !== undefined && high !== undefined) {
      return `${low}-${high}`;
    }
    if (low !== undefined) {
      return `>${low}`;
    }
    if (high !== undefined) {
      return `<${high}`;
    }
  }
  
  return 'N/A';
}

/**
 * Transform a catalog result item to TestParameter
 * Handles cases where reference_range may be missing
 */
function transformResultItem(resultItem: ResultItem): TestParameter {
  // Handle missing reference_range gracefully
  const referenceRangeString = formatReferenceRangeString(
    resultItem.reference_range || undefined
  );
  
  return {
    name: resultItem.item_name,
    code: resultItem.item_code,
    unit: resultItem.unit,
    referenceRange: referenceRangeString,
    type: mapValueTypeToParameterType(resultItem.value_type),
    criticalLow: resultItem.critical_range?.low,
    criticalHigh: resultItem.critical_range?.high,
    decimalPlaces: resultItem.decimals_suggested,
    // New catalog fields
    valueType: resultItem.value_type,
    catalogReferenceRange: resultItem.reference_range || undefined, // Can be undefined for qualitative tests
    allowedValues: resultItem.allowed_values,
    decimalsSuggested: resultItem.decimals_suggested,
  };
}

/**
 * Transform a catalog entry to application Test type
 */
function transformTestEntry(entry: TestCatalogEntry): Test {
  const now = new Date().toISOString();
  
  return {
    code: entry.test_code,
    name: entry.display_name,
    synonyms: entry.synonyms || [],
    category: mapCategory(entry.mapped_category || entry.category),
    price: entry.price || 0,
    turnaroundTime: entry.turnaround_time_hours || 0,
    sampleType: mapSampleType(entry.mapped_sample_type || entry.sample.sample_type),
    sampleVolume: entry.sample_volume_description || entry.sample.container || 'N/A',
    minimumVolume: entry.sample.minimum_volume_ml,
    optimalVolume: entry.sample.minimum_volume_ml, // Use minimum as optimal if not specified
    specialRequirements: entry.sample.fasting_required 
      ? 'Fasting required' 
      : entry.sample.collection_notes || undefined,
    referenceRanges: [], // Legacy format - can be populated if needed
    parameters: entry.result_items.map(transformResultItem),
    isActive: true, // All tests active by default
    createdAt: now,
    updatedAt: now,
    
    // Container requirements
    containerTypes: entry.container_types || [],
    containerTopColors: entry.container_top_colors || [],
    
    // New catalog fields
    panels: entry.panels || [],
    loincCodes: entry.loinc_codes || [],
    methodology: entry.method_common,
    containerDescription: entry.sample.container,
    collectionNotes: entry.sample.collection_notes,
    rejectionCriteria: entry.sample.rejection_criteria || [],
    fastingRequired: entry.sample.fasting_required || false,
    confidence: entry.confidence,
    notes: entry.notes,
  };
}

/**
 * Load and transform the test catalog from JSON
 * @returns Array of Test objects ready for application use
 */
export function loadTestCatalog(): Test[] {
  try {
    // Check if catalogData exists
    if (!catalogData) {
      logger.error('Catalog data is null or undefined - JSON import failed');
      return [];
    }
    
    // Check if catalogData has the expected structure
    if (typeof catalogData !== 'object') {
      logger.error('Catalog data is not an object', { type: typeof catalogData });
      return [];
    }
    
    if (!('tests' in catalogData)) {
      logger.error('Catalog data missing tests property', {
        availableKeys: Object.keys(catalogData),
      });
      return [];
    }
    
    if (!Array.isArray(catalogData.tests)) {
      logger.error('Invalid catalog data structure - tests is not an array', {
        testsType: typeof catalogData.tests,
        catalogKeys: Object.keys(catalogData),
      });
      return [];
    }

    if (catalogData.tests.length === 0) {
      logger.warn('Catalog data contains no tests');
      return [];
    }
    
    logger.debug('Found tests in catalog data', { count: catalogData.tests.length });

    // Transform tests with error handling
    const tests: Test[] = [];
    const errors: string[] = [];
    
    catalogData.tests.forEach((entry, index) => {
      try {
        const test = transformTestEntry(entry);
        tests.push(test);
      } catch (error) {
        const errorMsg = `Failed to transform test at index ${index} (code: ${entry.test_code})`;
        errors.push(errorMsg);
        logger.error(errorMsg, error);
      }
    });
    
    if (errors.length > 0) {
      logger.warn('Failed to transform some tests', {
        failedCount: errors.length,
        totalCount: catalogData.tests.length,
      });
    }
    
    // Validate test code uniqueness
    const codes = new Set<string>();
    const duplicates: string[] = [];
    
    tests.forEach(test => {
      if (codes.has(test.code)) {
        duplicates.push(test.code);
      } else {
        codes.add(test.code);
      }
    });
    
    if (duplicates.length > 0) {
      logger.warn('Duplicate test codes found', { duplicates });
    }
    
    logger.dataLoaded('tests from catalog', tests.length);
    if (tests.length > 0) {
      logger.debug('Sample test codes', { codes: tests.slice(0, 5).map(t => t.code) });
    } else {
      logger.error('No tests were successfully transformed!');
    }
    return tests;
  } catch (error) {
    logger.error('Error loading test catalog', error);
    return [];
  }
}

/**
 * Get a test by code from the catalog
 */
export function getTestByCode(code: string): Test | undefined {
  const catalog = loadTestCatalog();
  return catalog.find(test => test.code === code);
}

/**
 * Search tests by various criteria
 */
export function searchCatalogTests(query: string): Test[] {
  const catalog = loadTestCatalog();
  const lowerQuery = query.toLowerCase();
  
  return catalog.filter(test => {
    // Search in name
    if (test.name.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in code
    if (test.code.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in synonyms
    if (test.synonyms?.some(syn => syn.toLowerCase().includes(lowerQuery))) return true;
    
    // Search in LOINC codes
    if (test.loincCodes?.some(loinc => loinc.toLowerCase().includes(lowerQuery))) return true;
    
    // Search in panels
    if (test.panels?.some(panel => panel.toLowerCase().includes(lowerQuery))) return true;
    
    return false;
  });
}
