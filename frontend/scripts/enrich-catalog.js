#!/usr/bin/env node

/**
 * Catalog Enrichment Script
 * 
 * This script reads lab_test_catalog_full.json and enriches it with:
 * - Mapped category (to app's TestCategory type)
 * - Mapped sample_type (to app's SampleType type)
 * - Parsed container information (type and color)
 * - Default pricing by category
 * 
 * Output: lab_test_catalog_enriched.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// MAPPING TABLES (Manually defined based on catalog analysis)
// ============================================================================

/**
 * Category Mapping: Catalog categories → App TestCategory
 * Maps 44 catalog categories to 10 app categories
 */
const CATEGORY_MAP = {
  // Hematology
  "Hematology": "hematology",
  "Hematology - Enzymatic Defects": "hematology",
  "Hematology - Hemoglobinopathy": "hematology",
  "Hematology - Transfusion Medicine": "hematology",
  
  // Biochemistry (Clinical Chemistry)
  "Clinical Chemistry": "biochemistry",
  "Clinical Chemistry - Acid-Base": "biochemistry",
  "Clinical Chemistry - Cardiac": "biochemistry",
  "Clinical Chemistry - Electrolytes": "biochemistry",
  "Clinical Chemistry - Inflammation": "biochemistry",
  "Clinical Chemistry - Iron Metabolism": "biochemistry",
  "Clinical Chemistry - Lipid Panel": "biochemistry",
  "Clinical Chemistry - Liver Function": "biochemistry",
  "Clinical Chemistry - Minerals": "biochemistry",
  "Clinical Chemistry - Nutrition": "biochemistry",
  "Clinical Chemistry - Nutritional Status": "biochemistry",
  "Clinical Chemistry - Pancreatic Enzymes": "biochemistry",
  "Clinical Chemistry - Protein Fractionation": "biochemistry",
  "Clinical Chemistry - Protein Metabolism": "biochemistry",
  "Clinical Chemistry - Renal Function": "biochemistry",
  "Endocrinology - Thyroid": "biochemistry",
  "Endocrinology / Reproductive": "biochemistry",
  "Oncology / Tumor Markers": "biochemistry",
  
  // Coagulation
  "Coagulation": "coagulation",
  
  // Microbiology
  "Microbiology - Culture": "microbiology",
  "Microbiology - Culture / Gastrointestinal": "microbiology",
  "Microbiology - Culture / Sepsis": "microbiology",
  "Microbiology - Molecular / TB": "microbiology",
  "Microbiology - Mycobacteriology / TB": "microbiology",
  "Microbiology - Quantitative Urine": "microbiology",
  "Parasitology / Microbiology": "microbiology",
  
  // Serology
  "Serology / Infectious Disease - H. pylori": "serology",
  "Serology / Infectious Disease - HIV": "serology",
  "Serology / Infectious Disease - Hepatitis B": "serology",
  "Serology / Infectious Disease - Hepatitis C": "serology",
  "Serology / Infectious Disease - Parasitic": "serology",
  "Serology / Infectious Disease - Syphilis": "serology",
  "Serology / Infectious Disease - Viral": "serology",
  "Virology / Infectious Disease - Arboviruses": "serology",
  "Virology / Infectious Disease - COVID-19": "serology",
  "Virology / Infectious Disease - Chikungunya": "serology",
  "Virology / Infectious Disease - Dengue": "serology",
  
  // Urinalysis
  "Urinalysis": "urinalysis",
  "Urinalysis / Endocrinology": "urinalysis",
  
  // Parasitology (using serology as closest match)
  "Parasitology / Infectious Disease - Malaria": "serology",
};

/**
 * Sample Type Mapping: Catalog sample_type → App SampleType
 * Maps 26 catalog sample types to 7 app types
 */
const SAMPLE_TYPE_MAP = {
  // Blood samples
  "Whole Blood": "blood",
  "Whole Blood (capillary or venous)": "blood",
  "Whole Blood (venipuncture)": "blood",
  "Plasma": "blood",
  "Plasma (citrated)": "blood",
  "Plasma (citrated or EDTA)": "blood",
  "Plasma (EDTA, NOT serum)": "blood",
  "Serum": "blood",
  "Serum (fasting)": "blood",
  "Serum (fasting preferred)": "blood",
  "Serum or Plasma": "blood",
  "Serum or Plasma (NOT EDTA)": "blood",
  "Serum or Plasma (fluoride tube)": "blood",
  "Serum or whole blood": "blood",
  "Serum or whole blood (RDT)": "blood",
  "Serum for serum folate; Whole blood EDTA for RBC": "blood",
  "Patient serum + donor RBCs": "blood",
  
  // Urine samples
  "Urine (random or mid-stream clean-catch)": "urine",
  "Urine (clean-catch mid-stream)": "urine",
  "Urine (first morning preferred)": "urine",
  
  // Stool samples
  "Stool": "stool",
  
  // Swab samples
  "Nasopharyngeal or oropharyngeal swab": "swab",
  "Nasopharyngeal swab or sputum": "swab",
  
  // Sputum samples
  "Sputum": "sputum",
  "Sputum or respiratory fluids": "sputum",
  
  // Special/Other
  "Derived from serum creatinine": "other",
};

