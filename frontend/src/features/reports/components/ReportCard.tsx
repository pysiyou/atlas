/**
 * ReportCard Component
 *
 * Custom mobile card component for report data in table view.
 * Displays validated test information in a mobile-friendly card layout.
 */
import { Badge, Avatar, MobileEntityCard, EntityId } from '@/components';
import type { CardComponentProps } from '@/components';
import { formatDateTime } from '@/utils';
import type { ValidatedTest } from '../types';
import { ReportPreviewButton } from './ReportPreviewButton';

interface ReportCardProps extends CardComponentProps<ValidatedTest> {
  /** Callback when preview button is clicked */
  onPreview: (test: ValidatedTest) => void;
}

/**
 * ReportCard - Mobile card view for validated tests
 *
 * @param item - ValidatedTest data
 * @param onClick - Optional click handler for the card
 * @param onPreview - Handler for preview button
 */
export function ReportCard({ item: test, onClick, onPreview }: ReportCardProps) {
  return (
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <Avatar
            primaryText={test.patientName}
            primaryTextClassName="capitalize"
            secondaryText={<EntityId type="orderTest" value={test.testId} />}
            size="xs"
          />
        }
        trailing={<Badge variant="validated" size="xs" />}
      />

      {/* Test information */}
      <div className="grow space-y-2">
        <div>
          <div className="text-text-primary text-sm">{test.testName}</div>
          <EntityId variant="block">{test.testCode}</EntityId>
        </div>
        <div className="text-xs text-text-tertiary">
          Order: <EntityId type="order" value={test.orderId} />
        </div>
      </div>

      {/* Bottom section: Order date (left) + Preview button (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        <div className="text-xs text-text-tertiary">{formatDateTime(test.orderDate)}</div>
        <div onClick={e => e.stopPropagation()}>
          <ReportPreviewButton test={test} onPreview={onPreview} size="sm" />
        </div>
      </div>
    </MobileEntityCard>
  );
}
