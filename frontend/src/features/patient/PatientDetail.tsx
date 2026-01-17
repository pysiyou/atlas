import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatients } from '@/hooks';
import { useOrders } from '@/features/order/OrderContext';
import { Button, Avatar, Badge, Icon, SectionContainer, IconButton } from '@/shared/ui';
// import { MedicalHistoryCard } from './MedicalHistory';
// import { OrderHistoryCard } from './OrderHistory';
// import { PatientInfoCard } from './PatientCard';
import { AffiliationCard } from './PatientDetailSections';
import { EditPatientModal } from './EditPatientModal';
import { isAffiliationActive } from './usePatientForm';

export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const patientsContext = usePatients();
  const ordersContext = useOrders();
  
  if (!patientsContext || !ordersContext) {
    return <div>Loading...</div>;
  }

  const { getPatient } = patientsContext;
  // const { getOrdersByPatient } = ordersContext;
  const patient = id ? getPatient(id) : null;
  // const patientOrders = id ? getOrdersByPatient(id) : [];

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Avatar 
            name={patient.fullName} 
            size="sm"
            className=""
          />
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-medium text-gray-900">
                {patient.fullName}
              </h1>
              {isAffiliationActive(patient.affiliation) && (
                <Icon 
                  name="verified" 
                  className="w-5 h-5 text-blue-500" 
                  aria-label="Verified patient"
                />
              )}
            </div>
            
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full">
        {/* Left Column Group - Using flat 2x2 grid for consistent gaps */}
        <div className="col-span-2 grid grid-cols-2 grid-rows-[3fr_2fr] gap-4 min-h-0 h-full">
          {/* Row 1, Col 1: General Info */}
          <SectionContainer title="General Info" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-6">
                {/* Gender */}
                <div className="flex gap-3 items-start">
                  <Icon name="user-hands" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">{patient.gender}</p>
                  </div>
                </div>

                {/* Birthday */}
                <div className="flex gap-3 items-start">
                  <Icon name="calendar" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Birthday</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {new Date(patient.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-3 items-start">
                  <Icon name="phone" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{patient.phone}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-3 items-start">
                  <Icon name="mail" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">{patient.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-3 items-start">
                  <Icon name="map" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {patient.address?.street || 'N/A'}, {patient.address?.city || ''} {patient.address?.postalCode || ''}
                    </p>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="flex gap-3 items-start">
                  <Icon name="phone" className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Emergency Contact</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {patient.emergencyContact?.name || 'N/A'} <span className="text-gray-400 font-normal">({patient.emergencyContact?.phone || 'N/A'})</span>
                    </p>
                  </div>
                </div>
              </div>
            </SectionContainer>

            {/* Row 1, Col 2: Medical History */}
            <SectionContainer title="Medical History" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {/* Chronic Conditions */}
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

                {/* Medications */}
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

                {/* Surgery */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                    <Icon name="health" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Surgery</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                       {patient.medicalHistory?.previousSurgeries?.length > 0
                        ? patient.medicalHistory.previousSurgeries.join(', ')
                        : 'None'}
                    </p>
                  </div>
                </div>

                {/* Family Disease */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                    <Icon name="users-group" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Family Disease</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                       {patient.medicalHistory?.familyHistory || 'None'}
                    </p>
                  </div>
                </div>

                {/* Allergies */}
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
            </SectionContainer>

          {/* Row 2: Related Orders (spans both columns) */}
          <SectionContainer
            title="Related Orders"
            className="h-full flex flex-col col-span-2 min-h-0" 
            contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
            headerClassName="!py-1.5"
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
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 flex items-center justify-center mb-3">
                      <Icon name="document" className="w-full h-full text-gray-200" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No Orders Found</p>
                    <p className="text-xs text-gray-500 mt-1">This patient has no orders yet.</p>
                  </div>
                );
              }

              return (
                <table className="w-full text-left text-xs table-fixed">
                  <colgroup>
                    <col style={{ width: '21%' }} /> {/* Order ID */}
                    <col style={{ width: '14%' }} /> {/* Date */}
                    <col style={{ width: '8%' }} /> {/* Tests - smallest */}
                    <col style={{ width: '14%' }} /> {/* Priority */}
                    <col style={{ width: '21%' }} /> {/* Status */}
                    <col style={{ width: '8%' }} /> {/* Amount - smallest */}
                    <col style={{ width: '14%' }} /> {/* Payment */}
                  </colgroup>
                  <thead className="text-xs bg-gray-50 text-gray-500 uppercase sticky top-0 z-10 border-b border-gray-200 [&_th]:font-normal">
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
                    {patientOrders.map((order) => {
                      // Determine Badge Color for Order Status
                      let statusVariant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
                      switch (order.overallStatus) {
                        case 'completed':
                        case 'delivered':
                          statusVariant = 'success';
                          break;
                        case 'in-progress':
                          statusVariant = 'primary';
                          break;
                        case 'ordered':
                        default:
                          statusVariant = 'default';
                          break;
                      }

                      // Determine Badge Color for Payment Status
                      let paymentVariant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
                      switch (order.paymentStatus) {
                        case 'paid':
                          paymentVariant = 'success';
                          break;
                        case 'pending':
                          paymentVariant = 'warning';
                          break;
                        case 'partial':
                          paymentVariant = 'primary';
                          break;
                        default:
                          paymentVariant = 'default';
                        }

                      return (
                        <tr key={order.orderId} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.orderId}`)}>
                          <td className="px-4 py-3 font-medium font-mono text-sky-600 truncate">
                            {order.orderId}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap truncate">
                            {new Date(order.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap truncate">
                            <span className="font-medium text-gray-900">{order.tests.length}</span>
                            <span className="text-gray-500 ml-1">tests</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge 
                              variant={order.priority === 'stat' ? 'danger' : order.priority === 'urgent' ? 'warning' : 'default'} 
                              size="sm" 
                              className="uppercase"
                            >
                              {order.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={statusVariant} size="sm" className="uppercase">
                              {order.overallStatus.replace('-', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium text-sky-600 whitespace-nowrap">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.totalPrice)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={paymentVariant} size="sm" className="uppercase">
                              {order.paymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </SectionContainer>
        </div>

        {/* Right Column Group */}
        <div className="col-span-1 grid grid-rows-[2fr_3fr] gap-4 min-h-0 h-full">
          <SectionContainer title="Lab Affiliation" className="h-full flex flex-col min-h-0" contentClassName="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex items-center justify-center">
              <AffiliationCard
                holderName={patient.fullName}
                affiliation={patient.affiliation}
              />
            </div>
          </SectionContainer>
          <SectionContainer title="Reports" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {/* Reports based on Validated Orders */}
            {(() => {
              const patientOrders = ordersContext.getOrdersByPatient(patient.id);
              const reportableOrders = patientOrders.filter(order => 
                order.tests.some(test => test.status === 'validated')
              );

              if (reportableOrders.length === 0) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 flex items-center justify-center mb-3 opacity-50">
                      <Icon name="pdf" className="w-full h-full text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">No Reports Available</p>
                    <p className="text-xs text-gray-400 mt-1">There are no validated reports for this patient yet.</p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col divide-y divide-gray-100">
                  {reportableOrders.map((order, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <Icon name="pdf" className="w-full h-full text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium font-mono text-gray-900 truncate">Report_{order.orderId}.pdf</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.orderDate).toLocaleDateString()} • 1.2 MB
                          </p>
                        </div>
                      </div>
                      <button className="flex items-center justify-center ">
                        <Icon name="download" className="w-5 h-5 hover:text-blue-400 hover:cursor-pointer transition-colors" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </SectionContainer>
        </div>
      </div>

      {patient && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          patient={patient}
          mode="edit"
        />
      )}
    </div>
  );
};
