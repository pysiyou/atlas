/**
 * Consolidated Enums - Single Source of Truth
 * 
 * All application enums consolidated into one file for easier discovery and maintenance.
 * Each enum follows the pattern: VALUES → TYPE → CONFIG → OPTIONS → FILTER_OPTIONS
 * 
 * Note: Badge colors are defined in the Badge component.
 * Use enum values directly as Badge variants (e.g., variant="pending").
 */

// ============================================================================
// AFFILIATION DURATION
// ============================================================================

// Duration in months (999 = lifetime)
export const AFFILIATION_DURATION_VALUES = [1, 3, 6, 12, 999] as const;

export type AffiliationDuration = (typeof AFFILIATION_DURATION_VALUES)[number];

export const AFFILIATION_DURATION_CONFIG: Record<
  AffiliationDuration,
  { label: string }
> = {
  1: { label: '1 Month' },
  3: { label: '3 Months' },
  6: { label: '6 Months' },
  12: { label: '1 Year' },
  999: { label: 'Lifetime' },
};

export const AFFILIATION_DURATION_OPTIONS = AFFILIATION_DURATION_VALUES.map(value => ({
  value,
  label: AFFILIATION_DURATION_CONFIG[value].label,
}));

// ============================================================================
// ALIQUOT STATUS
// ============================================================================

export const ALIQUOT_STATUS_VALUES = [
  'pending',
  'created',
  'in-use',
  'stored',
  'disposed',
  'depleted',
] as const;

export type AliquotStatus = (typeof ALIQUOT_STATUS_VALUES)[number];

export const ALIQUOT_STATUS_CONFIG: Record<AliquotStatus, { label: string }> = {
  pending: { label: 'Pending' },
  created: { label: 'Created' },
  'in-use': { label: 'In Use' },
  stored: { label: 'Stored' },
  disposed: { label: 'Disposed' },
  depleted: { label: 'Depleted' },
};

export const ALIQUOT_STATUS_OPTIONS = ALIQUOT_STATUS_VALUES.map(value => ({
  value,
  label: ALIQUOT_STATUS_CONFIG[value].label,
}));

// ============================================================================
// APPOINTMENT STATUS
// ============================================================================

export const APPOINTMENT_STATUS_VALUES = [
  'scheduled',
  'confirmed',
  'checked-in',
  'completed',
  'cancelled',
  'no-show',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { label: string }> = {
  scheduled: { label: 'Scheduled' },
  confirmed: { label: 'Confirmed' },
  'checked-in': { label: 'Checked In' },
  completed: { label: 'Completed' },
  cancelled: { label: 'Cancelled' },
  'no-show': { label: 'No Show' },
};

export const APPOINTMENT_STATUS_OPTIONS = APPOINTMENT_STATUS_VALUES.map(value => ({
  value,
  label: APPOINTMENT_STATUS_CONFIG[value].label,
}));

export const APPOINTMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...APPOINTMENT_STATUS_OPTIONS,
];

// ============================================================================
// APPOINTMENT TYPE
// ============================================================================

export const APPOINTMENT_TYPE_VALUES = [
  'walk-in',
  'scheduled',
  'follow-up',
  'urgent',
  'routine-checkup',
] as const;

export type AppointmentType = (typeof APPOINTMENT_TYPE_VALUES)[number];

export const APPOINTMENT_TYPE_CONFIG: Record<
  AppointmentType,
  { label: string; description: string }
> = {
  'walk-in': { label: 'Walk-in', description: 'Patient arrived without appointment' },
  scheduled: { label: 'Scheduled', description: 'Pre-scheduled appointment' },
  'follow-up': { label: 'Follow-up', description: 'Follow-up visit' },
  urgent: { label: 'Urgent', description: 'Urgent care needed' },
  'routine-checkup': { label: 'Routine Checkup', description: 'Regular health checkup' },
};

export const APPOINTMENT_TYPE_OPTIONS = APPOINTMENT_TYPE_VALUES.map(value => ({
  value,
  label: APPOINTMENT_TYPE_CONFIG[value].label,
}));

export const APPOINTMENT_TYPE_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Types' },
  ...APPOINTMENT_TYPE_OPTIONS,
];

