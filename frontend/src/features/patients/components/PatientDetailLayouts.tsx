/**
 * Patient Detail Layout Components
 * Responsive layouts for patient detail page
 */

import React from 'react';
import { Panel, IconButton } from '@/components';
import { LAYOUT } from '@/components/theme/recipes';
import { cn } from '@/utils';
import type { Patient, Order } from '@/types';
import { GeneralInfoSection } from '../components/GeneralInfoSection';
import { MedicalHistorySectionDisplay } from '../components/MedicalHistorySectionDisplay';
import { PatientOrdersTable } from '../components/PatientOrdersTable';
import { PatientReportsList } from '../components/PatientReportsList';

interface LayoutProps {
  patient: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

/**
 * SmallScreenLayout - Single column stack layout for small screens.
 * Uses theme tokens (bg-surface-page, bg-surface, border-border-default) so theme applies correctly.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className={LAYOUT.detailScroll}>
      <Panel title="General Info" className="shrink-0" scroll="visible">
        <GeneralInfoSection patient={patient} layout="grid" />
      </Panel>

      <Panel title="Medical History" className="shrink-0" scroll="visible">
        <MedicalHistorySectionDisplay patient={patient} layout="grid" />
      </Panel>

      <Panel
        title="Related Orders"
        className="shrink-0"
        padding="none"
        scroll="visible"
        headerEnd={<IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </Panel>

      <Panel title="Reports" className="shrink-0" scroll="visible">
        <PatientReportsList orders={orders} />
      </Panel>
    </div>
  );
};

/**
 * MediumScreenLayout - Row 1: General Info | Medical History; Row 2: Reports (full width); Row 3: Related Orders (full width).
 */
export const MediumScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className={cn(LAYOUT.detailGrid2, 'w-full pb-layout-scroll-end')}>
      <Panel title="General Info" scroll="visible">
        <GeneralInfoSection patient={patient} layout="column" />
      </Panel>

      <Panel title="Medical History" scroll="visible">
        <MedicalHistorySectionDisplay patient={patient} layout="column" />
      </Panel>

      <Panel title="Reports" className="col-span-2" scroll="visible" bodyClassName="flex flex-col">
        <PatientReportsList orders={orders} />
      </Panel>

      <Panel
        title="Related Orders"
        className="col-span-2"
        padding="none"
        scroll="visible"
        headerEnd={<IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </Panel>
    </div>
  );
};

/**
 * LargeScreenLayout - Row 1: General Info | Medical History | Reports; Row 2: Related Orders (full width).
 * Vital Signs section hidden for future release.
 */
export const LargeScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div
      className={LAYOUT.detailGrid3Rows2}
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      <Panel title="General Info" className="min-h-0" scroll="auto">
        <GeneralInfoSection patient={patient} layout="column" />
      </Panel>

      <Panel title="Medical History" className="min-h-0" scroll="auto">
        <MedicalHistorySectionDisplay patient={patient} layout="column" />
      </Panel>

      <Panel title="Reports" className="min-h-0" scroll="auto" bodyClassName="flex flex-col">
        <PatientReportsList orders={orders} />
      </Panel>

      <Panel
        title="Related Orders"
        className="col-span-3 min-h-0"
        padding="none"
        scroll="auto"
        headerEnd={<IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </Panel>
    </div>
  );
};
