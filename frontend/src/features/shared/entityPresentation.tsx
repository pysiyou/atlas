/**
 * Cross-feature table/card entity renders. Pure formatters and view-models: @/utils/presentation.
 */

import type { MouseEvent, ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { Badge, type BadgeProps } from '@/components/primitives';
import { Avatar } from '@/components/primitives';
import { RecordId } from '@/features/shared';
import { getTestName } from '@/features/catalog/testLookup';
import { LabPresentationCompactBadge, LabPresentationStack } from '@/features/lab';
import type { Gender, OrderTest, TestSummary } from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import { PRESENTATION_STACK_CLASS, TABLE_TYPE } from '@/theme/recipes';
import { cn, formatCurrency, formatDateTime, type EntityType } from '@/utils';
import {
  renderDateTimeCell,
  renderPatientNameBlock,
  renderTableTwoLineCell,
  TABLE_DATETIME_SECONDARY_CLASS,
  TABLE_PRIMARY_CELL_CLASS,
} from '@/utils/tableColumnRenders';
import { renderTruncatedListPreview } from '@/utils/truncatedListPreviewRender';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';
import {
  buildOrderContextPresentation,
  formatPatientSexAgeLine,
  formatPatientOrdersCountLabel,
  formatTestCountLabel,
  resolveOrderTestsPresentation,
  type OrderTestsBlockLayout,
  type OrderTestsPresentationInput,
  type PatientListSnippet,
  type ReportableOrderTestsInput,
  resolveReportableOrderTests,
} from '@/utils/presentation';

export { renderDateTimeCell };

export function renderPatientDemographicsSecondary(
  gender?: Gender | string | null,
  dateOfBirth?: string | null
): ReactNode {
  const line = formatPatientSexAgeLine(gender, dateOfBirth);
  if (!line) {
    return null;
  }
  return <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{line}</div>;
}

export function PatientNameCell({
  patientName,
  gender,
  dateOfBirth,
}: {
  patientName: string;
  gender?: Gender | string | null;
  dateOfBirth?: string | null;
}): ReactNode {
  return renderPatientNameBlock(
    patientName,
    renderPatientDemographicsSecondary(gender, dateOfBirth)
  );
}

export function renderPatientNameCell(
  patientName: string,
  gender?: Gender | string | null,
  dateOfBirth?: string | null
): ReactNode {
  return (
    <PatientNameCell
      patientName={patientName}
      gender={gender}
      dateOfBirth={dateOfBirth}
    />
  );
}

export function TestNameCodeStack({
  testName,
  testCode,
  title,
}: {
  testName: string;
  testCode: string;
  title?: string;
}): ReactNode {
  return (
    <div className={PRESENTATION_STACK_CLASS}>
      <span
        className={cn(TABLE_TYPE.cell, 'block min-w-0 truncate font-normal')}
        title={title ?? testName}
      >
        {testName}
      </span>
      <RecordId emphasis="mutedBlock">{testCode}</RecordId>
    </div>
  );
}

export function renderTestNameCodeStack(
  testName: string,
  testCode: string,
  title?: string
): ReactNode {
  return <TestNameCodeStack testName={testName} testCode={testCode} title={title} />;
}

export function renderOrderTestIdentity(
  test: Pick<OrderTest, 'testCode' | 'testName'>,
  testCatalog: TestSummary[]
): ReactNode {
  const name = getTestName(test.testCode, testCatalog) || test.testName || test.testCode;
  return <TestNameCodeStack testName={name} testCode={test.testCode} title={name} />;
}

export interface EntityStackProps {
  primaryText: string;
  primaryTextClassName?: string;
  secondaryType?: EntityType;
  secondaryValue?: string | number;
  secondaryEmphasis?: 'mutedBlock' | 'block';
  secondaryCustom?: ReactNode;
  size?: 'xs' | 'sm' | 'md';
}

export function EntityStack({
  primaryText,
  primaryTextClassName = 'capitalize',
  secondaryType,
  secondaryValue,
  secondaryEmphasis = 'mutedBlock',
  secondaryCustom,
  size = 'xs',
}: EntityStackProps): ReactNode {
  const secondaryText =
    secondaryCustom ??
    (secondaryType && secondaryValue != null
      ? <RecordId type={secondaryType} value={secondaryValue} emphasis={secondaryEmphasis} />
      : undefined);

  return (
    <Avatar
      primaryText={primaryText}
      primaryTextClassName={primaryTextClassName}
      secondarySlot="entity"
      secondaryText={secondaryText}
      size={size}
    />
  );
}

export type StatusPresentationLayout = 'stack' | 'compact';

type StatusPresentationBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'> & {
  status: string;
  presentation?: StatusPresentation | null;
  layout?: StatusPresentationLayout;
};