// ============================================================================
// CONTAINER
// ============================================================================

export const CONTAINER_VALUES = [
  'red-top',
  'lavender-top',
  'green-top',
  'blue-top',
  'yellow-top',
  'gray-top',
  'light-blue-top',
  'pink-top',
  'black-top',
  'orange-top',
  'royal-blue-top',
  'white-top',
  'tan-top',
  'urine-cup',
  'stool-container',
  'swab-tube',
  'gold-top',
  'tiger-top',
  'clear-top',
  'cup',
  'tube',
  'other',
] as const;

export type Container = (typeof CONTAINER_VALUES)[number];

export const CONTAINER_CONFIG: Record<
  ContainerType,
  {
    label: string;
    additive?: string;
    commonUses: string;
    textClass?: string;
  }
> = {
  'red-top': {
    label: 'Red Top',
    additive: 'None',
    commonUses: 'Serum chemistry, serology, immunology',
    textClass: 'text-red-600',
  },
  'lavender-top': {
    label: 'Lavender Top',
    additive: 'EDTA',
    commonUses: 'CBC, blood typing',
    textClass: 'text-purple-600',
  },
  'green-top': { label: 'Green Top', additive: 'Heparin', commonUses: 'Plasma chemistry', textClass: 'text-green-600' },
  'blue-top': {
    label: 'Blue Top',
    additive: 'Sodium citrate',
    commonUses: 'Coagulation tests',
    textClass: 'text-blue-600',
  },
  'yellow-top': { label: 'Yellow Top', additive: 'ACD', commonUses: 'Blood bank, HLA typing', textClass: 'text-yellow-600' },
  'gray-top': {
    label: 'Gray Top',
    additive: 'Sodium fluoride',
    commonUses: 'Glucose, lactate',
    textClass: 'text-gray-600',
  },
  'light-blue-top': {
    label: 'Light Blue Top',
    additive: 'Sodium citrate',
    commonUses: 'Coagulation',
    textClass: 'text-sky-400',
  },
  'pink-top': { label: 'Pink Top', additive: 'EDTA', commonUses: 'Blood bank', textClass: 'text-pink-400' },
  'black-top': {
    label: 'Black Top',
    additive: 'Sodium citrate',
    commonUses: 'ESR',
    textClass: 'text-gray-900',
  },
  'orange-top': { label: 'Orange Top', additive: 'Thrombin', commonUses: 'STAT serum chemistry', textClass: 'text-orange-500' },
  'royal-blue-top': {
    label: 'Royal Blue Top',
    additive: 'None / EDTA / Heparin',
    commonUses: 'Trace elements, toxicology',
    textClass: 'text-blue-800',
  },
  'white-top': { label: 'White Top', additive: 'EDTA with gel', commonUses: 'Molecular diagnostics', textClass: 'text-gray-400' },
  'tan-top': { label: 'Tan Top', additive: 'EDTA', commonUses: 'Lead testing', textClass: 'text-amber-600' },
  'urine-cup': { label: 'Urine Cup', commonUses: 'Urinalysis', textClass: 'text-yellow-500' },
  'stool-container': { label: 'Stool Container', commonUses: 'Stool analysis', textClass: 'text-amber-800' },
  'swab-tube': { label: 'Swab Tube', commonUses: 'Microbiology cultures', textClass: 'text-teal-600' },
  'gold-top': { label: 'Gold Top', additive: 'Clot activator', commonUses: 'Serum separator', textClass: 'text-yellow-500' },
  'tiger-top': {
    label: 'Tiger Top',
    additive: 'Clot activator',
    commonUses: 'Serum separator',
    textClass: 'text-orange-800', // Approximation
  },
  'clear-top': { label: 'Clear Top', additive: 'None', commonUses: 'Discard tube', textClass: 'text-gray-300' },
  cup: { label: 'Cup', additive: 'None', commonUses: 'Urine, stool', textClass: 'text-amber-700' },
  tube: { label: 'Tube', additive: 'Various', commonUses: 'General collection', textClass: 'text-gray-500' },
  other: { label: 'Other', additive: 'Various', commonUses: 'Miscellaneous', textClass: 'text-gray-500' },
};

