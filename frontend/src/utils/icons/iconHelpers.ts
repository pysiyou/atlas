/**
 * Icon Helpers - Utility functions for getting icons by type
 *
 * Provides helper functions to retrieve icons from the centralized ICONS mapping.
 * All icons should be accessed through these helpers to ensure consistency.
 *
 * IMPORTANT: Priority, status, and sample type helpers return the SAME icon
 * for all values within each category, ensuring consistency.
 *
 * Usage:
 *   import { getPriorityIcon, getDataFieldIcon } from '@/utils';
 *   <Icon name={getPriorityIcon()} />
 *   <Icon name={getDataFieldIcon('user')} />
 */

import type { IconName } from '@/shared/ui';
import { ICONS } from './iconMappings';

/**
 * Gets the icon for priority (same for all priority values)
 * @param _priority - Priority level (routine, urgent, stat) - value is ignored
 * @returns Icon name for priority
 */
export const getPriorityIcon = (_priority?: string): IconName => {
  return ICONS.priority;
};

/**
 * Gets the icon for order status (same for all order status values)
 * @param _status - Order status (ordered, in-progress, completed, cancelled) - value is ignored
 * @returns Icon name for order status
 */
export const getOrderStatusIcon = (_status?: string): IconName => {
  return ICONS.orderStatus;
};

/**
 * Gets the icon for sample status (same for all sample status values)
 * @param _status - Sample status (pending, collected, received, etc.) - value is ignored
 * @returns Icon name for sample status
 */
export const getSampleStatusIcon = (_status?: string): IconName => {
  return ICONS.sampleStatus;
};

/**
 * Gets the icon for test status (same for all test status values)
 * @param _status - Test status (pending, resulted, validated, etc.) - value is ignored
 * @returns Icon name for test status
 */
export const getTestStatusIcon = (_status?: string): IconName => {
  return ICONS.testStatus;
};

/**
 * Gets the icon for payment status (same for all payment status values)
 * @param _status - Payment status (paid, unpaid, partial) - value is ignored
 * @returns Icon name for payment status
 */
export const getPaymentStatusIcon = (_status?: string): IconName => {
  return ICONS.paymentStatus;
};

/**
 * Gets the icon for sample type (same for all sample type values)
 * @param _sampleType - Sample type (blood, urine, stool, etc.) - value is ignored
 * @returns Icon name for sample type
 */
export const getSampleTypeIcon = (_sampleType?: string): IconName => {
  return ICONS.sampleType;
};

/**
 * Gets the icon for a data field
 * @param field - Data field name (user, phone, email, date, etc.)
 * @returns Icon name for the field
 */
export const getDataFieldIcon = (field: string): IconName => {
  const fieldKey = field as keyof typeof ICONS.dataFields;
  return ICONS.dataFields[fieldKey] || ICONS.dataFields.user;
};

/**
 * Gets the icon for an action
 * @param action - Action name (view, edit, add, remove, etc.)
 * @returns Icon name for the action
 */
export const getActionIcon = (action: string): IconName => {
  const actionKey = action as keyof typeof ICONS.actions;
  return ICONS.actions[actionKey] || ICONS.actions.infoCircle;
};

/**
 * Gets the icon for a UI element
 * @param element - UI element name (dashboard, shield, etc.)
 * @returns Icon name for the UI element
 */
export const getUIIcon = (element: string): IconName => {
  const elementKey = element as keyof typeof ICONS.ui;
  return ICONS.ui[elementKey] || ICONS.ui.dashboard;
};

/**
 * Gets the icon for medical history field
 * @param field - Medical history field name
 * @returns Icon name for the field
 */
export const getMedicalHistoryIcon = (field: string): IconName => {
  const fieldKey = field as keyof typeof ICONS.medicalHistory;
  return ICONS.medicalHistory[fieldKey] || ICONS.medicalHistory.chronicCondition;
};

/**
 * Gets the icon for demographic field
 * @param field - Demographic field name (age, gender, dateOfBirth, birthday)
 * @returns Icon name for the field
 */
export const getDemographicIcon = (field: string): IconName => {
  return getDataFieldIcon(field);
};

/**
 * Generic status icon getter
 * Returns the same icon for all status values regardless of type
 * @param _status - Status value - value is ignored
 * @returns Icon name for status
 */
export const getStatusIcon = (_status?: string): IconName => {
  return ICONS.orderStatus; // Use order status icon as default for all statuses
};
