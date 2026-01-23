import React from 'react';
import { isAffiliationActive } from '../usePatientForm';
import type { Affiliation } from '@/types';

interface AffiliationCardProps {
  holderName: string;
  affiliation: Affiliation;
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

  // Active card: professional matte gradient (teal/slate)
  // Expired card: muted/gray gradient
  const gradientClass = isActive
    ? 'bg-gradient-to-br from-teal-700 via-slate-700 to-slate-800'
    : 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      aria-label={`Affiliation card for ${holderName}`}
    >
      <div className="w-full max-w-sm aspect-[1.586/1] rounded-xl shadow-lg relative overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
        
        {/* Background & Content Wrapper */}
        <div className={`w-full h-full p-5 ${gradientClass} text-white flex flex-col justify-between`}>
          
          {/* Decorative Circles (Glassmorphism effect) */}
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center">
              <h3 className="text-sm font-semibold tracking-wide text-white/90 uppercase">Lab Affiliation</h3>
            </div>
            
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm border ${isActive ? 'bg-white/20 border-white/30 text-white' : 'bg-red-500/20 border-red-400/30 text-red-100'}`}>
              {isActive ? 'Active' : 'Expired'}
            </div>
          </div>

          {/* Middle Section: Chip & Number */}
          <div className="flex flex-col gap-4 relative z-10 my-auto">
            {/* Chip Icon */}
            <div className="w-10 h-8 rounded-md bg-gradient-to-tr from-yellow-200 to-yellow-400 opacity-80 shadow-inner border border-yellow-500/30 flex items-center justify-center">
              <div className="w-6 h-5 border border-yellow-600/20 rounded-[2px]" />
            </div>

            {/* Assurance Number */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-white/60 tracking-widest font-medium">Assurance Number</span>
              <div className="text-xl font-mono font-bold tracking-widest text-white drop-shadow-sm truncate">
                {affiliation.assuranceNumber}
              </div>
            </div>
          </div>

          {/* Footer: Holder and Expiry */}
          <div className="flex justify-between items-end relative z-10">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-white/60 tracking-widest font-medium mb-0.5">Holder Name</span>
              <span className="text-sm font-medium tracking-wide truncate max-w-[160px]">{holderName}</span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase text-white/60 tracking-widest font-medium mb-0.5">Expires</span>
              <span className={`text-sm font-medium tracking-wide font-mono ${!isActive ? 'text-red-200' : ''}`}>
                {formatAffiliationDate(affiliation.endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