/**
 * Default Pricing by Category (in USD)
 * These are placeholder values to be customized per laboratory
 */
const DEFAULT_PRICING = {
  "hematology": 25.00,
  "biochemistry": 30.00,
  "microbiology": 45.00,
  "serology": 50.00,
  "urinalysis": 20.00,
  "coagulation": 35.00,
  "immunology": 60.00,
  "molecular": 100.00,
  "toxicology": 75.00,
  "imaging": 80.00,
};

// ============================================================================
// CONTAINER PARSING FUNCTIONS
// ============================================================================

/**
 * Detect container type from container string
 * @param {string} container - Container description
 * @returns {string[]} Array of container types
 */
function detectContainerType(container) {
  const containerLower = container.toLowerCase();
  
  if (containerLower.includes("cup")) {
    return ["cup"];
  }
  
  if (containerLower.includes("tube") || containerLower.includes("bottle")) {
    return ["tube"];
  }
  
  if (containerLower.includes("n/a")) {
    return ["tube"]; // Default for N/A
  }
  
  // Default to tube if unclear
  return ["tube"];
}

/**
 * Detect container top color from container string
 * @param {string} container - Container description
 * @returns {string[]} Array of container top colors
 */
function detectContainerColor(container) {
  const containerLower = container.toLowerCase();
  const colors = [];
  
  // Check for explicit color mentions
  if (containerLower.includes("purple") || containerLower.includes("edta")) {
    colors.push("purple");
  }
  
  if (containerLower.includes("blue")) {
    colors.push("blue");
  }
  
  if (containerLower.includes("green") || containerLower.includes("heparin")) {
    colors.push("green");
  }
  
  if (containerLower.includes("yellow")) {
    colors.push("yellow");
  }
  
  if (containerLower.includes("gray") || containerLower.includes("grey") || 
      containerLower.includes("fluoride")) {
    colors.push("gray");
  }
  
  if (containerLower.includes("black")) {
    colors.push("black");
  }
  
  // Red/SST tubes (serum separator)
  if (containerLower.includes("sst") || containerLower.includes("red")) {
    colors.push("red");
  }
  
  // If serum is mentioned but no other color, assume red (SST)
  if (colors.length === 0 && containerLower.includes("serum")) {
    colors.push("red");
  }
  
  // Default to red if no color detected (most common for blood tests)
  if (colors.length === 0 && !containerLower.includes("n/a")) {
    colors.push("red");
  }
  
  // For cups (urine/stool), use gray as default
  if (colors.length === 0 && containerLower.includes("cup")) {
    colors.push("gray");
  }
  
  return colors.length > 0 ? colors : ["red"];
}

/**
 * Extract volume information for display
 * @param {string} container - Container description
 * @returns {string} Volume description
 */
function extractVolumeDescription(container, minimumVolume) {
  // Try to extract volume from container string
  const volumeMatch = container.match(/(\d+(?:\.\d+)?)\s*(ml|mL|μL|g)/i);
  if (volumeMatch) {
    return `${volumeMatch[1]}${volumeMatch[2]}`;
  }
  
  // Fall back to minimum volume
  if (minimumVolume && minimumVolume > 0) {
    return `${minimumVolume}ml`;
  }
  
  return "As required";
}

// ============================================================================
// ENRICHMENT LOGIC
// ============================================================================

/**
 * Enrich a single test with mapped fields
 * @param {object} test - Test object from catalog
 * @returns {object} Enriched test object
 */
function enrichTest(test) {
  // Map category
  const mappedCategory = CATEGORY_MAP[test.category];
  if (!mappedCategory) {
    console.warn(`⚠️  Unmapped category: "${test.category}" for test ${test.test_code}`);
  }
  
  // Map sample type
  const sampleType = test.sample?.sample_type || "Unknown";
  const mappedSampleType = SAMPLE_TYPE_MAP[sampleType];
  if (!mappedSampleType) {
    console.warn(`⚠️  Unmapped sample type: "${sampleType}" for test ${test.test_code}`);
  }
  
  // Parse container information
  const container = test.sample?.container || "";
  const containerTypes = detectContainerType(container);
  const containerTopColors = detectContainerColor(container);
  
  // Generate price based on category
  const price = DEFAULT_PRICING[mappedCategory] || 30.00;
  
  // Extract volume description
  const volumeDesc = extractVolumeDescription(container, test.sample?.minimum_volume_ml);
  
  // Create enriched test object
  return {
    ...test,
    // Add mapped fields
    mapped_category: mappedCategory || "biochemistry", // fallback
    mapped_sample_type: mappedSampleType || "other", // fallback
    container_types: containerTypes,
    container_top_colors: containerTopColors,
    sample_volume_description: volumeDesc,
    price_usd: price,
    
    // Add timestamps for app compatibility
  };
}

/**
 * Enrich the entire catalog
 * @param {object} catalog - Full catalog object
 * @returns {object} Enriched catalog
 */
