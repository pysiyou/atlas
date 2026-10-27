/**
 * ValidatedTestReportCard Component
 *
 * Custom mobile card component for report data in table view.
 */
import { ListCard } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import type { CardComponentProps } from '@/components/data-table';
import type { ReportableOrder } from '../types';
import { OrderStatusBadge } from '@/features/orders';
import { ReportPrintButton } from './ReportPrintButton';
import { text } from '@/theme/recipes';
import {
  EntityStack,
  renderCardDateTimeSecondary,
  useReportableOrderPresentation,
} from '@/utils/presentation';
import { renderTruncatedListPreview } from '@/utils/truncatedListPreviewRender';

interface ValidatedTestReportCardProps extends CardComponentProps<ReportableOrder> {
  onPrint: (order: ReportableOrder) => void;
  generatingOrderId: number | null;
}

export function ValidatedTestReportCard({
  item: order,
  onClick,
  onPrint,
  generatingOrderId,
}: ValidatedTestReportCardProps) {
  const { testsPreview, nameLabels, codeLabels } = useReportableOrderPresentation(order);

  const namesNode =
    nameLabels.length > 0 ? renderTruncatedListPreview(nameLabels) : testsPreview.names;
  const codesNode = codeLabels.length > 0 ? renderTruncatedListPreview(codeLabels) : null;

  return (
    <ListCard onPress={onClick}>
      <ListCard.Header
        leading={
          <EntityStack
            primaryText={order.patientName}
            secondaryType="patient"
            secondaryValue={order.patientId}
          />
        }
        trailing={
          <OrderStatusBadge
            status={order.overallStatus}
            presentation={order.statusPresentation}
            layout="compact"
            size="xs"
          />
        }
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
        <div>
          <RecordId type="order" value={order.orderId} emphasis="mutedBlock" />
          <span className="block mt-space-0-5">{renderCardDateTimeSecondary(order.orderDate)}</span>
        </div>
        <div className="flex items-center gap-space-1" onClick={e => e.stopPropagation()}>
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
