/**
 * Appointments Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext } from 'react';
import type { Appointment } from '@/types';

/**
 * AppointmentsContext type definition
 */
export interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getAppointment: (id: string) => Appointment | undefined;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  getUpcomingAppointments: () => Appointment[];
  getTodayAppointments: () => Appointment[];
  checkInAppointment: (id: string) => void;
}

/**
 * React Context for Appointments
 */
export const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);
