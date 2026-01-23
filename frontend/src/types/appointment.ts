/**
 * Appointment Scheduling Types
 */

export type AppointmentType = 
  | 'sample-collection' 
  | 'consultation' 
  | 'result-discussion';

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show';

export type ReminderPreference = 'sms' | 'email' | 'none';

export interface Appointment {
  id: number; // Integer ID, displayed as APT{id}
  patientId: number;
  patientName: string;
  type: AppointmentType;
  date: string;
  time: string;
  duration: number; // in minutes
  purpose?: string;
  notes?: string;
  status: AppointmentStatus;
  reminderPreference: ReminderPreference;
  createdBy: number;
  createdAt: string;
  checkedInAt?: string;
}