export const CONTAINER_OPTIONS = CONTAINER_VALUES.map(value => ({
  value,
  label: CONTAINER_CONFIG[value].label,
}));

export const CONTAINER_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Containers' },
  ...CONTAINER_OPTIONS,
];

// Type aliases for backwards compatibility
export type ContainerType = Container;
export type ContainerTopColor = Container;

// VALUES exports for backwards compatibility
export const CONTAINER_TYPE_VALUES = CONTAINER_VALUES;
export const CONTAINER_COLOR_VALUES = CONTAINER_VALUES;
export const CONTAINER_COLOR_CONFIG = CONTAINER_CONFIG;

// OPTIONS exports for backwards compatibility
export const CONTAINER_TYPE_OPTIONS = CONTAINER_OPTIONS;
export const CONTAINER_COLOR_OPTIONS = CONTAINER_OPTIONS;


// ============================================================================
// GENDER
// ============================================================================

export const GENDER_VALUES = ['male', 'female'] as const;

export type Gender = (typeof GENDER_VALUES)[number];

export const GENDER_CONFIG: Record<Gender, { label: string; icon?: string }> = {
  male: { label: 'Male', icon: '♂' },
  female: { label: 'Female', icon: '♀' },
};

export const GENDER_OPTIONS = GENDER_VALUES.map(value => ({
  value,
  label: GENDER_CONFIG[value].label,
}));

export const GENDER_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Genders' },
  ...GENDER_OPTIONS,
];

// ============================================================================
// ORDER STATUS
// ============================================================================

export const ORDER_STATUS_VALUES = ['ordered', 'in-progress', 'completed', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string }> = {
  ordered: { label: 'Ordered' },
  'in-progress': { label: 'In Progress' },
  completed: { label: 'Completed' },
  cancelled: { label: 'Cancelled' },
};

export const ORDER_STATUS_OPTIONS = ORDER_STATUS_VALUES.map(value => ({
  value,
  label: ORDER_STATUS_CONFIG[value].label,
}));

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...ORDER_STATUS_OPTIONS,
];

export const ORDER_STATUS_TIMELINE = ORDER_STATUS_VALUES.map(status => ({
  status,
  label: ORDER_STATUS_CONFIG[status].label,
}));

// ============================================================================
// PAYMENT STATUS
// ============================================================================

export const PAYMENT_STATUS_VALUES = [
  'unpaid',
  'pending',
  'partial',
  'paid',
  'refunded',
  'cancelled',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string }> = {
  unpaid: { label: 'Unpaid' },
  pending: { label: 'Pending' },
  partial: { label: 'Partial' },
  paid: { label: 'Paid' },
  refunded: { label: 'Refunded' },
  cancelled: { label: 'Cancelled' },
};

export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_VALUES.map(value => ({
  value,
  label: PAYMENT_STATUS_CONFIG[value].label,
}));

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...PAYMENT_STATUS_OPTIONS,
];

// ============================================================================
// PRIORITY LEVEL
// ============================================================================

export const PRIORITY_LEVEL_VALUES = ['low', 'medium', 'high', 'urgent'] as const;

export type PriorityLevel = (typeof PRIORITY_LEVEL_VALUES)[number];

export const PRIORITY_LEVEL_CONFIG: Record<
  PriorityLevel,
  { label: string; turnaroundHours: number }
> = {
  low: { label: 'Low', turnaroundHours: 48 },
  medium: { label: 'Medium', turnaroundHours: 24 },
  high: { label: 'High', turnaroundHours: 4 },
  urgent: { label: 'Urgent', turnaroundHours: 1 },
};

export const PRIORITY_LEVEL_OPTIONS = PRIORITY_LEVEL_VALUES.map(value => ({
  value,
  label: PRIORITY_LEVEL_CONFIG[value].label,
}));

export const PRIORITY_LEVEL_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Priorities' },
  ...PRIORITY_LEVEL_OPTIONS,
];

// ============================================================================
// REJECTION REASON
// ============================================================================

export const REJECTION_REASON_VALUES = [
  'insufficient-volume',
  'hemolyzed',
  'clotted',
  'contaminated',
  'mislabeled',
  'expired',
  'wrong-container',
  'damaged-container',
  'incorrect-storage',
  'other',
] as const;

