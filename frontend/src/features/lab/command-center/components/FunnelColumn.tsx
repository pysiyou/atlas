/**
 * FunnelColumn - Single stage column (Pre-Analytical / Analytical / Post-Analytical).
 */

import React from 'react';

export interface FunnelColumnProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const FunnelColumn: React.FC<FunnelColumnProps> = ({ title, children, className }) => {
  return (
    <div className={className}>
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
