import React from 'react';

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

/**
 * Reusable detail field component for displaying label-value pairs uniformly
 * Uses a flex layout to justify content between label and value
 */
export const DetailField: React.FC<DetailFieldProps> = ({ 
  label, 
  value, 
  className = '', 
  labelClassName = 'text-gray-600', 
  valueClassName = 'font-medium text-gray-900 text-right' 
}) => (
  <div className={`flex items-center justify-between text-sm ${className}`}>
    <span className={labelClassName}>{label}</span>
    <span className={valueClassName}>{value}</span>
  </div>
);