export function StatusPresentationBadge({
  status,
  presentation,
  layout = 'stack',
  ...props
}: StatusPresentationBadgeProps) {
  if (presentation) {
    if (layout === 'compact') {
      return (
        <LabPresentationCompactBadge
          presentation={presentation}
          size={props.size}
          className={props.className}
        />
      );
    }
    return <LabPresentationStack presentation={presentation} size={props.size} />;
  }
  return (
    <Badge
      variant={resolveStatusBadgeColor(status)}
      label={formatStatusBadgeLabel(status)}
      {...props}
    />
  );
}

export function renderCardDateTimeSecondary(
  date: string | Date | null | undefined
): ReactNode {
  if (!date) {
    return null;
  }
  return (
    <span className={`${TABLE_DATETIME_SECONDARY_CLASS} tabular-nums`}>
      {formatDateTime(date)}
    </span>
  );
}

export function renderNavigableOrderId(
  orderId: string | number,
  navigate: NavigateFunction
): ReactNode {
  return (
    <RecordId
      type="order"
      value={orderId}
      emphasis="interactive"
      as="button"
      onClick={(e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        navigate(`/orders/${orderId}`);
      }}
    />
  );
}

export function renderNavigableSampleId(sampleId: string | number): ReactNode {
  return (
    <RecordId
      type="sample"
      value={sampleId}
      emphasis="interactive"
      navigateToFiltered={{
        targetPage: '/laboratory/collection',
        filterKey: 'sampleId',
        labTab: 'collection',
      }}
    />
  );
}

export type OrderTestsCellVariant = 'namesFirst' | 'countFirst' | 'namesWithCodes';

export interface OrderTestsCellProps extends OrderTestsPresentationInput {
  variant?: OrderTestsCellVariant;
  showAllNames?: boolean;
}

export function OrderTestsCell({
  variant = 'namesFirst',
  showAllNames,
  ...input
}: OrderTestsCellProps): ReactNode {
  const preview = resolveOrderTestsPresentation({ ...input, showAllNames });

  if (variant === 'namesWithCodes') {
    const namesNode =
      preview.nameLabels.length > 0
        ? renderTruncatedListPreview(preview.nameLabels)
        : formatTestCountLabel(preview.activeCount);
    const codesNode =
      preview.codeLabels.length > 0
        ? renderTruncatedListPreview(preview.codeLabels)
        : null;

    return (
      <div className={PRESENTATION_STACK_CLASS}>
        <div
          className={`${TABLE_TYPE.cell} truncate font-normal`}
          title={
            preview.fullNames !== preview.namesPreview ? preview.fullNames : undefined
          }
        >
          {namesNode}
        </div>
        {codesNode ? (
          <RecordId
            emphasis="mutedBlock"
            title={
              preview.fullCodes !== preview.codesPreview ? preview.fullCodes : undefined
            }
          >
            {codesNode}
          </RecordId>
        ) : null}
      </div>
    );
  }

  if (variant === 'namesFirst') {
    if (!preview.namesFirstPreview && preview.activeCount === 0) {
      return null;
    }

    const namesContent =
      showAllNames || preview.labels.length === 0
        ? preview.namesFirstPreview
        : renderTruncatedListPreview(preview.labels);

    return (
      <div className="min-w-0 w-full font-normal text-left">
        <div
          className={`${TABLE_TYPE.cell} wrap-break-word font-normal text-left${showAllNames ? '' : ' line-clamp-2'}`}
          title={
            !showAllNames && preview.labels.length > 0
              ? preview.labels.join(', ')
              : undefined
          }
        >
          {namesContent}
        </div>
      </div>
    );
  }

  const secondaryContent =
    showAllNames || preview.labels.length === 0
      ? preview.countFirstSecondary
      : renderTruncatedListPreview(preview.labels);

  return (
    <div className={PRESENTATION_STACK_CLASS}>
      <div className={TABLE_PRIMARY_CELL_CLASS}>
        {formatTestCountLabel(preview.activeCount)}
      </div>
      {secondaryContent ? (
        <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{secondaryContent}</div>
      ) : null}
    </div>
  );
}

export function ReportableOrderTestsCell({
  order,
}: {
  order: ReportableOrderTestsInput;
}): ReactNode {
  const preview = resolveReportableOrderTests(order);
  return (
    <OrderTestsCell
      variant="namesWithCodes"
      activeTests={preview.nameLabels.map((name, i) => ({
        testName: name,
        testCode: preview.codeLabels[i] ?? name,
      }))}
      fallbackCount={order.activeTestCount}
      testCodes={preview.codeLabels}
    />
  );
}

