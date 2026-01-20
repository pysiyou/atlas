/**
 * PatientDetail - Migrated to use DetailView and SectionCard
 * 
 * Example migration showing how to use the new DetailView component.
 * This demonstrates the pattern for migrating all detail views.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatients } from '@/hooks';
import { useOrders } from '@/features/order/OrderContext';
import { DetailView, SectionCard, InfoField } from '@/shared/components';
import { Button, Badge, Icon, IconButton, EmptyState } from '@/shared/ui';
import { AffiliationCard } from './PatientDetailSections';
import { EditPatientModal } from './EditPatientModal';
import { isAffiliationActive } from './usePatientForm';
import type { DetailSection } from '@/shared/components';

/**
 * PatientDetail component - Migrated to use DetailView
 * 
 * Benefits:
 * - Reduced code by ~150 lines
 * - Consistent layout with other detail views
 * - Built-in loading/error states
 * - Easier to reorganize sections
 */
export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const patientsContext = usePatients();
  const ordersContext = useOrders();
  
  if (!patientsContext || !ordersContext) {
    return null;
  }

  const { getPatient, loading, error } = patientsContext;
  const patient = id ? getPatient(id) : null;

  if (!patient && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Patient not found</p>
      </div>
    );
  }

  // Define sections
  const sections: DetailSection[] = [
    // General Info
    {
      id: 'general-info',
      title: 'General Info',
      order: 1,
      span: 1,
      content: patient ? (
        <SectionCard title="General Info">
          <div className="flex flex-col gap-4">
            <InfoField icon="user-hands" label="Gender" value={<span className="capitalize">{patient.gender}</span>} />
            <InfoField 
              icon="calendar" 
              label="Birthday" 
              value={new Date(patient.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} 
            />
            <InfoField icon="phone" label="Phone Number" value={patient.phone} />
            <InfoField icon="mail" label="Email" value={patient.email || 'N/A'} />
            <InfoField 
              icon="map" 
              label="Address" 
              value={`${patient.address?.street || 'N/A'}, ${patient.address?.city || ''} ${patient.address?.postalCode || ''}`} 
            />
            <InfoField 
              icon="phone" 
              label="Emergency Contact" 
              value={`${patient.emergencyContact?.name || 'N/A'} (${patient.emergencyContact?.phone || 'N/A'})`} 
            />
          </div>
        </SectionCard>
      ) : null,
    },
    // Medical History
    {
      id: 'medical-history',
      title: 'Medical History',
      order: 2,
      span: 1,
      content: patient ? (
        <SectionCard title="Medical History">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <Icon name="info-circle" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Chronic Disease</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {patient.medicalHistory?.chronicConditions?.length > 0
                    ? patient.medicalHistory.chronicConditions.join(', ')
                    : 'None'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <Icon name="medicine" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Current Medications</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {patient.medicalHistory?.currentMedications?.length > 0
                    ? patient.medicalHistory.currentMedications.join(', ')
                    : 'None'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <Icon name="alert-circle" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Allergies</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {patient.medicalHistory?.allergies?.length > 0
                    ? patient.medicalHistory.allergies.join(', ')
                    : 'None'}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null,
    },
    // Lab Affiliation
    {
      id: 'affiliation',
      title: 'Lab Affiliation',
      order: 3,
      span: 1,
      content: patient ? (
        <SectionCard title="Lab Affiliation">
          <div className="flex items-center justify-center">
            <AffiliationCard
              holderName={patient.fullName}
              affiliation={patient.affiliation}
            />
          </div>
        </SectionCard>
      ) : null,
    },
    // Related Orders
    {
      id: 'orders',
      title: 'Related Orders',
      order: 4,
      span: 2,
      content: patient ? (
        <SectionCard 
          title="Related Orders"
          headerRight={
            <IconButton
              onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
              icon={<Icon name="plus" />}
              variant="primary"
              size="sm"
              title="New Order"
            />
          }
        >
          {(() => {
            const patientOrders = ordersContext.getOrdersByPatient(patient.id);

            if (patientOrders.length === 0) {
              return (
                <EmptyState
                  icon="document-medicine"
                  title="No Orders Found"
                  description="This patient has no orders yet."
                />
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-xs bg-gray-50 text-gray-500 uppercase sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2">Order ID</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Tests</th>
                      <th className="px-4 py-2">Priority</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patientOrders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.orderId}`)}>
                        <td className="px-4 py-3 text-xs text-sky-600 font-medium font-mono">{order.orderId}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{order.tests.length} test{order.tests.length !== 1 ? 's' : ''}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {order.tests.slice(0, 2).map(t => t.testName || t.testCode).join(', ')}
                              {order.tests.length > 2 && ` +${order.tests.length - 2} more`}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant={order.priority} size="sm" /></td>
                        <td className="px-4 py-3"><Badge variant={order.overallStatus} size="sm" /></td>
                        <td className="px-4 py-3 font-medium text-sky-600">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.totalPrice)}
                        </td>
                        <td className="px-4 py-3"><Badge variant={order.paymentStatus} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </SectionCard>
      ) : null,
    },
  ];

  return (
    <>
      <DetailView
        title={patient?.fullName || 'Loading...'}
        subtitle={patient?.id}
        loading={loading}
        error={error}
        layout="custom"
        badges={
          patient && isAffiliationActive(patient.affiliation) ? (
            <Icon 
              name="verified" 
              className="w-5 h-5 text-blue-500" 
              aria-label="Verified patient"
            />
          ) : undefined
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="pen" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Icon name="plus" />}
              onClick={() => patient && navigate(`/orders/new?patientId=${patient.id}`)}
            >
              New Order
            </Button>
          </>
        }
        sections={sections}
        customLayout={
          <div className="grid grid-cols-3 gap-4">
            {/* Left column - 2 sections */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              {sections.slice(0, 2).map(section => (
                <div key={section.id}>{section.content}</div>
              ))}
              {/* Orders span full width */}
              <div className="col-span-2">{sections[3]?.content}</div>
            </div>
            {/* Right column - affiliation */}
            <div className="col-span-1">
              {sections[2]?.content}
            </div>
          </div>
        }
      />

      {patient && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          patient={patient}
          mode="edit"
        />
      )}
    </>
  );
};
