/**
 * Application Messages - Single Source of Truth
 * Toast notifications, alerts, and user-facing messages
 */

// ============================================
// TOAST MESSAGES
// ============================================

export const TOAST_MESSAGES = {
  // Success messages
  SUCCESS: {
    GENERIC: 'Operation completed successfully',
    SAVED: 'Changes saved successfully',
    CREATED: (entity: string) => `${entity} created successfully`,
    UPDATED: (entity: string) => `${entity} updated successfully`,
    DELETED: (entity: string) => `${entity} deleted successfully`,

    // Entity-specific
    PATIENT_REGISTERED: 'Patient registered successfully',
    PATIENT_UPDATED: 'Patient updated successfully',
    ORDER_CREATED: 'Order created successfully',
    ORDER_UPDATED: 'Order updated successfully',
    SAMPLE_COLLECTED: 'Sample collected successfully',
    RESULT_SAVED: 'Result saved successfully',
    RESULT_VALIDATED: 'Result validated successfully',
    PAYMENT_RECORDED: 'Payment recorded successfully',
    APPOINTMENT_SCHEDULED: 'Appointment scheduled successfully',
    REPORT_GENERATED: 'Report generated successfully',
    LABEL_PRINTED: 'Label sent to printer',
  },

  // Error messages
  ERROR: {
    GENERIC: 'An error occurred. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    NOT_FOUND: (entity: string) => `${entity} not found`,
    ALREADY_EXISTS: (entity: string) => `${entity} already exists`,
    VALIDATION: 'Please check the form for errors',

    // Entity-specific
    PATIENT_NOT_FOUND: 'Patient not found',
    ORDER_NOT_FOUND: 'Order not found',
    SAMPLE_NOT_COLLECTED: 'Sample has not been collected yet',
    INSUFFICIENT_VOLUME: 'Insufficient sample volume',
    INVALID_RESULT: 'Invalid result value',
    PAYMENT_FAILED: 'Payment processing failed',
  },

  // Warning messages
  WARNING: {
    UNSAVED_CHANGES: 'You have unsaved changes',
    CRITICAL_VALUE: 'Critical value detected - physician notification required',
    LOW_VOLUME: 'Sample volume is below optimal level',
    APPROACHING_DEADLINE: 'Approaching turnaround time deadline',
  },

  // Info messages
  INFO: {
    LOADING: 'Loading...',
    PROCESSING: 'Processing...',
    NO_RESULTS: 'No results found',
    NO_DATA: 'No data available',
  },
} as const;

// ============================================
// CONFIRMATION MESSAGES
// ============================================

export const CONFIRM_MESSAGES = {
  DELETE: {
    GENERIC: (entity: string) => `Are you sure you want to delete this ${entity}?`,
    PATIENT: 'Are you sure you want to delete this patient? This action cannot be undone.',
    ORDER: 'Are you sure you want to cancel this order?',
  },
  DISCARD: {
    CHANGES: 'Are you sure you want to discard your changes?',
  },
  LOGOUT: 'Are you sure you want to logout?',
} as const;

// ============================================
// EMPTY STATE MESSAGES
// ============================================

export const EMPTY_MESSAGES = {
  PATIENTS: 'No patients found',
  ORDERS: 'No orders found',
  SAMPLES: 'No samples pending collection',
  RESULTS: 'No results to validate',
  APPOINTMENTS: 'No appointments scheduled',
  REPORTS: 'No reports available',
} as const;
