/**
 * ValidatedTestReportCard Component
 *
 * Custom mobile card component for report data in table view.
 * Displays reportable-order information in a mobile-friendly card layout.
 */
import { Avatar } from '@/components/primitives';
import { ListCard } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import type { CardComponentProps } from '@/components/data-table';
import { formatDateTime } from '@/utils';
import { TABLE_DATETIME_SECONDARY_CLASS } from '@/utils/tableColumnRenders';
import type { ReportableOrder } from '../types';
import { ReportPreviewButton } from './ReportPreviewButton';
import { ReportPrintButton } from './ReportPrintButton';
import { text } from '@/theme/recipes';
import {
  formatReportOrderTestsPreview,
  getReportOrderTestLabels,
} from '../utils/reportOrderTestLabels';
import { renderTruncatedListPreview } from '@/utils/truncatedListPreviewRender';


interface ValidatedTestReportCardProps extends CardComponentProps<ReportableOrder> {
  /** Callback when preview button is clicked */
  onPreview: (order: ReportableOrder) => void;
  onPrint: (order: ReportableOrder) => void;
  generatingOrderId: number | null;
}

/**
 * ValidatedTestReportCard - Mobile card view for reportable orders
 *
 * @param item - ReportableOrder data
 * @param onClick - Optional click handler for the card
 * @param onPreview - Handler for preview button
 */
export function ValidatedTestReportCard({
  item: order,
  onClick,
  onPreview,
  onPrint,
  generatingOrderId,
}: ValidatedTestReportCardProps) {
  const testsPreview = formatReportOrderTestsPreview(order);
  const { nameLabels, codeLabels } = getReportOrderTestLabels(order);
  const namesNode =
    nameLabels.length > 0 ? renderTruncatedListPreview(nameLabels) : testsPreview.names;
  const codesNode = codeLabels.length > 0 ? renderTruncatedListPreview(codeLabels) : null;
  const statusLabel = `${order.validatedTestCount}/${order.activeTestCount}`;

  return (
    <ListCard onPress={onClick}>
      <ListCard.Header
        leading={
          <Avatar
            primaryText={order.patientName}
            primaryTextClassName="capitalize"
            secondarySlot="entity"
            secondaryText={<RecordId type="patient" value={order.patientId} emphasis="mutedBlock" />}
            size="xs"
          />
        }
        trailing={<span className={`${text({ role: 'label' })} tabular-nums`}>{statusLabel}</span>}
      />

      <div className="grow space-y-space-2">
        <div>
          <div
            className={text({ role: 'amount' })}
            title={testsPreview.fullNames !== testsPreview.names ? testsPreview.fullNames : undefined}
          >
            {namesNode}
          </div>
          {codesNode ? (
            <RecordId
              emphasis="block"
              title={testsPreview.fullCodes !== testsPreview.codes ? testsPreview.fullCodes : undefined}
            >
              {codesNode}
            </RecordId>
          ) : null}
        </div>
      </div>

      <div className="flex justify-between items-center mt-auto pt-space-3">
        <div className={TABLE_DATETIME_SECONDARY_CLASS}>
          <RecordId type="order" value={order.orderId} emphasis="mutedBlock" />
          <span className="block mt-space-0-5">{formatDateTime(order.orderDate)}</span>
        </div>
        <div
          className="flex items-center gap-space-1"
          onClick={e => e.stopPropagation()}
        >
          <ReportPreviewButton order={order} onPreview={onPreview} size="sm" />
          <ReportPrintButton
            order={order}
            onPrint={onPrint}
            size="sm"
            disabled={generatingOrderId === order.orderId}
          />
        </div>
      </div>
    </ListCard>
  );
}
