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
// import { MedicalHistoryCard } from './MedicalHistory';
// import { OrderHistoryCard } from './OrderHistory';
// import { PatientInfoCard } from './PatientCard';

import { EditPatientModal } from "./EditPatientModal";
import { AffiliationCard } from "./sections/AffiliationCard";

import { isAffiliationActive } from "./usePatientForm";
import { AffiliationPopover } from "./AffiliationPopover";

export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const patientsContext = usePatients();
  const ordersContext = useOrders();
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();

  if (!patientsContext || !ordersContext) {
    return <div>Loading...</div>;
  }

  const { getPatient } = patientsContext;
  // const { getOrdersByPatient } = ordersContext;
  const patient = id ? getPatient(id) : null;
  // const patientOrders = id ? getOrdersByPatient(id) : [];

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 transition-all duration-300">
      {/* Responsive Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Avatar primaryText={patient.fullName} size="sm" className="" />
          {isAffiliationActive(patient.affiliation) && (
            <AffiliationPopover
              affiliation={patient.affiliation}
              trigger={
                <button
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-all flex items-center"
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

        {/* Responsive Action Buttons */}
        <div
          className={`flex items-center gap-2 ${isSmall ? "w-full justify-end" : ""}`}
        >
          {isLarge ? (
            <>
              <Button
                variant="edit"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit
              </Button>
              <Button
                variant="add"
                size="sm"
                onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
              >
                New Order
              </Button>
            </>
          ) : (
            <>
              <IconButton
                variant="edit"
                size="sm"
                title="Edit Patient"
                onClick={() => setIsEditModalOpen(true)}
              />
              <IconButton
                variant="add"
                size="sm"
                title="New Order"
                onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
              />
            </>
          )}
        </div>
      </div>

      {/* Responsive Main Content */}
      {isSmall ? (
        // Small screens: Single column stack
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6">
          {/* General Info */}
          <SectionContainer
            title="General Info"
            className="flex-shrink-0 bg-white"
            contentClassName="overflow-visible"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Gender */}
              <div className="flex gap-3">
                <Icon
                  name="user-hands"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">
                    {patient.gender}
                  </p>
                </div>
              </div>

              {/* Birthday */}
              <div className="flex gap-3">
                <Icon
                  name="calendar"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Birthday</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-nowrap truncate">
                    {new Date(patient.dateOfBirth).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-3">
                <Icon name="phone" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {patient.phone}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-3">
                <Icon name="mail" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-2 break-all">
                    {patient.email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-3">
                <Icon name="map" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {patient.address?.street || "N/A"},{" "}
                    {patient.address?.city || ""}{" "}
                    {patient.address?.postalCode || ""}
                  </p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="flex gap-3">
                <Icon name="phone" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Emergency Contact</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {patient.emergencyContact?.fullName || "N/A"}{" "}
                    <span className="text-gray-400 font-normal">
                      ({patient.emergencyContact?.phone || "N/A"})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </SectionContainer>

          {/* Medical History */}
          <SectionContainer
            title="Medical History"
            className="flex-shrink-0 bg-white"
            contentClassName="overflow-visible"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Chronic Conditions */}
              <div className="flex gap-3">
                <Icon
                  name="info-circle"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Chronic Disease</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.chronicConditions?.length > 0
                      ? patient.medicalHistory.chronicConditions.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Medications */}
              <div className="flex gap-3">
                <Icon
                  name="medicine"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Current Medications</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.currentMedications?.length > 0
                      ? patient.medicalHistory.currentMedications.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Surgery */}
              <div className="flex gap-3">
                <Icon
                  name="health"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Surgery</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.previousSurgeries?.length > 0
                      ? patient.medicalHistory.previousSurgeries.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Family Disease */}
              <div className="flex gap-3">
                <Icon
                  name="users-group"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Family Disease</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.familyHistory || "None"}
                  </p>
                </div>
              </div>

              {/* Allergies */}
              <div className="flex gap-3">
                <Icon
                  name="alert-circle"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Allergies</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.allergies?.length > 0
                      ? patient.medicalHistory.allergies.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>
          </SectionContainer>

          {/* Related Orders */}
          <SectionContainer
            title="Related Orders"
            className="flex-shrink-0"
            contentClassName="p-0 overflow-visible"
            headerClassName="!py-1.5"
            headerRight={
              <IconButton
                onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
                variant="add"
                size="sm"
                title="New Order"
              />
            }
          >
            {(() => {
              const patientOrders = ordersContext.getOrdersByPatient(
                patient.id,
              );

              if (patientOrders.length === 0) {
                return (
                  <EmptyState
                    icon="document-medicine"
                    title="No Orders Found"
                    description="This patient has no orders yet."
                  />
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    {/* <thead className="text-xxs bg-gray-50 text-gray-500 uppercase border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-1 font-medium">Order ID</th>
                        <th className="px-2 py-1 font-medium">Date</th>
                        <th className="px-2 py-1 font-medium">Status</th>
                      </tr>
                    </thead> */}
                    <tbody className="divide-y divide-gray-100">
                      {patientOrders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="hover:bg-sky-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/orders/${order.orderId}`)}
                        >
                          <td className="px-3 py-3 text-sky-600 font-medium font-mono">
                            {order.orderId}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {new Date(order.orderDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
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
            })()}
          </SectionContainer>

          {/* Reports */}
          <SectionContainer
            title="Reports"
            className=""
            contentClassName="overflow-visible"
          >
            {(() => {
              const patientOrders = ordersContext.getOrdersByPatient(
                patient.id,
              );
              const reportableOrders = patientOrders.filter((order) =>
                order.tests.some((test) => test.status === "validated"),
              );

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
                  {reportableOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <Icon
                            name="pdf"
                            className="w-full h-full text-red-400"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium font-mono text-gray-900 truncate">
                            Report_{order.orderId}.pdf
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.orderDate).toLocaleDateString()} •
                            1.2 MB
                          </p>
                        </div>
                      </div>
                      <IconButton
                        variant="download"
                        size="sm"
                        title="Download Report"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </SectionContainer>
        </div>
      ) : isMedium ? (
        // Medium screens: 2x2 grid with 4 equal parts
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0 h-full">
          {/* Top Left: General Info */}
          <SectionContainer
            title="General Info"
            className="h-full flex flex-col min-h-0 bg-white"
            contentClassName="flex-1 min-h-0 overflow-y-auto"
          >
            <div className="flex flex-col gap-4">
              {/* Gender */}
              <div className="flex gap-3">
                <Icon
                  name="user-hands"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">
                    {patient.gender}
                  </p>
                </div>
              </div>

              {/* Birthday */}
              <div className="flex gap-3">
                <Icon
                  name="calendar"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Birthday</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-nowrap truncate">
                    {new Date(patient.dateOfBirth).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-3">
                <Icon name="phone" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {patient.phone}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-3">
                <Icon name="mail" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-2 break-all">
                    {patient.email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-3">
                <Icon name="map" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {patient.address?.street || "N/A"},{" "}
                    {patient.address?.city || ""}{" "}
                    {patient.address?.postalCode || ""}
                  </p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="flex gap-3">
                <Icon name="phone" className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Emergency Contact</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {patient.emergencyContact?.fullName || "N/A"}{" "}
                    <span className="text-gray-400 font-normal">
                      ({patient.emergencyContact?.phone || "N/A"})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </SectionContainer>

          {/* Top Right: Medical History */}
          <SectionContainer
            title="Medical History"
            className="h-full flex flex-col min-h-0 bg-white"
            contentClassName="flex-1 min-h-0 overflow-y-auto"
          >
            <div className="flex flex-col gap-4">
              {/* Chronic Conditions */}
              <div className="flex gap-3">
                <Icon
                  name="info-circle"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Chronic Disease</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.chronicConditions?.length > 0
                      ? patient.medicalHistory.chronicConditions.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Medications */}
              <div className="flex gap-3">
                <Icon
                  name="medicine"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Current Medications</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.currentMedications?.length > 0
                      ? patient.medicalHistory.currentMedications.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Surgery */}
              <div className="flex gap-3">
                <Icon
                  name="health"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Surgery</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.previousSurgeries?.length > 0
                      ? patient.medicalHistory.previousSurgeries.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Family Disease */}
              <div className="flex gap-3">
                <Icon
                  name="users-group"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Family Disease</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.familyHistory || "None"}
                  </p>
                </div>
              </div>

              {/* Allergies */}
              <div className="flex gap-3">
                <Icon
                  name="alert-circle"
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
                <div>
                  <p className="text-xs text-gray-500">Allergies</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                    {patient.medicalHistory?.allergies?.length > 0
                      ? patient.medicalHistory.allergies.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>
          </SectionContainer>

          {/* Bottom Left: Related Orders */}
          <SectionContainer
            title="Related Orders"
            className="h-full flex flex-col min-h-0 bg-white"
            contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
            headerClassName="!py-1.5"
            headerRight={
              <IconButton
                onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
                variant="add"
                size="sm"
                title="New Order"
              />
            }
          >
            {(() => {
              const patientOrders = ordersContext.getOrdersByPatient(
                patient.id,
              );

              if (patientOrders.length === 0) {
                return (
                  <EmptyState
                    icon="document"
                    title="No Orders Found"
                    description="This patient has no orders yet."
                  />
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    {/* <thead className="text-xxs bg-gray-50 text-gray-500 uppercase border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-1 font-medium">Order ID</th>
                        <th className="px-2 py-1 font-medium">Date</th>
                        <th className="px-2 py-1 font-medium">Status</th>
                      </tr>
                    </thead> */}
                    <tbody className="divide-y divide-gray-100">
                      {patientOrders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="hover:bg-sky-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/orders/${order.orderId}`)}
                        >
                          <td className="px-3 py-3 text-sky-600 font-medium font-mono">
                            {order.orderId}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {new Date(order.orderDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
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
            })()}
          </SectionContainer>

          {/* Bottom Right: Reports */}
          <SectionContainer
            title="Reports"
            className="h-full flex flex-col min-h-0 bg-white"
            contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
          >
            {(() => {
              const patientOrders = ordersContext.getOrdersByPatient(
                patient.id,
              );
              const reportableOrders = patientOrders.filter((order) =>
                order.tests.some((test) => test.status === "validated"),
              );

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
                  {reportableOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <Icon
                            name="pdf"
                            className="w-full h-full text-red-400"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium font-mono text-gray-900 truncate">
                            Report_{order.orderId}.pdf
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.orderDate).toLocaleDateString()} •
                            1.2 MB
                          </p>
                        </div>
                      </div>
                      <IconButton
                        variant="download"
                        size="sm"
                        title="Download Report"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </SectionContainer>
        </div>
      ) : (
        // Large screens: 3-column grid layout with matching bottom row heights
        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
          {/* Left Column Group - 2x2 grid for consistent gaps */}
          <div className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
            {/* Row 1, Col 1: General Info */}
            <SectionContainer
              title="General Info"
              className="h-full flex flex-col min-h-0"
              contentClassName="flex-1 min-h-0 overflow-y-auto"
            >
              <div className="flex flex-col gap-3">
                {/* Gender */}
                <div className="flex gap-3">
                  <Icon
                    name="user-hands"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">
                      {patient.gender}
                    </p>
                  </div>
                </div>

                {/* Birthday */}
                <div className="flex gap-3">
                  <Icon
                    name="calendar"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Birthday</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-nowrap truncate">
                      {new Date(patient.dateOfBirth).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-3">
                  <Icon
                    name="phone"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {patient.phone}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-3">
                  <Icon
                    name="mail"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-2 break-all">
                      {patient.email || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-3">
                  <Icon name="map" className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {patient.address?.street || "N/A"},{" "}
                      {patient.address?.city || ""}{" "}
                      {patient.address?.postalCode || ""}
                    </p>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="flex gap-3">
                  <Icon
                    name="phone"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Emergency Contact</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {patient.emergencyContact?.fullName || "N/A"}{" "}
                      <span className="text-gray-400 font-normal">
                        ({patient.emergencyContact?.phone || "N/A"})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </SectionContainer>

            {/* Row 1, Col 2: Medical History */}
            <SectionContainer
              title="Medical History"
              className="h-full flex flex-col min-h-0"
              contentClassName="flex-1 min-h-0 overflow-y-auto"
            >
              <div className="flex flex-col gap-4">
                {/* Chronic Conditions */}
                <div className="flex gap-3">
                  <Icon
                    name="info-circle"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Chronic Disease</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                      {patient.medicalHistory?.chronicConditions?.length > 0
                        ? patient.medicalHistory.chronicConditions.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>

                {/* Medications */}
                <div className="flex gap-3">
                  <Icon
                    name="medicine"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Current Medications</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                      {patient.medicalHistory?.currentMedications?.length > 0
                        ? patient.medicalHistory.currentMedications.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>

                {/* Surgery */}
                <div className="flex gap-3">
                  <Icon
                    name="health"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Surgery</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                      {patient.medicalHistory?.previousSurgeries?.length > 0
                        ? patient.medicalHistory.previousSurgeries.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>

                {/* Family Disease */}
                <div className="flex gap-3">
                  <Icon
                    name="users-group"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Family Disease</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                      {patient.medicalHistory?.familyHistory || "None"}
                    </p>
                  </div>
                </div>

                {/* Allergies */}
                <div className="flex gap-3">
                  <Icon
                    name="alert-circle"
                    className="w-4 h-4 text-gray-400 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Allergies</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                      {patient.medicalHistory?.allergies?.length > 0
                        ? patient.medicalHistory.allergies.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>
              </div>
            </SectionContainer>

            {/* Row 2: Related Orders (spans both columns) */}
            <SectionContainer
              title="Related Orders"
              className="h-full flex flex-col col-span-2 min-h-0"
              contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
              headerClassName="!py-1.5"
              headerRight={
                <IconButton
                  onClick={() =>
                    navigate(`/orders/new?patientId=${patient.id}`)
                  }
                  variant="add"
                  size="sm"
                  title="New Order"
                />
              }
            >
              {(() => {
                const patientOrders = ordersContext.getOrdersByPatient(
                  patient.id,
                );

                if (patientOrders.length === 0) {
                  return (
                    <EmptyState
                      icon="document"
                      title="No Orders Found"
                      description="This patient has no orders yet."
                    />
                  );
                }

                return (
                  <table className="w-full text-left text-xs table-fixed">
                    {/* Column widths: Order ID (15%), Date (12%), Tests (18%), Priority (12%), Status (15%), Amount (13%), Payment (15%) */}
                    <colgroup>
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "25%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "13%" }} />
                    </colgroup>
                    {/* <thead className="text-xxs bg-gray-50 text-gray-500 uppercase sticky top-0 z-10 border-b border-gray-200 [&_th]:font-normal">
                    <tr>
                      <th className="px-2 py-1">Order ID</th>
                      <th className="px-2 py-1">Date</th>
                      <th className="px-2 py-1">Tests</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Amount</th>
                      <th className="px-2 py-1">Payment</th>
                    </tr>
                  </thead> */}
                    <tbody className="divide-y divide-gray-100">
                      {patientOrders.map((order) => {
                        return (
                          <tr
                            key={order.orderId}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/orders/${order.orderId}`)}
                          >
                            <td className="px-2 py-3 text-xs text-sky-600 font-medium font-mono max-w-0">
                              <span className="block truncate">
                                {order.orderId}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-xs text-gray-500 max-w-0">
                              <span className="block truncate">
                                {new Date(order.orderDate).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </td>
                            <td className="px-2 py-3 max-w-0">
                              <div className="min-w-0">
                                <div className="font-medium truncate">
                                  {order.tests.length} test
                                  {order.tests.length !== 1 ? "s" : ""}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {order.tests
                                    .slice(0, 2)
                                    .map((t) => t.testName || t.testCode)
                                    .join(", ")}
                                  {order.tests.length > 2 &&
                                    ` +${order.tests.length - 2} more`}
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
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </SectionContainer>
          </div>

          {/* Right Column Group - Grid layout matching left column structure */}
          <div className="col-span-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
            {/* Row 1: Lab Affiliation (only show if exists, otherwise empty space) */}
            {patient.affiliation ? (
              <SectionContainer
                title="Lab Affiliation"
                className="h-full flex flex-col min-h-0"
                contentClassName="flex-1 min-h-0 p-4 flex items-center justify-center bg-gray-50/50"
              >
                <AffiliationCard
                  holderName={patient.fullName}
                  affiliation={patient.affiliation}
                />
              </SectionContainer>
            ) : (
              <div className="h-full min-h-0" />
            )}

            {/* Row 2: Reports - Same height as Related Orders on the left */}
            <SectionContainer
              title="Reports"
              className="h-full flex flex-col min-h-0"
              contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
            >
              {/* Reports based on Validated Orders */}
              {(() => {
                const patientOrders = ordersContext.getOrdersByPatient(
                  patient.id,
                );
                const reportableOrders = patientOrders.filter((order) =>
                  order.tests.some((test) => test.status === "validated"),
                );

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
                    {reportableOrders.map((order, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <Icon
                              name="pdf"
                              className="w-full h-full text-red-400"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium font-mono text-gray-900 truncate">
                              Report_{order.orderId}.pdf
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(order.orderDate).toLocaleDateString()} •
                              1.2 MB
                            </p>
                          </div>
                        </div>
                        <IconButton
                          variant="download"
                          size="sm"
                          title="Download Report"
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </SectionContainer>
          </div>
        </div>
      )}

      {patient && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          patient={patient}
          mode="edit"
        />
      )}
    </div>
  );
};
