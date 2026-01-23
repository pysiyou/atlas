/**
 * Appointments Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext, useContext } from 'react';
import type { Appointment } from '@/types';

/**
 * Error state for appointment operations
 */
export interface AppointmentError {
  message: string;
  code?: string;
  operation?: 'load' | 'create' | 'update' | 'delete';
}

/**
 * AppointmentsContext type definition
 */
export interface AppointmentsContextType {
  /** List of all appointments */
  appointments: Appointment[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: AppointmentError | null;
  /** Add a new appointment */
  addAppointment: (appointment: Appointment) => void;
  /** Update an existing appointment */
  updateAppointment: (id: number | string, updates: Partial<Appointment>) => void;
  /** Delete an appointment */
  deleteAppointment: (id: number | string) => void;
  /** Get an appointment by ID */
  getAppointment: (id: number | string) => Appointment | undefined;
  /** Get appointments for a specific date */
  getAppointmentsByDate: (date: string) => Appointment[];
  /** Get appointments by patient ID */
  getAppointmentsByPatient: (patientId: number | string) => Appointment[];
  /** Get upcoming appointments */
  getUpcomingAppointments: () => Appointment[];
  /** Get today's appointments */
  getTodayAppointments: () => Appointment[];
  /** Check in an appointment */
  checkInAppointment: (id: number | string) => void;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * React Context for Appointments
 */
export const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

/**
 * Hook to access the Appointments context
 * @throws Error if used outside of AppointmentsProvider
 */
export function useAppointments(): AppointmentsContextType {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}
