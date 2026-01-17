/**
 * Appointments Provider Component
 * Manages appointment scheduling and operations
 */

import React, { type ReactNode, useCallback, useState } from 'react';
import type { Appointment } from '@/types';
import { parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { AppointmentsContext, type AppointmentsContextType } from './AppointmentsContext';

interface AppointmentsProviderProps {
  children: ReactNode;
}

export const AppointmentsProvider: React.FC<AppointmentsProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  /**
   * Add a new appointment
   */
  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
  }, [setAppointments]);

  /**
   * Update an existing appointment
   */
  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(appointment => 
        appointment.id === id ? { ...appointment, ...updates } : appointment
      )
    );
  }, [setAppointments]);

  /**
   * Delete an appointment
   */
  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
  }, [setAppointments]);

  /**
   * Get an appointment by ID
   */
  const getAppointment = useCallback((id: string): Appointment | undefined => {
    return appointments.find(appointment => appointment.id === id);
  }, [appointments]);

  /**
   * Get appointments for a specific date
   */
  const getAppointmentsByDate = useCallback((date: string): Appointment[] => {
    const targetDate = parseISO(date);
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);
    
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.date);
      return isAfter(appointmentDate, start) && isBefore(appointmentDate, end);
    });
  }, [appointments]);

  /**
   * Get appointments by patient ID
   */
  const getAppointmentsByPatient = useCallback((patientId: string): Appointment[] => {
    return appointments.filter(appointment => appointment.patientId === patientId);
  }, [appointments]);

  /**
   * Get upcoming appointments
   */
  const getUpcomingAppointments = useCallback((): Appointment[] => {
    const now = new Date();
    return appointments
      .filter(appointment => {
        const appointmentDate = parseISO(appointment.date);
        return isAfter(appointmentDate, now) && appointment.status === 'scheduled';
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [appointments]);

  /**
   * Get today's appointments
   */
  const getTodayAppointments = useCallback((): Appointment[] => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.date);
      return isAfter(appointmentDate, start) && isBefore(appointmentDate, end);
    });
  }, [appointments]);

  /**
   * Check in an appointment
   */
  const checkInAppointment = useCallback((id: string) => {
    updateAppointment(id, {
      status: 'confirmed',
      checkedInAt: new Date().toISOString(),
    });
  }, [updateAppointment]);

  const value: AppointmentsContextType = {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointment,
    getAppointmentsByDate,
    getAppointmentsByPatient,
    getUpcomingAppointments,
    getTodayAppointments,
    checkInAppointment,
  };

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
};
