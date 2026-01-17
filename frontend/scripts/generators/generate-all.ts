/**
 * Main Data Generator Orchestrator
 * Generates all seed data and saves to JSON files
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';

import { generatePatients } from './generate-patients';
import { generateOrders } from './generate-orders';
import { generateSamples } from './generate-samples';
import { generateAliquots } from './generate-aliquots';
import { generateReports } from './generate-reports';
import { resetCounters } from '../utils/id-generator';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const GENERATED_DIR = path.join(DATA_DIR, 'generated');

// Test catalog path
const TEST_CATALOG_PATH = path.join(DATA_DIR, 'test-catalog.json');

/**
 * Load test catalog from JSON file
 */
function loadTestCatalog(): Array<{
  test_code: string;
  display_name: string;
  price: number;
  turnaround_time_hours: number;
  mapped_sample_type: string;
  container_types: ('cup' | 'tube')[];
  container_top_colors: ('red' | 'yellow' | 'purple' | 'blue' | 'green' | 'gray' | 'black')[];
  sample: {
    minimum_volume_ml: number;
  };
  result_items: Array<{
    item_code: string;
    item_name: string;
    value_type: 'NUMERIC' | 'SELECT' | 'TEXT';
    unit: string;
    decimals_suggested?: number;
    reference_range?: {
      adult_general?: { low?: number; high?: number };
      adult_male?: { low?: number; high?: number };
      adult_female?: { low?: number; high?: number };
    };
    critical_range?: { low?: number; high?: number };
    allowed_values?: string[];
  }>;
}> {
  try {
    const catalogJson = fs.readFileSync(TEST_CATALOG_PATH, 'utf-8');
    const catalog = JSON.parse(catalogJson);
    return catalog.tests || [];
  } catch (error) {
    console.error('❌ Failed to load test catalog:', error);
    throw error;
  }
}

/**
 * Write data to JSON file
 */
function writeJsonFile(filename: string, data: unknown): void {
  const filepath = path.join(GENERATED_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`   ✓ Written: ${filename}`);
}

/**
 * Verify referential integrity of generated data
 */
