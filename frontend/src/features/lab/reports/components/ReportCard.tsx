/**
 * ReportCard Component
 *
 * Custom mobile card component for report data in table view.
 * Displays validated test information in a mobile-friendly card layout.
 */
import { Badge, Card, Avatar } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
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
    <Card padding="list" hover className="flex flex-col h-full" onClick={onClick}>
      {/* Header: Avatar (top left) + Status (top right) */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-default">
        {/* Avatar: Patient name + Test ID - positioned at top left */}
        <Avatar
          primaryText={test.patientName}
          primaryTextClassName="capitalize"
          secondaryText={displayId.orderTest(test.testId)}
          secondaryTextClassName="font-mono text-brand"
          size="xs"
        />
        {/* Status badge on top right */}
        <Badge variant="validated" size="xs" />
      </div>

      {/* Test information */}
      <div className="grow space-y-2">
        <div>
          <div className="text-text-primary text-sm">{test.testName}</div>
          <div className="text-xs text-brand font-mono">{test.testCode}</div>
        </div>
        <div className="text-xs text-text-tertiary">
          Order: <span className="font-mono">{displayId.order(test.orderId)}</span>
        </div>
      </div>

      {/* Bottom section: Order date (left) + Preview button (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        {/* Order date on bottom left */}
        <div className="text-xs text-text-tertiary">{formatDate(test.orderDate)}</div>
        {/* Preview button on bottom right */}
        <div onClick={e => e.stopPropagation()}>
          <ReportPreviewButton test={test} onPreview={onPreview} size="xs" />
        </div>
      </div>
    </Card>
  );
}