export type RejectionReason = (typeof REJECTION_REASON_VALUES)[number];

export const REJECTION_REASON_CONFIG: Record<RejectionReason, { label: string }> = {
  'insufficient-volume': { label: 'Insufficient Volume' },
  hemolyzed: { label: 'Hemolyzed' },
  clotted: { label: 'Clotted' },
  contaminated: { label: 'Contaminated' },
  mislabeled: { label: 'Mislabeled' },
  expired: { label: 'Expired' },
  'wrong-container': { label: 'Wrong Container' },
  'damaged-container': { label: 'Damaged Container' },
  'incorrect-storage': { label: 'Incorrect Storage' },
  other: { label: 'Other' },
};

export const REJECTION_REASON_OPTIONS = REJECTION_REASON_VALUES.map(value => ({
  value,
  label: REJECTION_REASON_CONFIG[value].label,
}));

// ============================================================================
// RELATIONSHIP
// ============================================================================

export const RELATIONSHIP_VALUES = [
  'self',
  'spouse',
  'child',
  'parent',
  'sibling',
  'grandparent',
  'grandchild',
  'other-relative',
  'guardian',
  'friend',
  'other',
] as const;

export type Relationship = (typeof RELATIONSHIP_VALUES)[number];

export const RELATIONSHIP_CONFIG: Record<Relationship, { label: string }> = {
  self: { label: 'Self' },
  spouse: { label: 'Spouse' },
  child: { label: 'Child' },
  parent: { label: 'Parent' },
  sibling: { label: 'Sibling' },
  grandparent: { label: 'Grandparent' },
  grandchild: { label: 'Grandchild' },
  'other-relative': { label: 'Other Relative' },
  guardian: { label: 'Guardian' },
  friend: { label: 'Friend' },
  other: { label: 'Other' },
};

export const RELATIONSHIP_OPTIONS = RELATIONSHIP_VALUES.map(value => ({
  value,
  label: RELATIONSHIP_CONFIG[value].label,
}));

export const RELATIONSHIP_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Relationships' },
  ...RELATIONSHIP_OPTIONS,
];

// ============================================================================
// RESULT STATUS
// ============================================================================

export const RESULT_STATUS_VALUES = [
  'normal',
  'high',
  'low',
  'critical',
  'critical-high',
  'critical-low',
] as const;

export type ResultStatus = (typeof RESULT_STATUS_VALUES)[number];

export const RESULT_STATUS_CONFIG: Record<ResultStatus, { label: string }> = {
  normal: { label: 'Normal' },
  high: { label: 'High' },
  low: { label: 'Low' },
  critical: { label: 'Critical' },
  'critical-high': { label: 'Critical High' },
  'critical-low': { label: 'Critical Low' },
};

export const RESULT_STATUS_OPTIONS = RESULT_STATUS_VALUES.map(value => ({
  value,
  label: RESULT_STATUS_CONFIG[value].label,
}));

// ============================================================================
// SAMPLE STATUS
// ============================================================================

export const SAMPLE_STATUS_VALUES = [
  'pending',
  'collected',
  'received',
  'accessioned',
  'in-progress',
  'completed',
  'stored',
  'disposed',
  'rejected',
] as const;

export type SampleStatus = (typeof SAMPLE_STATUS_VALUES)[number];

export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string }> = {
  pending: { label: 'Pending' },
  collected: { label: 'Collected' },
  received: { label: 'Received' },
  accessioned: { label: 'Accessioned' },
  'in-progress': { label: 'In Progress' },
  completed: { label: 'Completed' },
  stored: { label: 'Stored' },
  disposed: { label: 'Disposed' },
  rejected: { label: 'Rejected' },
};

export const SAMPLE_STATUS_OPTIONS = SAMPLE_STATUS_VALUES.map(value => ({
  value,
  label: SAMPLE_STATUS_CONFIG[value].label,
}));

export const SAMPLE_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...SAMPLE_STATUS_OPTIONS,
];

// ============================================================================
// SAMPLE TYPE
// ============================================================================

export const SAMPLE_TYPE_VALUES = [
  'blood',
  'urine',
  'stool',
  'swab',
  'tissue',
  'csf',
  'sputum',
  'plasma',
  'serum',
  'other',
] as const;