function verifyData(data: {
  patients: Array<{ id: string }>;
  orders: Array<{ orderId: string; patientId: string; tests: Array<{ testCode: string; sampleId?: string }> }>;
  samples: Array<{ sampleId: string; orderId: string; testCodes: string[] }>;
  aliquots: Array<{ aliquotId: string; parentSampleId: string; orderId: string; patientId: string }>;
  reports: Array<{ reportId: string; orderId: string; patientId: string }>;
  testCatalog: Array<{ test_code: string }>;
}): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\n🔍 Verifying data integrity...');

  // Create lookup sets
  const patientIds = new Set(data.patients.map(p => p.id));
  const orderIds = new Set(data.orders.map(o => o.orderId));
  const sampleIds = new Set(data.samples.map(s => s.sampleId));
  const testCodes = new Set(data.testCatalog.map(t => t.test_code));

  // Verify orders reference valid patients
  for (const order of data.orders) {
    if (!patientIds.has(order.patientId)) {
      errors.push(`Order ${order.orderId}: invalid patientId ${order.patientId}`);
    }

    // Verify test codes exist
    for (const test of order.tests) {
      if (!testCodes.has(test.testCode)) {
        errors.push(`Order ${order.orderId}: invalid testCode ${test.testCode}`);
      }

      // Verify sample references
      if (test.sampleId && !sampleIds.has(test.sampleId)) {
        errors.push(`Order ${order.orderId}: invalid sampleId ${test.sampleId}`);
      }
    }
  }

  // Verify samples reference valid orders
  for (const sample of data.samples) {
    if (!orderIds.has(sample.orderId)) {
      errors.push(`Sample ${sample.sampleId}: invalid orderId ${sample.orderId}`);
    }

    // Verify test codes
    for (const testCode of sample.testCodes) {
      if (!testCodes.has(testCode)) {
        errors.push(`Sample ${sample.sampleId}: invalid testCode ${testCode}`);
      }
    }
  }

  // Verify aliquots reference valid samples and orders
  for (const aliquot of data.aliquots) {
    if (!sampleIds.has(aliquot.parentSampleId)) {
      errors.push(`Aliquot ${aliquot.aliquotId}: invalid parentSampleId ${aliquot.parentSampleId}`);
    }
    if (!orderIds.has(aliquot.orderId)) {
      errors.push(`Aliquot ${aliquot.aliquotId}: invalid orderId ${aliquot.orderId}`);
    }
    if (!patientIds.has(aliquot.patientId)) {
      errors.push(`Aliquot ${aliquot.aliquotId}: invalid patientId ${aliquot.patientId}`);
    }
  }

  // Verify reports reference valid orders and patients
  for (const report of data.reports) {
    if (!orderIds.has(report.orderId)) {
      errors.push(`Report ${report.reportId}: invalid orderId ${report.orderId}`);
    }
    if (!patientIds.has(report.patientId)) {
      errors.push(`Report ${report.reportId}: invalid patientId ${report.patientId}`);
    }
  }

  // Print results
  if (errors.length === 0) {
    console.log('   ✅ All referential integrity checks passed!');
  } else {
    console.log(`   ❌ Found ${errors.length} errors`);
    errors.slice(0, 10).forEach(e => console.log(`      - ${e}`));
    if (errors.length > 10) {
      console.log(`      ... and ${errors.length - 10} more errors`);
    }
  }

  if (warnings.length > 0) {
    console.log(`   ⚠️  Found ${warnings.length} warnings`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Main generation function
 */
async function generateAll(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🚀 SEED DATA GENERATION');
  console.log('═'.repeat(60));

  // Set faker seed for reproducibility (optional)
  faker.seed(12345);

  // Reset ID counters
  resetCounters();

  // Ensure output directory exists
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  // 1. Load test catalog
  console.log('\n📚 Loading test catalog...');
  const testCatalog = loadTestCatalog();
  console.log(`   Loaded ${testCatalog.length} tests`);

  // 2. Generate patients
  const patients = generatePatients(100);

  // 3. Generate orders (needs patients and test catalog)
  const orders = generateOrders(
    patients.map(p => ({
      id: p.id,
      fullName: p.fullName,
      gender: p.gender,
      medicalHistory: p.medicalHistory,
    })),
    testCatalog,
    200
  );

  // 4. Generate samples (and update order test references)
  const { samples, updatedOrders } = generateSamples(orders, testCatalog);

  // 5. Generate aliquots from collected samples
  const aliquots = generateAliquots(samples, updatedOrders);

  // 6. Generate reports for validated orders
  const reports = generateReports(updatedOrders, patients);

  // 7. Verify data integrity
  const verification = verifyData({
    patients,
    orders: updatedOrders,
    samples,
    aliquots,
    reports,
    testCatalog,
  });

  if (!verification.isValid) {
    console.error('\n❌ Data verification failed! Please fix errors before using generated data.');
    process.exit(1);
  }

  // 8. Write all data to JSON files
  console.log('\n💾 Writing JSON files...');
  writeJsonFile('patients.json', patients);
  writeJsonFile('orders.json', updatedOrders);
  writeJsonFile('samples.json', samples);
  writeJsonFile('aliquots.json', aliquots);
  writeJsonFile('reports.json', reports);

  // Print final summary
  console.log('\n' + '═'.repeat(60));
  console.log('✅ GENERATION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`📊 Final Summary:`);
  console.log(`   Patients: ${patients.length}`);
  console.log(`   Orders: ${updatedOrders.length}`);
  console.log(`   Samples: ${samples.length}`);
  console.log(`   Aliquots: ${aliquots.length}`);
  console.log(`   Reports: ${reports.length}`);
  console.log(`   Test Catalog: ${testCatalog.length} tests`);
  console.log('\n📁 Output directory: data/generated/');
  console.log('═'.repeat(60));
}

// Run the generator
generateAll().catch(error => {
  console.error('❌ Generation failed:', error);
  process.exit(1);
});
