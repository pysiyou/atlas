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
  id: string; // APT-YYYYMMDD-XXX
  patientId: string;
  patientName: string;
  type: AppointmentType;
  date: string;
  time: string;
  duration: number; // in minutes
  purpose?: string;
  notes?: string;
  status: AppointmentStatus;
  reminderPreference: ReminderPreference;
  createdBy: string;
  createdAt: string;
  checkedInAt?: string;
}
