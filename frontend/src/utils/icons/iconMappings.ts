/**
 * Icon Mappings - Complete icon definitions for consistent usage across the application
 *
 * This file provides a single source of truth for ALL icons used in the application.
 * Every icon usage should reference these mappings to ensure consistency.
 *
 * IMPORTANT: Priority, status, and sample type icons are the SAME for all values
 * within each category. This ensures consistency across all components.
 *
 * Usage:
 *   import { ICONS } from '@/utils';
 *   <Icon name={ICONS.priority} />
 *   <Icon name={ICONS.dataFields.user} />
 */

import type { IconName } from '@/shared/ui';

/**
 * Core category icons - same icon for all values in category
 */
export const ICONS = {
  // Priority, Status, Sample Type (same icon for all values)
  priority: 'warning' as IconName,
  orderStatus: 'info-circle' as IconName,
  sampleStatus: 'info-circle' as IconName,
  testStatus: 'info-circle' as IconName,
  paymentStatus: 'info-circle' as IconName,
  sampleType: 'lab-tube' as IconName,

  // Container types
  container: {
    tube: 'lab-tube' as IconName,
    cup: 'lab-cup' as IconName,
  },

  // Data fields - patient, order, sample information
  dataFields: {
    // Identifiers
    orderId: 'hashtag' as IconName,
    patientId: 'hashtag' as IconName,
    sampleId: 'hashtag' as IconName,
    testId: 'hashtag' as IconName,

    // Demographics
    user: 'user' as IconName,
    userHands: 'user-hands' as IconName,
    age: 'user-hands' as IconName,
    gender: 'user-hands' as IconName,
    dateOfBirth: 'calendar' as IconName,
    birthday: 'calendar' as IconName,

    // Contact
    phone: 'phone' as IconName,
    email: 'mail' as IconName,
    address: 'map' as IconName,
    mapPin: 'map-pin' as IconName,

    // Dates and time
    date: 'calendar' as IconName,
    orderDate: 'calendar' as IconName,
    time: 'clock' as IconName,
    hourglass: 'hourglass' as IconName,

    // Medical
    referringPhysician: 'stethoscope' as IconName,
    clinicalNotes: 'pen' as IconName,
    medicalKit: 'medical-kit' as IconName,
    health: 'health' as IconName,
    medicine: 'medicine' as IconName,
    stethoscope: 'stethoscope' as IconName,

    // Physical attributes
    height: 'ruler' as IconName,
    weight: 'weight' as IconName,
    temperature: 'thermometer' as IconName,
    thermometer: 'thermometer' as IconName,
    pulse: 'pulse' as IconName,
    heartPulse: 'heart-pulse' as IconName,
    blood: 'blood' as IconName,

    // Documents
    document: 'document' as IconName,
    documentMedicine: 'document-medicine' as IconName,
    pdf: 'pdf' as IconName,
    fileText: 'file-text' as IconName,

    // Payment
    wallet: 'wallet' as IconName,
    bill: 'bill' as IconName,
    dollarSign: 'dollar-sign' as IconName,
    cash: 'cash' as IconName,
    creditCard: 'credit-card' as IconName,
    trendingUp: 'trending-up' as IconName,

    // Lab
    flask: 'flask' as IconName,
    sampleCollection: 'sample-collection' as IconName,
    notebook: 'notebook' as IconName,
    checklist: 'checklist' as IconName,
  },

  // Actions - user interactions
  actions: {
    home: 'home' as IconName,
    // View/Read
    view: 'eye' as IconName,
    eye: 'eye' as IconName,

    // Edit/Write
    edit: 'pen' as IconName,
    pen: 'pen' as IconName,
    save: 'save' as IconName,

    // Add/Remove
    add: 'plus' as IconName,
    plus: 'plus' as IconName,
    remove: 'trash' as IconName,
    trash: 'trash' as IconName,
    delete: 'trash' as IconName,

    // Navigation
    chevronLeft: 'chevron-left' as IconName,
    chevronRight: 'chevron-right' as IconName,
    chevronDown: 'chevron-down' as IconName,
    chevronUp: 'chevron-up' as IconName,
    arrowLeft: 'arrow-left' as IconName,
    arrowRight: 'arrow-right' as IconName,
    arrowUp: 'arrow-up' as IconName,
    arrowDown: 'arrow-down' as IconName,

    // Status indicators
    check: 'check' as IconName,
    checkCircle: 'check-circle' as IconName,
    close: 'close' as IconName,
    closeCircle: 'close-circle' as IconName,
    cross: 'cross' as IconName,
    warning: 'warning' as IconName,
    alertCircle: 'alert-circle' as IconName,
    infoCircle: 'info-circle' as IconName,
    dangerSquare: 'danger-square' as IconName,

    // Loading/Processing
    loading: 'loading' as IconName,
    spinner: 'loading' as IconName,

    // Other actions
    search: 'search' as IconName,
    filter: 'filter' as IconName,
    download: 'download' as IconName,
    printer: 'printer' as IconName,
    menuDots: 'menu-dots' as IconName,
    logout: 'log-out' as IconName,
    doubleArrowLeft: 'double-arrow-left' as IconName,
    doubleArrowRight: 'double-arrow-right' as IconName,
  },

  // UI Elements
  ui: {
    // Navigation
    dashboard: 'dashboard' as IconName,
    category: 'category' as IconName,
    book: 'book' as IconName,
    appLogo: 'app-logo' as IconName,

    // Security
    shield: 'shield' as IconName,
    shieldCheck: 'shield-check' as IconName,
    lock: 'lock' as IconName,
    verified: 'verified' as IconName,

    // Groups
    usersGroup: 'users-group' as IconName,

    // Other UI
    link: 'link' as IconName,
    city: 'city' as IconName,
    smartphone: 'smartphone' as IconName,
  },

  // Medical history
  medicalHistory: {
    chronicCondition: 'info-circle' as IconName,
    medication: 'medicine' as IconName,
    surgery: 'health' as IconName,
    familyHistory: 'users-group' as IconName,
    allergy: 'alert-circle' as IconName,
  },

  // Landing page icons (for auth/login)
  landing: {
    dna: 'dna-landing-page' as IconName,
    atom: 'atom-landing-page' as IconName,
    beaker: 'beaker-landing-page' as IconName,
    bondMolecule: 'bond-molecule-landing-page' as IconName,
    dropsDroplet: 'drops-droplet-landing-page' as IconName,
    microscope: 'microscope-landing-page' as IconName,
    flaskChemical: 'flask-chemical-landing-page' as IconName,
    flaskEducation: 'flask-education-landing-page' as IconName,
    medicines: 'medicines-medicine-landing-page' as IconName,
    syringe: 'syringe-landing-page' as IconName,
    testTube: 'test-tube-landing-page' as IconName,
    thermometer: 'thermometer-landing-page' as IconName,
    vial: 'vial-landing-page' as IconName,
  },
} as const;

/**
 * Helper to get container icon based on type
 */
import type { ContainerType } from '@/types';

/**
 * Helper to get container icon based on type
 */
export const getContainerIcon = (type: ContainerType | string): IconName => {
  const lowerType = type.toLowerCase();
  const isCup = lowerType === 'cup' || lowerType.includes('cup') || lowerType.includes('stool');
  return isCup ? ICONS.container.cup : ICONS.container.tube;
};

/**
 * Legacy exports for backward compatibility
 * @deprecated Use ICONS object directly
 */
export const PRIORITY_ICON = ICONS.priority;
export const ORDER_STATUS_ICON = ICONS.orderStatus;
export const SAMPLE_STATUS_ICON = ICONS.sampleStatus;
export const TEST_STATUS_ICON = ICONS.testStatus;
export const PAYMENT_STATUS_ICON = ICONS.paymentStatus;
export const SAMPLE_TYPE_ICON = ICONS.sampleType;
