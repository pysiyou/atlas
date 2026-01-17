/**
 * Seed Data Index
 * Loads seed data from generated JSON files
 */

// Export users (static, kept in code)
export { demoUsers } from './seed-users';

// Import utilities
import { STORAGE_KEYS, saveToLocalStorage } from '../storage';
import { loadTestCatalog } from '../test-catalog';
import { logger } from '../logger';

// Import user data
import { demoUsers } from './seed-users';

// Import generated JSON data
import patientsJson from '../../../data/generated/patients.json';
import ordersJson from '../../../data/generated/orders.json';
import samplesJson from '../../../data/generated/samples.json';
import aliquotsJson from '../../../data/generated/aliquots.json';
import reportsJson from '../../../data/generated/reports.json';

// Types
import type { Patient, Order, LabReport } from '@/types';
import type { Sample } from '@/types';

// Type assertions for JSON imports
const demoPatients = patientsJson as Patient[];
const demoOrders = ordersJson as Order[];
const demoSamples = samplesJson as Sample[];
const demoAliquots = aliquotsJson as unknown[];
const demoReports = reportsJson as LabReport[];

// Load test catalog
const testCatalog = loadTestCatalog();

// Export loaded data
export { demoPatients, demoOrders, demoSamples, demoAliquots, demoReports, testCatalog };

/**
 * Seed data version - increment when making breaking changes
 * Version 6: Complete rebuild with Faker.js generated data
 */
const SEED_DATA_VERSION = 6;

/**
 * Verify seed data coherency
 */
function verifySeedData(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Create lookup sets
  const patientIds = new Set(demoPatients.map(p => p.id));
  const orderIds = new Set(demoOrders.map(o => o.orderId));
  const sampleIds = new Set(demoSamples.map(s => s.sampleId));
  const testCodes = new Set(testCatalog.map(t => t.code));

  // Verify orders reference valid patients and tests
  for (const order of demoOrders) {
    if (!patientIds.has(order.patientId)) {
      errors.push(`Order ${order.orderId}: invalid patientId ${order.patientId}`);
    }
    for (const test of order.tests) {
      if (!testCodes.has(test.testCode)) {
        errors.push(`Order ${order.orderId}: invalid testCode ${test.testCode}`);
      }
      if (test.sampleId && !sampleIds.has(test.sampleId)) {
        errors.push(`Order ${order.orderId}: invalid sampleId ${test.sampleId}`);
      }
    }
  }

  // Verify samples reference valid orders
  for (const sample of demoSamples) {
    if (!orderIds.has(sample.orderId)) {
      errors.push(`Sample ${sample.sampleId}: invalid orderId ${sample.orderId}`);
    }
  }

  // Verify reports reference valid orders and patients
  for (const report of demoReports) {
    if (!orderIds.has(report.orderId)) {
      errors.push(`Report ${report.reportId}: invalid orderId ${report.orderId}`);
    }
    if (!patientIds.has(report.patientId)) {
      errors.push(`Report ${report.reportId}: invalid patientId ${report.patientId}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Initialize seed data in localStorage
 */
export const initializeSeedData = (): void => {
  logger.dataInit('seed data', 0);

  // Debug info
  logger.dataLoaded('test catalog', testCatalog.length);
  if (testCatalog.length === 0) {
    logger.error('CRITICAL: Test catalog is empty!');
    throw new Error('Test catalog failed to load.');
  }

  logger.dataLoaded('patients', demoPatients.length);
  logger.dataLoaded('orders', demoOrders.length);
  logger.dataLoaded('samples', demoSamples.length);
  logger.dataLoaded('reports', demoReports.length);

  // Verify data coherency
  const verification = verifySeedData();
  if (!verification.isValid) {
    logger.error('Seed data validation failed!', undefined, {
      errorCount: verification.errors.length,
      errors: verification.errors.slice(0, 10),
    });
    throw new Error('Seed data validation failed.');
  }

  // Save to localStorage
  saveToLocalStorage(STORAGE_KEYS.USERS, demoUsers);
  saveToLocalStorage(STORAGE_KEYS.PATIENTS, demoPatients);
  saveToLocalStorage(STORAGE_KEYS.TESTS, testCatalog);
  saveToLocalStorage(STORAGE_KEYS.ORDERS, demoOrders);
  saveToLocalStorage(STORAGE_KEYS.SAMPLES, demoSamples);
  saveToLocalStorage(STORAGE_KEYS.REPORTS, demoReports);
  saveToLocalStorage('medlab_aliquots', demoAliquots);

  // Initialize empty arrays for data that will be created at runtime
  saveToLocalStorage(STORAGE_KEYS.APPOINTMENTS, []);
  saveToLocalStorage(STORAGE_KEYS.INVOICES, []);
  saveToLocalStorage(STORAGE_KEYS.PAYMENTS, []);
  saveToLocalStorage(STORAGE_KEYS.CLAIMS, []);
  saveToLocalStorage('medlab_sample_movements', []);
  saveToLocalStorage('medlab_seed_version', SEED_DATA_VERSION);

  logger.info('Seed data initialized successfully!', {
    version: SEED_DATA_VERSION,
    users: demoUsers.length,
    patients: demoPatients.length,
    tests: testCatalog.length,
    orders: demoOrders.length,
    samples: demoSamples.length,
    reports: demoReports.length,
    aliquots: demoAliquots.length,
  });
};

/**
 * Check if seed data exists and is up to date
 */
export const seedDataExists = (): boolean => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  const patientsJSON = localStorage.getItem(STORAGE_KEYS.PATIENTS);
  const versionString = localStorage.getItem('medlab_seed_version');

  if (users === null || patientsJSON === null) {
    return false;
  }

  // Check version
  try {
    const currentVersion = versionString ? parseInt(versionString, 10) : 0;
    if (currentVersion !== SEED_DATA_VERSION) {
      logger.info('Seed data version mismatch - reinitializing', {
        current: currentVersion,
        required: SEED_DATA_VERSION,
      });
      return false;
    }
  } catch {
    logger.warn('Invalid seed data version - reinitializing');
    return false;
  }

  try {
    // Check if we have enough patients (should be ~100)
    const patients = JSON.parse(patientsJSON);
    if (Array.isArray(patients) && patients.length < 50) {
      logger.info('Detected old seed data - reinitializing', { patientCount: patients.length });
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
