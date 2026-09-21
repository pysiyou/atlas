/**
 * Four dashboard KPI stat cards — orders today, awaiting results, critical values, TAT.
 */
import React from 'react';
import { Icon, type IconName } from '@/components';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import type { DashboardKpis } from '../commandCenterModel';
import {
  DASHBOARD_KPI_CARD,
  DASHBOARD_KPI_ICON_TONE,
  DASHBOARD_KPI_ROW,
} from '../dashboardStyles';

type KpiTone = keyof typeof DASHBOARD_KPI_ICON_TONE;

interface KpiSpec {
  id: string;
  label: string;
  icon: IconName;
  tone: KpiTone;
  format: (kpis: DashboardKpis) => string;
}

const KPI_SPECS: KpiSpec[] = [
  {
    id: 'ordersToday',
    label: 'Orders Today',
    icon: ICONS.dataFields.fileText,
    tone: 'success',
    format: kpis => String(kpis.ordersToday),
  },
  {
    id: 'awaitingResults',
    label: 'Awaiting Results',
    icon: ICONS.dataFields.hourglass,
    tone: 'warning',
    format: kpis => String(kpis.awaitingResults),
  },
  {
    id: 'criticalValues',
    label: 'Critical Values',
    icon: ICONS.actions.alertTriangle,
    tone: 'danger',
    format: kpis => String(kpis.criticalValues).padStart(2, '0'),
  },
  {
    id: 'tatCompliance',
    label: 'TAT Compliance',
    icon: ICONS.ui.shieldCheck,
    tone: 'brand',
    format: kpis => `${kpis.tatCompliancePercent}%`,
  },
];

export interface LabDashboardKpiRowProps {
  kpis: DashboardKpis;
}

export const LabDashboardKpiRow: React.FC<LabDashboardKpiRowProps> = ({ kpis }) => {
  return (
    <div className={DASHBOARD_KPI_ROW}>
      {KPI_SPECS.map(spec => (
        <article key={spec.id} className={DASHBOARD_KPI_CARD.shell}>
          <div className={cn(DASHBOARD_KPI_CARD.icon, DASHBOARD_KPI_ICON_TONE[spec.tone])}>
            <Icon name={spec.icon} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className={DASHBOARD_KPI_CARD.value}>{spec.format(kpis)}</p>
            <p className={DASHBOARD_KPI_CARD.label}>{spec.label}</p>
          </div>
        </article>
      ))}
    </div>
  );
};
