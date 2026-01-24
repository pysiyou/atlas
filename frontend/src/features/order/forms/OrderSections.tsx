/**
 * OrderSections Component
 * Displays order and patient information sections
 */

import React from 'react';
import { SectionContainer, Badge } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { Order, Patient } from '@/types';

interface OrderSectionsProps {
  order: Order;
  patient: Patient | null;
}

/**
 * Displays order information and patient details
 */
export const OrderSections: React.FC<OrderSectionsProps> = ({ order, patient }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Order Information Section */}
      <SectionContainer title="Order Information">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{displayId.order(order.orderId)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order Date:</span>
            <span className="font-medium">{formatDate(order.orderDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Priority:</span>
            <Badge
              variant={
                order.priority === 'stat'
                  ? 'danger'
                  : order.priority === 'urgent'
                    ? 'warning'
                    : 'info'
              }
              size="sm"
            >
              {order.priority.toUpperCase()}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <Badge variant="info" size="sm">
              {order.overallStatus.toUpperCase()}
            </Badge>
          </div>
          {order.referringPhysician && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Referring Physician:</span>
              <span className="font-medium">{order.referringPhysician}</span>
            </div>
          )}
          {order.clinicalNotes && (
            <div className="pt-3 border-t">
              <div className="text-sm text-gray-600 mb-1">Clinical Notes:</div>
              <div className="text-sm text-gray-900">{order.clinicalNotes}</div>
            </div>
          )}
        </div>
      </SectionContainer>

      {/* Patient Information Section */}
      <SectionContainer title="Patient Information">
        {patient ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{patient.fullName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Patient ID:</span>
              <span className="font-medium">{displayId.patient(patient.id)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date of Birth:</span>
              <span className="font-medium">{formatDate(patient.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gender:</span>
              <span className="font-medium capitalize">{patient.gender}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{patient.phone}</span>
            </div>
            {patient.email && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{patient.email}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Patient information not available</div>
        )}
      </SectionContainer>
    </div>
  );
};
