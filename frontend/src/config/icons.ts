/**
 * Icon Configuration
 * Single source of truth for all icon names used in the application.
 * Icons reference the IconName type from @/components/ui.
 */

import type { IconName } from '@/components/primitives';
import type { ContainerType } from '@/types';

export const ICONS = {
  priority: 'warning' as IconName,
  orderStatus: 'info-circle' as IconName,
  sampleStatus: 'info-circle' as IconName,
  testStatus: 'info-circle' as IconName,
  paymentStatus: 'info-circle' as IconName,
  sampleType: 'lab-tube' as IconName,

  container: {
    tube: 'lab-tube' as IconName,
    cup: 'lab-cup' as IconName,
  },

  dataFields: {
    orderId: 'hashtag' as IconName,
    patientId: 'hashtag' as IconName,
    sampleId: 'hashtag' as IconName,
    testId: 'hashtag' as IconName,
    user: 'user' as IconName,
    userHands: 'user-hands' as IconName,
    age: 'user-hands' as IconName,
    gender: 'user-hands' as IconName,
    dateOfBirth: 'calendar' as IconName,
    birthday: 'calendar' as IconName,
    phone: 'phone' as IconName,
    email: 'sms' as IconName,
    sms: 'sms' as IconName,
    address: 'location' as IconName,
    mapPin: 'location' as IconName,
    location: 'location' as IconName,
    date: 'calendar' as IconName,
    orderDate: 'calendar' as IconName,
    time: 'clock' as IconName,
    hourglass: 'hourglass' as IconName,
    referentDoctor: 'stethoscope' as IconName,
    clinicalNotes: 'edit' as IconName,
    medicalKit: 'medical-kit' as IconName,
    health: 'health' as IconName,
    medicine: 'medicine' as IconName,
    stethoscope: 'stethoscope' as IconName,
    height: 'ruler' as IconName,
    weight: 'weight' as IconName,
    temperature: 'thermometer' as IconName,
    thermometer: 'thermometer' as IconName,
    pulse: 'pulse' as IconName,
    heartPulse: 'heart-pulse' as IconName,
    blood: 'blood' as IconName,
    document: 'document' as IconName,
    documentMedicine: 'document' as IconName,
    pdf: 'pdf' as IconName,
    fileText: 'document' as IconName,
    wallet: 'wallet' as IconName,
    bill: 'bill' as IconName,
    receipt: 'receipt' as IconName,
    dollarSign: 'cash' as IconName,
    cash: 'cash' as IconName,
    creditCard: 'wallet' as IconName,
    trendingUp: 'trending-up' as IconName,
    flask: 'flask' as IconName,
    sampleCollection: 'sample-collection' as IconName,
    notebook: 'notebook' as IconName,
    checklist: 'checklist' as IconName,
    clock: 'clock' as IconName,
  },

  actions: {
    home: 'home' as IconName,
    view: 'eye' as IconName,
    eye: 'eye' as IconName,
    edit: 'edit' as IconName,
    save: 'save' as IconName,
    add: 'add-circle' as IconName,
    plus: 'add-circle' as IconName,
    addCircle: 'add-circle' as IconName,
    remove: 'trash' as IconName,
    trash: 'trash' as IconName,
    delete: 'trash' as IconName,
    chevronLeft: 'arrow-left' as IconName,
    chevronRight: 'arrow-right' as IconName,
    chevronDown: 'arrow-bottom' as IconName,
    chevronUp: 'arrow-up' as IconName,
    arrowLeft: 'arrow-left' as IconName,
    arrowRight: 'arrow-right' as IconName,
    arrowUp: 'arrow-up' as IconName,
    arrowDown: 'arrow-bottom' as IconName,
    check: 'check' as IconName,
    checkCircle: 'check-circle' as IconName,
    like: 'like' as IconName,
    dislike: 'dislike' as IconName,
    close: 'close' as IconName,
    warning: 'warning' as IconName,
    alertCircle: 'alert-circle' as IconName,
    alertTriangle: 'warning' as IconName,
    infoCircle: 'info-circle' as IconName,
    dangerSquare: 'warning' as IconName,
    loading: 'loading' as IconName,
    spinner: 'loading' as IconName,
    refresh: 'refresh' as IconName,
    search: 'search' as IconName,
    filter: 'search' as IconName,
    filterSearch: 'search' as IconName,
    download: 'download' as IconName,
    printer: 'printer' as IconName,
    menuDots: 'menu-dots' as IconName,
    logout: 'log-out' as IconName,
    doubleArrowLeft: 'double-arrow-left' as IconName,
    doubleArrowRight: 'double-arrow-right' as IconName,
  },

  status: {
    checkCircle: 'check-circle' as IconName,
    warning: 'warning' as IconName,
    alertCircle: 'alert-circle' as IconName,
  },

  lab: {
    sampleTube: 'lab-tube' as IconName,
    flask: 'flask' as IconName,
  },

  ui: {
    dashboard: 'dashboard' as IconName,
    category: 'category' as IconName,
    book: 'book' as IconName,
    appLogo: 'app-logo' as IconName,
    shield: 'shield-check' as IconName,
    shieldCheck: 'shield-check' as IconName,
    lock: 'lock' as IconName,
    verified: 'verified' as IconName,
    usersGroup: 'users-group' as IconName,
    link: 'link' as IconName,
    city: 'city' as IconName,
    smartphone: 'smartphone' as IconName,
  },

  medicalHistory: {
    chronicCondition: 'info-circle' as IconName,
    medication: 'medicine' as IconName,
    surgery: 'health' as IconName,
    familyHistory: 'users-group' as IconName,
    allergy: 'alert-circle' as IconName,
  },

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

export const getContainerIcon = (type: ContainerType | string): IconName => {
  const lowerType = type.toLowerCase();
  const isCup = lowerType === 'cup' || lowerType.includes('cup') || lowerType.includes('stool');
  return isCup ? ICONS.container.cup : ICONS.container.tube;
};

export const getPriorityIcon = (_priority?: string): IconName => ICONS.priority;
export const getOrderStatusIcon = (_status?: string): IconName => ICONS.orderStatus;
export const getSampleStatusIcon = (_status?: string): IconName => ICONS.sampleStatus;
export const getDataFieldIcon = (field: string): IconName => {
  const fieldKey = field as keyof typeof ICONS.dataFields;
  return ICONS.dataFields[fieldKey] || ICONS.dataFields.user;
};

/** Sidebar module icons — shared by navigation and modal/popover footers */
export const MODULE_ICONS = {
  dashboard: 'dashboard' as IconName,
  patients: 'profile' as IconName,
  orders: 'receipt' as IconName,
  laboratory: 'flask-bold' as IconName,
  labTests: 'note' as IconName,
  payments: 'wallet' as IconName,
  reports: 'document' as IconName,
  catalog: 'book' as IconName,
  eventLog: 'activity' as IconName,
  users: 'user-cog' as IconName,
} as const;

