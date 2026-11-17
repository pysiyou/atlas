import React from 'react';
/**
 * PatientDetail Component
 * Main component for displaying patient details with responsive layouts
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useResponsiveLayout } from '@/hooks';
import { usePatient } from '../api/patients';
import { useOrdersByPatient } from '@/features/orders';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { DetailPageShell, PageHeader } from '@/components/layout';
import { EditPatientModal } from '../components/EditPatientModal';
import { PatientHeader } from '../components/PatientHeader';
import { SmallScreenLayout, MediumScreenLayout, LargeScreenLayout } from '../components/PatientDetailLayouts';
import { feedbackTitle } from '@/feedback';
import { useModuleListTitles } from '@/hooks';

export function PatientDetail() {
  const patientLabel = useModuleListTitles().patientDetail;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();
  const { openModal } = useModal();
  const { patient, isLoading: patientLoading } = usePatient(id);
  const { orders: patientOrders, isLoading: ordersLoading } = useOrdersByPatient(id);
  const pageLoading = (patientLoading && patient == null) || (ordersLoading && patientOrders.length === 0 && patient != null);

  const handleEdit = () => setIsEditModalOpen(true);
  const handleCloseEdit = () => setIsEditModalOpen(false);
  const handleNewOrder = () =>
    openModal({ type: ModalType.NEW_ORDER, patientId: patient?.id ?? '' });
  const handleOrderClick = (orderId: string) => navigate(`/orders/${orderId}`);

  const renderContent = () => {
    if (!pageLoading && !patient) return null;
    const layoutProps = {
      loading: pageLoading,
      patient: patient ?? undefined,
      orders: patientOrders,
      onOrderClick: handleOrderClick,
      onNewOrder: handleNewOrder,
    };
    if (isSmall) return <SmallScreenLayout {...layoutProps} />;
    if (isMedium) return <MediumScreenLayout {...layoutProps} />;
    return <LargeScreenLayout {...layoutProps} />;
  };

  const header = patient ? (
    <PatientHeader
      patient={patient}
      isLarge={isLarge}
      onEdit={handleEdit}
    />
  ) : (
    <PageHeader title={patientLabel} />
  );

  return (
    <>
      <DetailPageShell
        header={header}
        loading={pageLoading}
        notFound={!patientLoading && !patient}
        notFoundTitle={feedbackTitle('patient.detail.notFoundTitle')}
        notFoundDescription={feedbackTitle('patient.detail.notFoundDescription')}
      >
        {renderContent()}
      </DetailPageShell>
      {patient != null && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          patient={patient}
          mode="edit"
        />
      )}
    </>
  );
}
