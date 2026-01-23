import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrders } from "@/features/order/OrderContext";
import { usePatients, useResponsiveLayout } from "@/hooks";
import { useBilling } from "@/features/billing/BillingContext";
import { useTests } from "@/features/test/TestsContext";
import {
  Button,
  Avatar,
  Badge,
  Icon,
  SectionContainer,
  IconButton,
  EmptyState,
} from "@/shared/ui";
import type { IconName } from "@/shared/ui/Icon";
import { formatCurrency, calculateAge } from "@/utils";
import { displayId } from "@/utils/id-display";
import { getTestName, getTestSampleType, getTestCategory } from "@/utils/typeHelpers";
import type { Order, OrderTest, Patient } from "@/types";
import { OrderCircularProgress } from "./OrderCircularProgress";
import { OrderTimeline } from "./OrderTimeline";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface InfoFieldProps {
  icon: IconName;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

interface OrderInfoSectionProps {
  order: Order;
  layout?: "grid" | "column";
}

interface PatientInfoSectionProps {
  patient: Patient | null;
  onViewPatient: () => void;
  layout?: "grid" | "column";
}

interface TestsTableProps {
  tests: OrderTest[];
  testCatalog: any[];
  supersededCount?: number;
  variant?: "simple" | "detailed";
}

interface BillingSummarySectionProps {
  order: Order;
  invoice: any | null;
  onViewInvoice: () => void;
}

interface OrderHeaderProps {
  order: Order;
  invoice: any | null;
  isLarge: boolean;
  onViewInvoice: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a date to a readable string
 */
const formatOrderDate = (date: string | Date, format: "long" | "short" = "long"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (format === "long") {
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  
  return dateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ============================================================================
// Reusable Components
// ============================================================================

/**
 * InfoField - Displays a label-value pair with an icon
 */
const InfoField: React.FC<InfoFieldProps> = ({ icon, label, value, className = "" }) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      <Icon name={icon} className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
          {value}
        </p>
      </div>
    </div>
  );
};

/**
 * OrderInfoSection - Displays order information
 */
const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({
  order,
  layout = "column",
}) => {
  const containerClass = layout === "grid" 
    ? "grid grid-cols-1 sm:grid-cols-2 gap-5" 
    : "flex flex-col gap-3";

  return (
    <div className={containerClass}>
      <InfoField
        icon="hashtag"
        label="Order ID"
        value={<span className="font-mono">{displayId.order(order.orderId)}</span>}
      />
      <InfoField
        icon="calendar"
        label="Order Date"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(order.orderDate, "long")}
          </span>
        }
      />
      <InfoField
        icon="danger-square"
        label="Priority"
        value={<Badge variant={order.priority} size="sm" />}
      />
      <InfoField
        icon="clock"
        label="Status"
        value={<Badge variant={order.overallStatus} size="sm" />}
      />
      {order.referringPhysician && (
        <InfoField
          icon="stethoscope"
          label="Referring Physician"
          value={order.referringPhysician}
        />
      )}
      {order.clinicalNotes && (
        <InfoField
          icon="pen"
          label="Clinical Notes"
          value={
            <span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>
          }
        />
      )}
    </div>
  );
};

/**
 * PatientInfoSection - Displays patient information
 */
const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  patient,
  onViewPatient,
  layout = "column",
}) => {
  const containerClass = layout === "grid" 
    ? "grid grid-cols-1 sm:grid-cols-2 gap-5" 
    : "flex flex-col gap-3";

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <Icon name="user" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Patient Not Found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex gap-3 items-center col-span-full">
        <Avatar 
          primaryText={patient.fullName} 
          secondaryText={displayId.patient(patient.id)}
          size="sm" 
        />
        <IconButton
          onClick={onViewPatient}
          variant="view"
          size="sm"
          title="View Patient"
        />
      </div>
      <InfoField
        icon="user-hands"
        label="Age & Gender"
        value={
          <span className="capitalize">
            {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
          </span>
        }
      />
      <InfoField
        icon="calendar"
        label="Date of Birth"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(patient.dateOfBirth, "long")}
          </span>
        }
      />
      <InfoField icon="phone" label="Phone" value={patient.phone} />
      {patient.email && (
        <InfoField
          icon="mail"
          label="Email"
          value={
            <span className="line-clamp-2 break-all">{patient.email}</span>
          }
        />
      )}
    </div>
  );
};

/**
 * TestsTable - Displays a table of order tests
 */
