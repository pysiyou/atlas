/**
 * Enums Index - Central export for all enum types and their configurations
 *
 * This is the SINGLE SOURCE OF TRUTH for all enum-like values in the application.
 * When you need to add or modify an enum value:
 * 1. Find the corresponding file in this directory
 * 2. Modify the *_VALUES array
 * 3. Update the *_CONFIG object if needed
 * 4. All derived arrays (OPTIONS, FILTER_OPTIONS, etc.) update automatically
 */

// Order Status
export {
  ORDER_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_STATUS_TIMELINE,
  type OrderStatus,
} from './order-status';

// Test Status
export {
  TEST_STATUS_VALUES,
  TEST_STATUS_CONFIG,
  TEST_STATUS_OPTIONS,
  TEST_STATUS_FILTER_OPTIONS,
  type TestStatus,
} from './test-status';

// Payment Status
export {
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_FILTER_OPTIONS,
  type PaymentStatus,
} from './payment-status';

// Priority Level
export {
  PRIORITY_LEVEL_VALUES,
  PRIORITY_LEVEL_CONFIG,
  PRIORITY_LEVEL_OPTIONS,
  PRIORITY_LEVEL_FILTER_OPTIONS,
  type PriorityLevel,
} from './priority-level';

// Gender
export {
  GENDER_VALUES,
  GENDER_CONFIG,
  GENDER_OPTIONS,
  GENDER_FILTER_OPTIONS,
  type Gender,
} from './gender';

// Sample Status
export {
  SAMPLE_STATUS_VALUES,
  SAMPLE_STATUS_CONFIG,
  SAMPLE_STATUS_OPTIONS,
  SAMPLE_STATUS_FILTER_OPTIONS,
  type SampleStatus,
} from './sample-status';

// Sample Type
export {
  SAMPLE_TYPE_VALUES,
  SAMPLE_TYPE_CONFIG,
  SAMPLE_TYPE_OPTIONS,
  SAMPLE_TYPE_FILTER_OPTIONS,
  BASE_SAMPLE_TYPES,
  DERIVED_SAMPLE_TYPES,
  type SampleType,
} from './sample-type';

// Container Type & Color
export {
  CONTAINER_TYPE_VALUES,
  CONTAINER_TYPE_CONFIG,
  CONTAINER_TYPE_OPTIONS,
  CONTAINER_COLOR_VALUES,
  CONTAINER_COLOR_CONFIG,
  CONTAINER_COLOR_OPTIONS,
  type ContainerType,
  type ContainerTopColor,
} from './container';

// Rejection Reason
export {
  REJECTION_REASON_VALUES,
  REJECTION_REASON_CONFIG,
  REJECTION_REASON_OPTIONS,
  type RejectionReason,
} from './rejection-reason';

// Affiliation Duration
export {
  AFFILIATION_DURATION_VALUES,
  AFFILIATION_DURATION_CONFIG,
  AFFILIATION_DURATION_OPTIONS,
  type AffiliationDuration,
} from './affiliation-duration';

// User Role
export {
  USER_ROLE_VALUES,
  USER_ROLE_CONFIG,
  USER_ROLE_OPTIONS,
  ALL_ROLES,
  type UserRole,
} from './user-role';

// Relationship (Emergency Contact)
export {
  RELATIONSHIP_VALUES,
  RELATIONSHIP_CONFIG,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_FILTER_OPTIONS,
  type Relationship,
} from './relationship';