function enrichCatalog(catalog) {
  console.log('📊 Starting catalog enrichment...\n');
  
  const enrichedTests = catalog.tests.map((test, index) => {
    if ((index + 1) % 10 === 0) {
      process.stdout.write(`\r   Processing test ${index + 1}/${catalog.tests.length}...`);
    }
    return enrichTest(test);
  });
  
  console.log(`\r✅ Processed all ${enrichedTests.length} tests\n`);
  
  // Return enriched catalog
  return {
    ...catalog,
    tests: enrichedTests,
    enrichment_metadata: {
      original_version: catalog.metadata?.version || "2.0",
      enriched_version: "2.0-enriched",
      category_mappings_count: Object.keys(CATEGORY_MAP).length,
      sample_type_mappings_count: Object.keys(SAMPLE_TYPE_MAP).length,
      total_tests_enriched: enrichedTests.length,
    }
  };
}

// ============================================================================
// VALIDATION & REPORTING
// ============================================================================

/**
 * Generate enrichment report
 * @param {object} enrichedCatalog - Enriched catalog
 */
function generateReport(enrichedCatalog) {
  console.log('\n📋 Enrichment Report');
  console.log('='.repeat(60));
  
  // Count by mapped category
  const categoryCount = {};
  const sampleTypeCount = {};
  const unmappedCategories = new Set();
  const unmappedSampleTypes = new Set();
  
  enrichedCatalog.tests.forEach(test => {
    // Categories
    if (test.mapped_category) {
      categoryCount[test.mapped_category] = (categoryCount[test.mapped_category] || 0) + 1;
    } else {
      unmappedCategories.add(test.category);
    }
    
    // Sample types
    if (test.mapped_sample_type) {
      sampleTypeCount[test.mapped_sample_type] = (sampleTypeCount[test.mapped_sample_type] || 0) + 1;
    } else {
      unmappedSampleTypes.add(test.sample?.sample_type || "Unknown");
    }
  });
  
  // Print category distribution
  console.log('\n📊 Tests by Category:');
  Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   ${category.padEnd(20)} : ${count} tests`);
    });
  
  // Print sample type distribution
  console.log('\n🧪 Tests by Sample Type:');
  Object.entries(sampleTypeCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([sampleType, count]) => {
      console.log(`   ${sampleType.padEnd(20)} : ${count} tests`);
    });
  
  // Print warnings
  if (unmappedCategories.size > 0) {
    console.log('\n⚠️  Unmapped Categories:');
    unmappedCategories.forEach(cat => console.log(`   - ${cat}`));
  }
  
  if (unmappedSampleTypes.size > 0) {
    console.log('\n⚠️  Unmapped Sample Types:');
    unmappedSampleTypes.forEach(type => console.log(`   - ${type}`));
  }
  
  // Pricing summary
  console.log('\n💰 Pricing Summary:');
  const priceCategories = {};
  enrichedCatalog.tests.forEach(test => {
    const cat = test.mapped_category || 'other';
    if (!priceCategories[cat]) {
      priceCategories[cat] = { min: test.price_usd, max: test.price_usd, sum: 0, count: 0 };
    }
    priceCategories[cat].min = Math.min(priceCategories[cat].min, test.price_usd);
    priceCategories[cat].max = Math.max(priceCategories[cat].max, test.price_usd);
    priceCategories[cat].sum += test.price_usd;
    priceCategories[cat].count += 1;
  });
  
  Object.entries(priceCategories).forEach(([cat, stats]) => {
    const avg = (stats.sum / stats.count).toFixed(2);
    console.log(`   ${cat.padEnd(20)} : $${avg} avg (${stats.count} tests)`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully enriched ${enrichedCatalog.tests.length} tests`);
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('\n🔬 Laboratory Test Catalog Enrichment Tool');
  console.log('='.repeat(60) + '\n');
  
  // Define file paths
  const inputPath = path.join(__dirname, '..', 'lab_test_catalog_full.json');
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'test-catalog.json');
  
  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input file not found at ${inputPath}`);
    process.exit(1);
  }
  
  try {
    // Read catalog
    console.log(`📖 Reading catalog from: ${path.basename(inputPath)}`);
    const catalogData = fs.readFileSync(inputPath, 'utf8');
    const catalog = JSON.parse(catalogData);
    
    console.log(`   Found ${catalog.tests.length} tests in catalog\n`);
    
    // Enrich catalog
    const enrichedCatalog = enrichCatalog(catalog);
    
    // Generate report
    generateReport(enrichedCatalog);
    
    // Write enriched catalog
    console.log(`💾 Writing enriched catalog to: ${path.basename(outputPath)}`);
    fs.writeFileSync(
      outputPath, 
      JSON.stringify(enrichedCatalog, null, 2),
      'utf8'
    );
    
    console.log(`✅ Enrichment complete!\n`);
    console.log(`📁 Output file: ${outputPath}\n`);
    
  } catch (error) {
    console.error(`\n❌ Error during enrichment:`, error.message);
    process.exit(1);
  }
}

// Run main function
main();

// Export for potential reuse
export { enrichTest, enrichCatalog, CATEGORY_MAP, SAMPLE_TYPE_MAP };
