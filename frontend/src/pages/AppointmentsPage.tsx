/**
 * Appointments Page
 * Appointment scheduling and management
 */

import React from 'react';
import { useAppointments } from '@/features/appointment/useAppointments';
import { SectionContainer, Badge } from '@/shared/ui';
import { formatDate } from '@/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

export const Appointments: React.FC = () => {
  const appointmentsContext = useAppointments();

  if (!appointmentsContext) return <div>Loading...</div>;

  const { getTodayAppointments, getUpcomingAppointments } = appointmentsContext;

  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionContainer title={`Today's Appointments (${todayAppointments.length})`}>
          {todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map(appointment => (
                <div key={appointment.id} className="flex items-start justify-between p-3 border border-gray-200 rounded">
                  <div>
                    <div className="font-medium">{appointment.patientName}</div>
                    <div className="text-sm text-gray-600">{appointment.time} • {appointment.type}</div>
                    {appointment.purpose && <div className="text-sm text-gray-500">{appointment.purpose}</div>}
                  </div>
                  <Badge variant={appointment.status} size="sm">
                    {appointment.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p>No appointments today</p>
            </div>
          )}
        </SectionContainer>

        <SectionContainer title="Upcoming Appointments">
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map(appointment => (
                <div key={appointment.id} className="flex items-start justify-between p-3 border border-gray-200 rounded">
                  <div>
                    <div className="font-medium">{appointment.patientName}</div>
                    <div className="text-sm text-gray-600">{formatDate(appointment.date)} • {appointment.time}</div>
                    <div className="text-sm text-gray-500">{appointment.type}</div>
                  </div>
                  <Badge variant={appointment.status} size="sm">
                    {appointment.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No upcoming appointments</p>
            </div>
          )}
        </SectionContainer>
      </div>
    </div>
  );
};
