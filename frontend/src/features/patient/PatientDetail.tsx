import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePatients, useResponsiveLayout } from "@/hooks";
import { useOrders } from "@/features/order/OrderContext";
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
import { displayId } from "@/utils/id-display";
import { EditPatientModal } from "./EditPatientModal";
import { isAffiliationActive } from "./usePatientForm";
import { AffiliationPopover } from "./AffiliationPopover";
import type { Patient, VitalSigns } from "@/types/patient";
import type { Order } from "@/types/order";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface InfoFieldProps {
  icon: IconName;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

interface GeneralInfoSectionProps {
  patient: Patient;
  layout?: "grid" | "column";
}

interface MedicalHistorySectionProps {
  patient: Patient;
  layout?: "grid" | "column";
}

interface OrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  variant?: "simple" | "detailed";
}

interface ReportsListProps {
  orders: Order[];
}

interface PatientHeaderProps {
  patient: Patient;
  isLarge: boolean;
  onEdit: () => void;
  onNewOrder: () => void;
}

interface VitalSignsSectionProps {
  vitalSigns?: VitalSigns;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a date to a readable string
 */
const formatDate = (date: string | Date, format: "long" | "short" = "long"): string => {
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

/**
 * Formats an array of strings into a comma-separated list or returns "None"
 */
const formatList = (items: string[] | undefined, fallback: string = "None"): string => {
  if (!items || items.length === 0) return fallback;
  return items.join(", ");
};

/**
 * Formats an address into a single string
 */
const formatAddress = (address: Patient["address"]): string => {
  if (!address) return "N/A";
  const parts = [
    address.street || "N/A",
    address.city || "",
    address.postalCode || "",
  ].filter(Boolean);
  return parts.join(", ") || "N/A";
};

/**
 * Gets reportable orders (orders with validated tests)
 */
const getReportableOrders = (orders: Order[]): Order[] => {
  return orders.filter((order) =>
    order.tests.some((test) => test.status === "validated"),
  );
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
 * GeneralInfoSection - Displays patient general information
 */
const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  patient,
  layout = "column",
}) => {
  const containerClass = layout === "grid" 
    ? "grid grid-cols-1 sm:grid-cols-2 gap-5" 
    : "flex flex-col gap-3";

  return (
    <div className={containerClass}>
      <InfoField
        icon="user-hands"
        label="Gender"
        value={<span className="capitalize">{patient.gender}</span>}
      />
      <InfoField
        icon="calendar"
        label="Birthday"
        value={
          <span className="whitespace-nowrap truncate">
            {formatDate(patient.dateOfBirth, "long")}
          </span>
        }
      />
      <InfoField icon="phone" label="Phone Number" value={patient.phone} />
      <InfoField
        icon="mail"
        label="Email"
        value={
          <span className="line-clamp-2 break-all">{patient.email || "N/A"}</span>
        }
      />
      <InfoField
        icon="ruler"
        label="Height"
        value={patient.height ? `${patient.height} cm` : "N/A"}
      />
      <InfoField
        icon="weight"
        label="Weight"
        value={patient.weight ? `${patient.weight} kg` : "N/A"}
      />
      <InfoField icon="map" label="Address" value={formatAddress(patient.address)} />
      <InfoField
        icon="phone"
        label="Emergency Contact"
        value={
          <>
            {patient.emergencyContact?.fullName || "N/A"}{" "}
            <span className="text-gray-400 font-normal">
              ({patient.emergencyContact?.phone || "N/A"})
            </span>
          </>
        }
      />
    </div>
  );
};

/**
 * MedicalHistorySection - Displays patient medical history
 */
const MedicalHistorySection: React.FC<MedicalHistorySectionProps> = ({
  patient,
  layout = "column",
}) => {
  const containerClass = layout === "grid" 
    ? "grid grid-cols-1 sm:grid-cols-2 gap-5" 
    : "flex flex-col gap-4";

  return (
    <div className={containerClass}>
      <InfoField
        icon="info-circle"
        label="Chronic Disease"
        value={formatList(patient.medicalHistory?.chronicConditions)}
      />
      <InfoField
        icon="medicine"
        label="Current Medications"
        value={formatList(patient.medicalHistory?.currentMedications)}
      />
      <InfoField
        icon="health"
        label="Surgery"
        value={formatList(patient.medicalHistory?.previousSurgeries)}
      />
      <InfoField
        icon="users-group"
        label="Family Disease"
        value={patient.medicalHistory?.familyHistory || "None"}
      />
      <InfoField
        icon="alert-circle"
        label="Allergies"
        value={formatList(patient.medicalHistory?.allergies)}
      />
    </div>
  );
};

/**
 * OrdersTable - Displays a table of patient orders
 */
const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onOrderClick,
  variant = "simple",
}) => {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon="document"
        title="No Orders Found"
        description="This patient has no orders yet."
      />
    );
  }

  if (variant === "simple") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr
                key={order.orderId}
                className="hover:bg-sky-50 transition-colors cursor-pointer"
                onClick={() => onOrderClick(String(order.orderId))}
              >
                <td className="px-3 py-3 text-sky-600 font-medium font-mono">
                  {displayId.order(order.orderId)}
                </td>
                <td className="px-3 py-3 text-gray-600">
                  {formatDate(order.orderDate, "short")}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={order.overallStatus} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Detailed variant for large screens
  return (
    <table className="w-full text-left text-xs table-fixed">
      <colgroup>
        <col style={{ width: "10%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "25%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "13%" }} />
      </colgroup>
      <tbody className="divide-y divide-gray-100">
        {orders.map((order) => (
          <tr
            key={order.orderId}
            className="hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onOrderClick(String(order.orderId))}
          >
            <td className="px-2 py-3 text-xs text-sky-600 font-medium font-mono max-w-0">
              <span className="block truncate">{displayId.order(order.orderId)}</span>
            </td>
            <td className="px-2 py-3 text-xs text-gray-500 max-w-0">
              <span className="block truncate">
                {formatDate(order.orderDate, "short")}
              </span>
            </td>
            <td className="px-2 py-3 max-w-0">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {order.tests.length} test{order.tests.length !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {order.tests
                    .slice(0, 2)
                    .map((t) => t.testName || t.testCode)
                    .join(", ")}
                  {order.tests.length > 2 && ` +${order.tests.length - 2} more`}
                </div>
              </div>
            </td>
            <td className="px-2 py-3">
              <Badge variant={order.overallStatus} size="sm" />
            </td>
            <td className="px-2 py-3">
              <Badge variant={order.paymentStatus} size="sm" />
            </td>
            <td className="px-2 py-3 font-medium text-sky-600 max-w-0">
              <span className="block truncate">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(order.totalPrice)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * VitalSignsSection - Displays patient vital signs in a modern, card-based layout
 * 
 * Features:
 * - Color-coded status indicators (normal, borderline, abnormal)
 * - Icon-based visual representation
 * - Responsive grid layout
 * - Clean, modern design
 */
const VitalSignsSection: React.FC<VitalSignsSectionProps> = ({ vitalSigns }) => {
  // If no vital signs data, show empty state
  if (!vitalSigns) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <Icon name="stethoscope" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No vital signs recorded</p>
        </div>
      </div>
    );
  }

  /**
   * Determines the status of a vital sign based on normal ranges
   * Returns: 'normal' | 'borderline' | 'abnormal'
   */
  const getVitalStatus = (
    value: number,
    normalRange: { min: number; max: number },
    criticalRange?: { min: number; max: number }
  ): 'normal' | 'borderline' | 'abnormal' => {
    if (criticalRange) {
      if (value < criticalRange.min || value > criticalRange.max) {
        return 'abnormal';
      }
    }
    if (value >= normalRange.min && value <= normalRange.max) {
      return 'normal';
    }
    return 'borderline';
  };

  /**
   * Gets color classes based on vital sign status
   */
  const getStatusColors = (status: 'normal' | 'borderline' | 'abnormal') => {
    switch (status) {
      case 'normal':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: 'text-emerald-600',
          value: 'text-emerald-700',
          dot: 'bg-emerald-500',
        };
      case 'borderline':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-600',
          value: 'text-amber-700',
          dot: 'bg-amber-500',
        };
      case 'abnormal':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          value: 'text-red-700',
          dot: 'bg-red-500',
        };
    }
  };

  // Define vital signs with their configurations
  const vitalSignsConfig = [
    {
      key: 'temperature' as const,
      label: 'Temperature',
      value: vitalSigns.temperature,
      unit: '°C',
      icon: 'thermometer-landing-page' as IconName,
      normalRange: { min: 36.5, max: 37.3 },
      criticalRange: { min: 30.0, max: 45.0 },
    },
    {
      key: 'heartRate' as const,
      label: 'Heart Rate',
      value: vitalSigns.heartRate,
      unit: 'BPM',
      icon: 'stethoscope' as IconName,
      normalRange: { min: 60, max: 100 },
      criticalRange: { min: 30, max: 250 },
    },
    {
      key: 'systolicBP' as const,
      label: 'Systolic BP',
      value: vitalSigns.systolicBP,
      unit: 'mmHg',
      icon: 'medical-kit' as IconName,
      normalRange: { min: 0, max: 119.9 }, // Normal: <120
      criticalRange: { min: 50, max: 250 },
    },
    {
      key: 'diastolicBP' as const,
      label: 'Diastolic BP',
      value: vitalSigns.diastolicBP,
      unit: 'mmHg',
      icon: 'medical-kit' as IconName,
      normalRange: { min: 0, max: 79.9 }, // Normal: <80
      criticalRange: { min: 30, max: 150 },
    },
    {
      key: 'respiratoryRate' as const,
      label: 'Respiratory Rate',
      value: vitalSigns.respiratoryRate,
      unit: '/min',
      icon: 'health' as IconName,
      normalRange: { min: 12, max: 20 },
      criticalRange: { min: 4, max: 60 },
    },
    {
      key: 'oxygenSaturation' as const,
      label: 'O₂ Saturation',
      value: vitalSigns.oxygenSaturation,
      unit: '%',
      icon: 'health' as IconName,
      normalRange: { min: 95, max: 100 },
      criticalRange: { min: 50, max: 100 },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {vitalSignsConfig.map((config) => {
        const status = getVitalStatus(
          config.value,
          config.normalRange,
          config.criticalRange
        );
        const colors = getStatusColors(status);

        return (
          <div
            key={config.key}
            className={`
              ${colors.bg} ${colors.border}
              border rounded-lg p-3
              transition-all duration-200
              hover:shadow-sm
            `}
          >
            {/* Icon and Label Row */}
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <Icon
                name={config.icon}
                className={`w-4 h-4 ${colors.icon} shrink-0`}
              />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide whitespace-nowrap truncate">
                {config.label}
              </span>
            </div>

            {/* Value and Status Row */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1 min-w-0">
                <span className={`text-xl font-bold ${colors.value} leading-none`}>
                  {config.value.toFixed(config.key === 'temperature' ? 1 : 0)}
                </span>
                <span className={`text-xs font-medium ${colors.value} opacity-70`}>
                  {config.unit}
                </span>
              </div>
              {/* Status indicator dot */}
              <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * ReportsList - Displays a list of available reports
 */
const ReportsList: React.FC<ReportsListProps> = ({ orders }) => {
  const reportableOrders = getReportableOrders(orders);

  if (reportableOrders.length === 0) {
    return (
      <EmptyState
        icon="document-medicine"
        title="No Reports Available"
        description="There are no validated reports for this patient yet."
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {reportableOrders.map((order) => (
        <div
          key={order.orderId}
          className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center">
              <Icon name="pdf" className="w-full h-full text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium font-mono text-gray-900 truncate">
                Report_{displayId.order(order.orderId)}.pdf
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(order.orderDate)} • 1.2 MB
              </p>
            </div>
          </div>
          <IconButton variant="download" size="sm" title="Download Report" />
        </div>
      ))}
    </div>
  );
};

/**
 * PatientHeader - Displays patient header with avatar and action buttons
 */
const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  isLarge,
  onEdit,
  onNewOrder,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
      <div className="flex items-center gap-2 self-center">
        <Avatar primaryText={patient.fullName} size="sm" />
        {isAffiliationActive(patient.affiliation) && (
          <AffiliationPopover
            affiliation={patient.affiliation}
            trigger={
              <button
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-all flex items-center justify-center"
                aria-label="View affiliation details"
                title="View affiliation details"
              >
                <Icon
                  name="verified"
                  className="w-5 h-5 text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                />
              </button>
            }
          />
        )}
      </div>

      <div className={`flex items-center gap-2 self-center ${!isLarge ? "w-full sm:w-auto sm:justify-end justify-end" : ""}`}>
        {isLarge ? (
          <>
            <Button variant="edit" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="add" size="sm" onClick={onNewOrder}>
              New Order
            </Button>
          </>
        ) : (
          <>
            <IconButton
              variant="edit"
              size="sm"
              title="Edit Patient"
              onClick={onEdit}
            />
            <IconButton variant="add" size="sm" title="New Order" onClick={onNewOrder} />
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
  patient: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

const SmallScreenLayout: React.FC<SmallScreenLayoutProps> = ({
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
        <VitalSignsSection vitalSigns={patient.vitalSigns} />
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
        <MedicalHistorySection patient={patient} layout="grid" />
      </SectionContainer>

      <SectionContainer
        title="Related Orders"
        className="shrink-0"
        contentClassName="p-0 overflow-visible"
        headerClassName="!py-1.5"
        headerRight={
          <IconButton
            onClick={onNewOrder}
            variant="add"
            size="sm"
            title="New Order"
          />
        }
      >
        <OrdersTable
          orders={orders}
          onOrderClick={onOrderClick}
          variant="simple"
        />
      </SectionContainer>

      <SectionContainer
        title="Reports"
        className=""
        contentClassName="overflow-visible"
      >
        <ReportsList orders={orders} />
      </SectionContainer>
    </div>
  );
};

/**
 * MediumScreenLayout - 2x2 grid layout for medium screens
 */
interface MediumScreenLayoutProps {
  patient: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

const MediumScreenLayout: React.FC<MediumScreenLayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-4 min-h-0 h-full">
      {/* Row 1: Vital Signs and Reports */}
      <SectionContainer
        title="Vital Signs"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <VitalSignsSection vitalSigns={patient.vitalSigns} />
      </SectionContainer>

      <SectionContainer
        title="Reports"
        className="h-full flex flex-col min-h-0 bg-white"
        contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        <ReportsList orders={orders} />
      </SectionContainer>

      {/* Row 2: General Info and Medical History */}
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
        <MedicalHistorySection patient={patient} layout="column" />
      </SectionContainer>

      {/* Row 3: Related Orders (full width) */}
      <SectionContainer
        title="Related Orders"
        className="h-full flex flex-col min-h-0 bg-white col-span-2"
        contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
        headerClassName="!py-1.5"
        headerRight={
          <IconButton
            onClick={onNewOrder}
            variant="add"
            size="sm"
            title="New Order"
          />
        }
      >
        <OrdersTable
          orders={orders}
          onOrderClick={onOrderClick}
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
  patient: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

const LargeScreenLayout: React.FC<LargeScreenLayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div
      className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full"
      style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
    >
      {/* Left Column Group - 2x2 grid for consistent gaps */}
      <div
        className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
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
          <MedicalHistorySection patient={patient} layout="column" />
        </SectionContainer>

        <SectionContainer
          title="Related Orders"
          className="h-full flex flex-col col-span-2 min-h-0"
          contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
          headerClassName="!py-1.5"
          headerRight={
            <IconButton
              onClick={onNewOrder}
              variant="add"
              size="sm"
              title="New Order"
            />
          }
        >
          <OrdersTable
            orders={orders}
            onOrderClick={onOrderClick}
            variant="detailed"
          />
        </SectionContainer>
      </div>

      {/* Right Column Group - Vital Signs and Reports */}
      <div
        className="col-span-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
      >
        <SectionContainer
          title="Vital Signs"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <VitalSignsSection vitalSigns={patient.vitalSigns} />
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

// ============================================================================
// Main Component
// ============================================================================

/**
 * PatientDetail - Main component for displaying patient details
 * 
 * Features:
 * - Responsive layout (small, medium, large screens)
 * - Patient information display
 * - Medical history
 * - Related orders table
 * - Reports list
 * - Edit patient modal
 */
export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const patientsContext = usePatients();
  const ordersContext = useOrders();
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();

  // Early returns for loading and error states
  if (!patientsContext || !ordersContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const { getPatient } = patientsContext;
  const patient = id ? getPatient(id) : null;

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-12">
          <p className="text-gray-600">Patient not found</p>
        </div>
      </div>
    );
  }

  // Get patient orders
  const patientOrders = ordersContext.getOrdersByPatient(patient.id);

  // Event handlers
  const handleEdit = () => setIsEditModalOpen(true);
  const handleCloseEdit = () => setIsEditModalOpen(false);
  const handleNewOrder = () => navigate(`/orders/new?patientId=${patient.id}`);
  const handleOrderClick = (orderId: string) => navigate(`/orders/${orderId}`);

  // Render appropriate layout based on screen size
  const renderContent = () => {
    if (isSmall) {
      return (
        <SmallScreenLayout
          patient={patient}
          orders={patientOrders}
          onOrderClick={handleOrderClick}
          onNewOrder={handleNewOrder}
        />
      );
    }

    if (isMedium) {
      return (
        <MediumScreenLayout
          patient={patient}
          orders={patientOrders}
          onOrderClick={handleOrderClick}
          onNewOrder={handleNewOrder}
        />
      );
    }

    return (
      <LargeScreenLayout
        patient={patient}
        orders={patientOrders}
        onOrderClick={handleOrderClick}
        onNewOrder={handleNewOrder}
      />
    );
  };

  return (
    <div className="h-full flex flex-col p-6 transition-all duration-300">
      <PatientHeader
        patient={patient}
        isLarge={isLarge}
        onEdit={handleEdit}
        onNewOrder={handleNewOrder}
      />

      {renderContent()}

      {patient && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          patient={patient}
          mode="edit"
        />
      )}
    </div>
  );
};