export type SampleType = (typeof SAMPLE_TYPE_VALUES)[number];

export const SAMPLE_TYPE_CONFIG: Record<
  SampleType,
  { label: string; isDerived: boolean; collectionSource?: SampleType }
> = {
  blood: { label: 'Blood', isDerived: false },
  urine: { label: 'Urine', isDerived: false },
  stool: { label: 'Stool', isDerived: false },
  swab: { label: 'Swab', isDerived: false },
  tissue: { label: 'Tissue', isDerived: false },
  csf: { label: 'CSF', isDerived: false },
  sputum: { label: 'Sputum', isDerived: false },
  plasma: { label: 'Plasma', isDerived: true, collectionSource: 'blood' },
  serum: { label: 'Serum', isDerived: true, collectionSource: 'blood' },
  other: { label: 'Other', isDerived: false },
};

export const SAMPLE_TYPE_OPTIONS = SAMPLE_TYPE_VALUES.map(value => ({
  value,
  label: SAMPLE_TYPE_CONFIG[value].label,
}));

export const SAMPLE_TYPE_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Sample Types' },
  ...SAMPLE_TYPE_OPTIONS,
];

export const BASE_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => !SAMPLE_TYPE_CONFIG[type].isDerived
);

export const DERIVED_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => SAMPLE_TYPE_CONFIG[type].isDerived
);

// ============================================================================
// TEST STATUS
// ============================================================================

export const TEST_STATUS_VALUES = [
  'pending',
  'sample-collected',
  'in-progress',
  'resulted', // Results entered, awaiting validation
  'validated',
  'rejected',
  'escalated', // Escalated for review; not yet handled in UI workflow
  'superseded', // Original test after retest is created during result validation rejection
  'removed', // Test removed from order during edit (hidden from UI but preserved for audit)
] as const;

export type TestStatus = (typeof TEST_STATUS_VALUES)[number];

export const TEST_STATUS_CONFIG: Record<TestStatus, { label: string }> = {
  pending: { label: 'Pending' },
  'sample-collected': { label: 'Sample Collected' },
  'in-progress': { label: 'In Progress' },
  resulted: { label: 'Resulted' },
  validated: { label: 'Validated' },
  rejected: { label: 'Rejected' },
  escalated: { label: 'Escalated' },
  superseded: { label: 'Superseded' },
  removed: { label: 'Removed' },
};

export const TEST_STATUS_OPTIONS = TEST_STATUS_VALUES.map(value => ({
  value,
  label: TEST_STATUS_CONFIG[value].label,
}));

export const TEST_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...TEST_STATUS_OPTIONS,
];

// ============================================================================
// USER ROLE
// ============================================================================

export const USER_ROLE_VALUES = [
  'administrator',
  'receptionist',
  'lab-technician',
  'lab-technician-plus',
] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  administrator: {
    label: 'Administrator',
    description: 'Full system access',
  },
  receptionist: {
    label: 'Receptionist',
    description: 'Front desk and patient registration',
  },
  'lab-technician': {
    label: 'Lab Technician',
    description: 'Sample collection and processing',
  },
  'lab-technician-plus': {
    label: 'Lab Tech Plus',
    description: 'Extended lab access including result validation',
  },
};

export const USER_ROLE_OPTIONS = USER_ROLE_VALUES.map(value => ({
  value,
  label: USER_ROLE_CONFIG[value].label,
}));

export const ALL_ROLES = [...USER_ROLE_VALUES] as UserRole[];

// ============================================================================
// VALIDATION DECISION
// ============================================================================

export const VALIDATION_DECISION_VALUES = ['approved', 'rejected', 'repeat-required'] as const;

export type ValidationDecision = (typeof VALIDATION_DECISION_VALUES)[number];

export const VALIDATION_DECISION_CONFIG: Record<ValidationDecision, { label: string }> = {
  approved: { label: 'Approved' },
  rejected: { label: 'Rejected' },
  'repeat-required': { label: 'Repeat Required' },
};

export const VALIDATION_DECISION_OPTIONS = VALIDATION_DECISION_VALUES.map(value => ({
  value,
  label: VALIDATION_DECISION_CONFIG[value].label,
}));
