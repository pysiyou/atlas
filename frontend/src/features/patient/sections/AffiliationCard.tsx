/**
 * AffiliationCard - Displays lab affiliation/insurance card
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { XCircle } from 'lucide-react';
import type { Affiliation } from '@/types';
import { isAffiliationActive } from '../usePatientForm';

interface AffiliationCardProps {
  holderName: string;
  affiliation?: Affiliation;
  className?: string;
}

export const AffiliationCard: React.FC<AffiliationCardProps> = ({
  holderName,
  affiliation,
  className = ""
}) => {
  const isActive = isAffiliationActive(affiliation);

  const formatAffiliationDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // If no affiliation, show placeholder card
  if (!affiliation) {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center ${className}`}
        aria-label={`No affiliation for ${holderName}`}
      >
        <div className="w-full h-full max-w-[340px] max-h-[180px]">
          <div className="w-full h-full rounded-xl overflow-hidden p-4 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white flex flex-col justify-between shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium tracking-wide text-white/90">Lab Affiliation</h3>
            </div>

            {/* Middle Section */}
            <div className="flex items-center justify-center flex-1">
              <p className="text-white/80 text-sm">No active affiliation</p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/60 font-medium">Holder</span>
                <span className="text-sm font-medium tracking-wide">{holderName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active card: vibrant gradient
  // Expired card: muted/gray gradient
  const gradientClass = isActive
    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'
    : 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      aria-label={`Affiliation card for ${holderName}`}
    >
      <div className="w-full h-full max-w-[340px] max-h-[180px]">
        <div className={`w-full h-full rounded-xl overflow-hidden p-4 ${gradientClass} text-white flex flex-col justify-between shadow-lg`}>
          {/* Header */}
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium tracking-wide text-white/90">Lab Affiliation</h3>
            <div className="flex items-center">
              {isActive ? (
                  <Icon 
                    name="verified" 
                    className="w-7 h-7 text-white" 
                    aria-label="Verified affiliation"
                  />
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-white/80" />
                  <span className="text-xs font-medium text-white/80">Expired</span>
                </>
              )}
            </div>
          </div>

          {/* Middle Section: Logo and Number */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm ${isActive ? 'text-teal-600' : 'text-gray-500'}`}>
               <Icon name="app-logo" className="w-5 h-5" />
            </div>

            {/* Assurance Number */}
            <div className="flex items-center gap-2">
              <div className="text-base font-bold tracking-wide text-white drop-shadow-sm">
                {affiliation.assuranceNumber}
              </div>
            </div>
          </div>

          {/* Footer: Holder and Expiry */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-white/60 font-medium">Holder</span>
              <span className="text-sm font-medium tracking-wide">{holderName}</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs text-white/60 font-medium">Expiry</span>
              <span className={`text-sm font-medium tracking-wide ${!isActive ? 'text-red-200' : ''}`}>
                {formatAffiliationDate(affiliation.endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
