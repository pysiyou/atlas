/**
 * Compact card for the dashboard orders table at the sm breakpoint.
 */
import { Badge, MobileEntityCard } from '@/components';
import type { CardComponentProps } from '@/components';
import { BlockedReasonBadge } from '@/features/lab/components/LabResultStatusBadges';
import { formatDateTime, displayId } from '@/utils';
import { DASHBOARD_TWO_LINE } from '../dashboardStyles';
import type { LabDashboardOrderRow } from './dashboardOrders';

export function LabDashboardOrderCard({
  item,
  onClick,
}: CardComponentProps<LabDashboardOrderRow>) {
  return (
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <div className="min-w-0">
            <div className={DASHBOARD_TWO_LINE.primary}>{item.testName}</div>
            <div className={DASHBOARD_TWO_LINE.secondary}>
              {item.patientName}
              <span className={DASHBOARD_TWO_LINE.mrn}>
                {' '}
                · MRN: {displayId.patient(item.patientId)}
              </span>
            </div>
          </div>
        }
        trailing={<Badge variant={item.priority} size="xs" />}
      />
      <div className="flex flex-wrap items-center gap-space-2">
        {item.blockedLabel ? (
          <BlockedReasonBadge label={item.blockedLabel} size="xs" showIcon={false} />
        ) : (
          <Badge variant={item.status} size="xs" />
        )}
        {item.sampleType ? (
          <Badge variant={item.sampleType} size="xs" className="border-none" />
        ) : null}
        {item.department ? (
          <Badge variant={item.department} size="xs" className="border-none" />
        ) : null}
      </div>
      <div className={`${DASHBOARD_TWO_LINE.secondary} mt-auto pt-space-3`}>
        {formatDateTime(item.date)}
      </div>
    </MobileEntityCard>
  );
}