const TestsTable: React.FC<TestsTableProps> = ({
  tests,
  testCatalog,
  variant = "simple",
}) => {
  if (tests.length === 0) {
    return (
      <EmptyState
        icon="health"
        title="No Tests"
        description="This order has no tests."
      />
    );
  }

  if (variant === "simple") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-gray-100">
            {tests.map((test: OrderTest, index: number) => {
              const testName = getTestName(test.testCode, testCatalog);
              const isSuperseded = test.status === "superseded";
              const isRetest = test.isRetest || false;
              const retestNumber = test.retestNumber || 0;

              return (
                <tr
                  key={test.id || index}
                  className={`transition-colors ${
                    isSuperseded 
                      ? "bg-gray-50/50 opacity-60" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className={`font-mono ${
                        isSuperseded ? "text-gray-400 line-through" : "text-sky-600"
                      }`}>
                        {test.testCode}
                      </span>
                      {isRetest && retestNumber > 0 && (
                        <Badge variant="default" size="xs" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                          #{retestNumber}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`${isSuperseded ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {testName}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={test.status} size="sm" strikethrough={isSuperseded} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Detailed variant for large screens
  return (
    <table className="w-full text-left text-xs table-fixed">
      <colgroup>
        <col style={{ width: "12%" }} />
        <col style={{ width: "30%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "8%" }} />
      </colgroup>
      <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0 z-10 [&_th]:font-normal">
        <tr>
          <th className="px-4 py-2">Code</th>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Category</th>
          <th className="px-4 py-2">Sample</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2 text-right">Price</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {tests.map((test: OrderTest, index: number) => {
          const testName = getTestName(test.testCode, testCatalog);
          const sampleType = getTestSampleType(test.testCode, testCatalog);
          const category = getTestCategory(test.testCode, testCatalog);
          const isSuperseded = test.status === "superseded";
          const isRetest = test.isRetest || false;
          const retestNumber = test.retestNumber || 0;

          return (
            <tr 
              key={test.id || index} 
              className={`transition-colors ${
                isSuperseded 
                  ? "bg-gray-50/50 opacity-60" 
                  : "hover:bg-gray-50"
              }`}
            >
              <td className={`px-4 py-3 font-mono truncate whitespace-nowrap ${
                isSuperseded ? "text-gray-400 line-through" : "text-sky-600"
              }`}>
                {test.testCode}
              </td>
              
              <td className={`px-4 py-3 whitespace-normal wrap-break-word ${
                isSuperseded ? "line-through" : ""
              }`}>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${
                    isSuperseded ? "text-gray-400" : "text-gray-900"
                  }`}>
                    {testName}
                  </span>
                  {isRetest && retestNumber > 0 && (
                    <Badge variant="default" size="xs" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                      #{retestNumber}
                    </Badge>
                  )}
                </div>
              </td>
              
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={category as "default"} size="sm" strikethrough={isSuperseded} />
              </td>
              
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={sampleType as "default"} size="sm" strikethrough={isSuperseded} />
              </td>
              
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={test.status} size="sm" strikethrough={isSuperseded} />
              </td>
              
              <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                isSuperseded ? "text-gray-400 line-through" : "text-sky-600"
              }`}>
                {formatCurrency(test.priceAtOrder)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

/**
 * BillingSummarySection - Displays billing summary information
 */
const BillingSummarySection: React.FC<BillingSummarySectionProps> = ({
  order,
  invoice,
  onViewInvoice,
}) => {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">{formatCurrency(order.totalPrice)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Discount</span>
          <span className="font-medium text-gray-900">-</span>
        </div>
      </div>

      <div className="border-t border-gray-200 my-3" />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-sky-600">{formatCurrency(order.totalPrice)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Payment Status</span>
          <Badge variant={order.paymentStatus} size="sm" />
        </div>
      </div>

      {invoice && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-4"
          icon={<Icon name="bill" className="w-4 h-4" />}
          onClick={onViewInvoice}
        >
          View Invoice
        </Button>
      )}
    </div>
  );
};

/**
 * OrderHeader - Displays order header with badges and action buttons
 */
const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  invoice,
  isLarge,
  onViewInvoice,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
      <div className="flex items-center gap-3 self-center">
        <h1 className="text-sm font-bold text-gray-900">
          {displayId.order(order.orderId)}
        </h1>
        <Badge variant={order.priority} size="sm" />
        <Badge variant={order.overallStatus} size="sm" />
      </div>

      <div className={`flex items-center gap-2 self-center ${!isLarge ? "w-full sm:w-auto sm:justify-end justify-end" : ""}`}>
        {isLarge ? (
          <>
            <Button
              variant="print"
              size="sm"
              onClick={() => {/* Print functionality */}}
            >
              Print
            </Button>
            {invoice && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Icon name="bill" className="w-4 h-4" />}
                onClick={onViewInvoice}
              >
                Invoice
              </Button>
            )}
          </>
        ) : (
          <>
            <IconButton
              variant="print"
              size="sm"
              title="Print"
              onClick={() => {/* Print functionality */}}
            />
            {invoice && (
              <IconButton
                variant="secondary"
                size="sm"
                title="View Invoice"
                icon={<Icon name="bill" className="w-4 h-4" />}
                onClick={onViewInvoice}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Grid Layout Components
// ============================================================================

/**
 * SmallScreenLayout - Single column stack layout for small screens
 */
interface SmallScreenLayoutProps {
  order: Order;
  patient: Patient | null;
  invoice: any | null;
  testCatalog: any[];
  activeTests: OrderTest[];
  supersededCount: number;
  onViewPatient: () => void;
  onViewInvoice: () => void;
}

const SmallScreenLayout: React.FC<SmallScreenLayoutProps> = ({
  order,
  patient,
  invoice,
  testCatalog,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6">
      <SectionContainer
        title="Order Information"
        className="shrink-0 bg-white"
        contentClassName="overflow-visible"
      >
        <OrderInfoSection order={order} layout="grid" />
      </SectionContainer>

      <SectionContainer
        title="Patient Information"
        className="shrink-0 bg-white"
        contentClassName="overflow-visible"
        headerRight={
          patient && (
            <IconButton
              onClick={onViewPatient}
              variant="view"
              size="sm"
              title="View Patient"
            />
          )
        }
      >
        <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="grid" />
      </SectionContainer>

      <SectionContainer
        title="Order Progress"
        className="shrink-0 bg-white"
        contentClassName="overflow-visible p-0"
        headerClassName="!py-1.5"
        headerRight={<OrderCircularProgress order={order} />}
      >
        <OrderTimeline order={order} />
      </SectionContainer>

      <SectionContainer
        title={supersededCount > 0 
          ? `Tests (${activeTests.length} active)` 
          : `Tests (${order.tests.length})`
        }
        className="shrink-0"
        contentClassName="p-0 overflow-visible"
      >
        <TestsTable
          tests={order.tests}
          testCatalog={testCatalog}
          supersededCount={supersededCount}
          variant="simple"
        />
      </SectionContainer>

      <SectionContainer
        title="Billing Summary"
        className="shrink-0 bg-white"
        contentClassName="overflow-visible"
      >
        <BillingSummarySection
          order={order}
          invoice={invoice}
          onViewInvoice={onViewInvoice}
        />
      </SectionContainer>
    </div>
  );
};

/**
 * MediumScreenLayout - 2x2 grid layout for medium screens
 */
interface MediumScreenLayoutProps {
  order: Order;
  patient: Patient | null;
  invoice: any | null;
  testCatalog: any[];
  activeTests: OrderTest[];
  supersededCount: number;
  onViewPatient: () => void;
  onViewInvoice: () => void;
}

const MediumScreenLayout: React.FC<MediumScreenLayoutProps> = ({
  order,
  patient,
  invoice,
  testCatalog,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
}) => {
  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-4 min-h-0 h-full">
      {/* Row 1: Order Info and Patient Info */}
      <SectionContainer
        title="Order Information"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <OrderInfoSection order={order} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Patient Information"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
        headerClassName="!py-1.5"
        headerRight={
          patient && (
            <IconButton
              onClick={onViewPatient}
              variant="view"
              size="sm"
              title="View Patient"
            />
          )
        }
      >
        <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="column" />
      </SectionContainer>

      {/* Row 2: Order Progress and Billing Summary */}
      <SectionContainer
        title="Order Progress"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto p-0"
        headerClassName="!py-1.5"
        headerRight={<OrderCircularProgress order={order} />}
      >
        <OrderTimeline order={order} />
      </SectionContainer>

      <SectionContainer
        title="Billing Summary"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        <BillingSummarySection
          order={order}
          invoice={invoice}
          onViewInvoice={onViewInvoice}
        />
      </SectionContainer>

      {/* Row 3: Tests (full width) */}
      <SectionContainer
        title={supersededCount > 0 
          ? `Tests (${activeTests.length} active)` 
          : `Tests (${order.tests.length})`
        }
        className="h-full flex flex-col min-h-0 bg-white col-span-2"
        contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
      >
        <TestsTable
          tests={order.tests}
          testCatalog={testCatalog}
          supersededCount={supersededCount}
          variant="detailed"
        />
      </SectionContainer>
    </div>
  );
};

/**
 * LargeScreenLayout - 3-column grid layout for large screens
 */
interface LargeScreenLayoutProps {
  order: Order;
  patient: Patient | null;
  invoice: any | null;
  testCatalog: any[];
  activeTests: OrderTest[];
  supersededCount: number;
  onViewPatient: () => void;
  onViewInvoice: () => void;
}

const LargeScreenLayout: React.FC<LargeScreenLayoutProps> = ({
  order,
  patient,
  invoice,
  testCatalog,
  activeTests,
  supersededCount,
  onViewPatient,
  onViewInvoice,
}) => {
  return (
    <div
      className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full"
      style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
    >
      {/* Left Column Group - 2x2 grid */}
      <div
        className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
      >
        <SectionContainer
          title="Order Information"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <OrderInfoSection order={order} layout="column" />
        </SectionContainer>

        <SectionContainer
          title="Patient Information"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
          headerClassName="!py-1.5"
          headerRight={
            patient && (
              <IconButton
                onClick={onViewPatient}
                variant="view"
                size="sm"
                title="View Patient"
              />
            )
          }
        >
          <PatientInfoSection patient={patient} onViewPatient={onViewPatient} layout="column" />
        </SectionContainer>

        <SectionContainer
          title={supersededCount > 0 
            ? `Tests (${activeTests.length} active)` 
            : `Tests (${order.tests.length})`
          }
          className="h-full flex flex-col col-span-2 min-h-0"
          contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
        >
          <TestsTable
            tests={order.tests}
            testCatalog={testCatalog}
            supersededCount={supersededCount}
            variant="detailed"
          />
        </SectionContainer>
      </div>

      {/* Right Column Group - Order Progress and Billing Summary */}
      <div
        className="col-span-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
      >
        <SectionContainer
          title="Order Progress"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto p-0"
          headerClassName="!py-1.5"
          headerRight={<OrderCircularProgress order={order} />}
        >
          <OrderTimeline order={order} />
        </SectionContainer>

        <SectionContainer
          title="Billing Summary"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
        >
          <BillingSummarySection
            order={order}
            invoice={invoice}
            onViewInvoice={onViewInvoice}
          />
        </SectionContainer>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * OrderDetail - Main component for displaying order details
 * 
 * Features:
 * - Responsive layout (small, medium, large screens)
 * - Order information display
 * - Patient information
 * - Order progress timeline
 * - Tests list table
 * - Billing summary
 */
export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const ordersContext = useOrders();
  const patientsContext = usePatients();
  const billingContext = useBilling();
  const testsContext = useTests();
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();

  // Early returns for loading and error states
  if (!ordersContext || !patientsContext || !billingContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const { getOrder } = ordersContext;
  const { getPatient } = patientsContext;
  const { getInvoiceByOrderId } = billingContext;
  const testCatalog = testsContext?.tests || [];

  const order = id ? getOrder(id) : null;
  const patient = order ? (getPatient(order.patientId) ?? null) : null;
  const invoice = order ? getInvoiceByOrderId(order.orderId) : null;

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-12">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  // Calculate active vs superseded test counts for display
  const activeTests = order.tests.filter(t => t.status !== "superseded");
  const supersededCount = order.tests.length - activeTests.length;

  // Event handlers
  const handleViewPatient = () => navigate(`/patients/${order.patientId}`);
  const handleViewInvoice = () => invoice && navigate(`/billing/invoice/${invoice.invoiceId}`);

  // Render appropriate layout based on screen size
  const renderContent = () => {
    if (isSmall) {
      return (
        <SmallScreenLayout
          order={order}
          patient={patient}
          invoice={invoice}
          testCatalog={testCatalog}
          activeTests={activeTests}
          supersededCount={supersededCount}
          onViewPatient={handleViewPatient}
          onViewInvoice={handleViewInvoice}
        />
      );
    }

    if (isMedium) {
      return (
        <MediumScreenLayout
          order={order}
          patient={patient}
          invoice={invoice}
          testCatalog={testCatalog}
          activeTests={activeTests}
          supersededCount={supersededCount}
          onViewPatient={handleViewPatient}
          onViewInvoice={handleViewInvoice}
        />
      );
    }

    return (
      <LargeScreenLayout
        order={order}
        patient={patient}
        invoice={invoice}
        testCatalog={testCatalog}
        activeTests={activeTests}
        supersededCount={supersededCount}
        onViewPatient={handleViewPatient}
        onViewInvoice={handleViewInvoice}
      />
    );
  };

  return (
    <div className="h-full flex flex-col p-6 transition-all duration-300">
      <OrderHeader
        order={order}
        invoice={invoice}
        isLarge={isLarge}
        onViewInvoice={handleViewInvoice}
      />

      {renderContent()}
    </div>
  );
};