export function renderReportableOrderTestsCell(order: ReportableOrderTestsInput): ReactNode {
  return <ReportableOrderTestsCell order={order} />;
}

export function renderOrderTestsBlockFromTests(
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[],
  options?: Omit<OrderTestsCellProps, 'activeTests'>
): ReactNode {
  return <OrderTestsCell activeTests={activeTests} variant="namesFirst" {...options} />;
}

export function renderOrderId(orderId: string | number, clickable = false): ReactNode {
  return <RecordId type="order" value={orderId} emphasis={clickable ? 'interactive' : 'block'} />;
}

export interface OrderPatientDemographics {
  gender?: Gender | string | null;
  dateOfBirth?: string | null;
}

export function renderOrderPatientName(
  patientName: string,
  demographics?: OrderPatientDemographics,
): ReactNode {
  return renderPatientNameCell(patientName, demographics?.gender, demographics?.dateOfBirth);
}

export type { OrderTestsBlockLayout };

export interface RenderOrderTestsBlockOptions {
  fallbackCount?: number;
  testCodes?: string[];
  testNames?: string[];
  getTestName?: (testCode: string) => string;
  layout?: OrderTestsBlockLayout;
  showAllNames?: boolean;
}

export function renderOrderTestsBlock(
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[],
  options?: RenderOrderTestsBlockOptions | number
): ReactNode {
  const resolved: RenderOrderTestsBlockOptions =
    typeof options === 'number' ? { fallbackCount: options } : (options ?? {});

  const variant = resolved.layout === 'namesFirst' ? 'namesFirst' : 'countFirst';

  return renderOrderTestsBlockFromTests(activeTests, {
    ...resolved,
    variant,
  });
}

export function renderOrderTotalPrice(totalPrice: number): ReactNode {
  return (
    <div className={`${TABLE_TYPE.amount} truncate font-normal`}>{formatCurrency(totalPrice)}</div>
  );
}

export function renderOrderTotalPriceInline(totalPrice: number): ReactNode {
  return (
    <span className={`${TABLE_TYPE.amount} truncate block font-normal`}>
      {formatCurrency(totalPrice)}
    </span>
  );
}

export function renderOrderDateCell(date: string | Date | null | undefined): ReactNode {
  return renderDateTimeCell(date);
}

export function renderPatientId(patientId: string | number): ReactNode {
  return <RecordId type="patient" value={patientId} emphasis="block" />;
}

export function renderPatientOrdersSummary(
  orderCount: number,
  lastOrderDate?: string
): ReactNode {
  if (orderCount === 0 || !lastOrderDate) {
    return (
      <span className={`${TABLE_TYPE.meta} truncate block font-normal`}>No orders</span>
    );
  }
  return renderTableTwoLineCell(
    formatPatientOrdersCountLabel(orderCount),
    formatDateTime(lastOrderDate),
    { secondaryClassName: 'tabular-nums' }
  );
}

export function renderPatientNameWithAge(fullName: string, dateOfBirth: string): ReactNode {
  return renderPatientNameCell(fullName, undefined, dateOfBirth);
}

export function renderPatientSexAgeSecondary(
  gender?: Gender | string | null,
  dateOfBirth?: string | null,
): ReactNode {
  return renderPatientDemographicsSecondary(gender, dateOfBirth);
}

export interface WorklistRowSource {
  orderId: number;
  patientId: number;
  patientName: string;
  patientDob?: string | null;
  patientGender?: string | null;
  testName: string;
  testCode: string;
  orderDate?: string;
  referentDoctor?: string | null;
  status: string;
  statusPresentation?: StatusPresentation | null;
}

export interface WorklistRowPresentation {
  orderContext: ReturnType<typeof buildOrderContextPresentation>;
  testIdentity: ReactNode;
  orderId: number;
  testName: string;
  testCode: string;
  status: string;
  statusPresentation?: StatusPresentation | null;
}

export function buildWorklistRowPresentation(
  row: WorklistRowSource
): WorklistRowPresentation {
  const patient: PatientListSnippet = {
    patientId: row.patientId,
    patientName: row.patientName,
    dateOfBirth: row.patientDob,
    gender: row.patientGender,
  };

  return {
    orderContext: buildOrderContextPresentation(patient, {
      orderId: row.orderId,
      orderDate: row.orderDate,
      referentDoctor: row.referentDoctor,
    }),
    testIdentity: renderTestNameCodeStack(row.testName, row.testCode),
    orderId: row.orderId,
    testName: row.testName,
    testCode: row.testCode,
    status: row.status,
    statusPresentation: row.statusPresentation,
  };
}
