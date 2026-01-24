/**
 * Patient Detail Layout Components
 * Responsive layouts for patient detail page
 */

import React from 'react';
import { SectionContainer, IconButton } from '@/shared/ui';
import type { Patient, Order } from '@/types';
import { GeneralInfoSection } from '../../components/display/GeneralInfoSection';
import { MedicalHistorySectionDisplay } from '../../components/display/MedicalHistorySectionDisplay';
import { VitalSignsDisplay } from '../../components/display/VitalSignsDisplay';
import { PatientOrdersTable } from '../../components/tables/PatientOrdersTable';
import { ReportsList } from '../../components/display/ReportsList';

interface LayoutProps {
  patient: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

/**
 * SmallScreenLayout - Single column stack layout for small screens
 */
export const SmallScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6">
      <SectionContainer
        title="Vital Signs"
        className="shrink-0 bg-white"
        contentClassName="overflow-visible"
      >
        <VitalSignsDisplay vitalSigns={patient.vitalSigns} />
      </SectionContainer>

      <SectionContainer
        title="General Info"
        className="shrink-0 bg-white"
        contentClassName="overflow-visible"
      >
        <GeneralInfoSection patient={patient} layout="grid" />
      </SectionContainer>

      <SectionContainer
        title="Medical History"
        className="shrink-0 bg-white"
        contentClassName="overflow-visible"
      >
        <MedicalHistorySectionDisplay patient={patient} layout="grid" />
      </SectionContainer>

      <SectionContainer
        title="Related Orders"
        className="shrink-0"
        contentClassName="p-0 overflow-visible"
        headerClassName="!py-1.5"
        headerRight={<IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} variant="simple" />
      </SectionContainer>

      <SectionContainer title="Reports" className="" contentClassName="overflow-visible">
        <ReportsList orders={orders} />
      </SectionContainer>
    </div>
  );
};

/**
 * MediumScreenLayout - 2x2 grid layout for medium screens
 */
export const MediumScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-4 min-h-0 h-full">
      <SectionContainer
        title="Vital Signs"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <VitalSignsDisplay vitalSigns={patient.vitalSigns} />
      </SectionContainer>

      <SectionContainer
        title="Reports"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        <ReportsList orders={orders} />
      </SectionContainer>

      <SectionContainer
        title="General Info"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <GeneralInfoSection patient={patient} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Medical History"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <MedicalHistorySectionDisplay patient={patient} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Related Orders"
        className="h-full flex flex-col min-h-0 bg-white col-span-2"
        contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
        headerClassName="!py-1.5"
        headerRight={<IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} variant="detailed" />
      </SectionContainer>
    </div>
  );
};

/**
 * LargeScreenLayout - 3-column grid layout for large screens
 */
export const LargeScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div
      className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full"
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      <div
        className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
      >
        <SectionContainer
          title="General Info"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <GeneralInfoSection patient={patient} layout="column" />
        </SectionContainer>

        <SectionContainer
          title="Medical History"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <MedicalHistorySectionDisplay patient={patient} layout="column" />
        </SectionContainer>

        <SectionContainer
          title="Related Orders"
          className="h-full flex flex-col col-span-2 min-h-0"
          contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
          headerClassName="!py-1.5"
          headerRight={
            <IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />
          }
        >
          <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} variant="detailed" />
        </SectionContainer>
      </div>

      <div
        className="col-span-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
      >
        <SectionContainer
          title="Vital Signs"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <VitalSignsDisplay vitalSigns={patient.vitalSigns} />
        </SectionContainer>

        <SectionContainer
          title="Reports"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
        >
          <ReportsList orders={orders} />
        </SectionContainer>
      </div>
    </div>
  );
};
