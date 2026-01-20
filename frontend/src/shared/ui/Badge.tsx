import React from 'react';
import { cn } from '@/utils';

export type BadgeVariant = 
  // Base variants
  | 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'error' | 'success' | 'warning' | 'info' | 'purple' | 'orange' | 'teal'
  // Order Statuses
  | 'ordered' | 'in-progress' | 'completed' | 'delivered' | 'cancelled' | 'validated' | 'reported' | 'rejected'
  // Sample Statuses
  | 'pending' | 'collected' | 'received' | 'accessioned' | 'stored' | 'disposed' | 'sample-collected'
  // Appointment Statuses
  | 'scheduled' | 'confirmed' | 'no-show'
  // Payment Statuses
  | 'partial' | 'paid' | 'unpaid'
  // Priorities
  | 'routine' | 'urgent' | 'stat'
  // Test Categories
  | 'hematology' | 'biochemistry' | 'microbiology' | 'serology' | 'urinalysis' | 'imaging' | 'immunology' | 'molecular' | 'toxicology' | 'coagulation' | 'chemistry'
  // Sample Types
  | 'blood' | 'urine' | 'stool' | 'swab' | 'tissue' | 'fluid' | 'csf' | 'sputum' | 'other' | 'plasma' | 'serum'
  // Sex/Gender
  | 'male' | 'female'
  // Medical History
  | 'chronic-condition' | 'medication' | 'allergy' | 'surgery'
  // Container Top Colors (for physical tube representation)
  | 'container-red' | 'container-yellow' | 'container-purple' | 'container-blue' | 'container-green' | 'container-gray' | 'container-black'
  // Payment Methods
  | 'cash' | 'credit-card' | 'debit-card' | 'insurance' | 'bank-transfer' | 'mobile-money'
  // User Roles
  | 'receptionist' | 'lab-technician' | 'pathologist' | 'administrator'
  // Arbitrary string fallback
  | (string & {});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
}

// Maps specific domain keys (status, priority, etc.) to base visual styles
const VARIANT_STYLES: Record<string, string> = {
  // Base Colors
  default: 'bg-gray-100 text-gray-800 border-transparent',
  primary: 'bg-sky-100 text-sky-800 border-transparent',
  secondary: 'bg-gray-100 text-gray-800 border-transparent', // Same as default for now
  outline: 'text-gray-800 border-gray-200 bg-transparent',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
  danger: 'bg-red-100 text-red-800 border-transparent',
  error: 'bg-red-100 text-red-800 border-transparent',
  success: 'bg-green-100 text-green-800 border-transparent',
  warning: 'bg-yellow-100 text-yellow-800 border-transparent',
  info: 'bg-blue-100 text-blue-800 border-transparent',
  purple: 'bg-purple-100 text-purple-800 border-transparent',
  orange: 'bg-orange-100 text-orange-800 border-transparent',
  teal: 'bg-teal-100 text-teal-800 border-transparent',

  // Order Status Mappings
  'ordered': 'bg-blue-100 text-blue-800 border-transparent',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-transparent',
  'completed': 'bg-green-100 text-green-800 border-transparent',
  'delivered': 'bg-gray-100 text-gray-800 border-transparent',
  'cancelled': 'bg-red-100 text-red-800 border-transparent',
  'validated': 'bg-green-100 text-green-800 border-transparent',
  'reported': 'bg-gray-100 text-gray-800 border-transparent',
  'rejected': 'bg-red-100 text-red-800 border-transparent',

  // Sample Status Mappings
  'pending': 'bg-yellow-100 text-yellow-800 border-transparent',
  'collected': 'bg-green-100 text-green-800 border-transparent',
  'received': 'bg-blue-100 text-blue-800 border-transparent',
  'accessioned': 'bg-indigo-100 text-indigo-800 border-transparent',
  'stored': 'bg-gray-100 text-gray-800 border-transparent',
  'disposed': 'bg-gray-200 text-gray-800 border-transparent',
  'sample-collected': 'bg-teal-100 text-teal-800 border-transparent',

  // Appointment Status Mappings
  'scheduled': 'bg-blue-100 text-blue-800 border-transparent',
  'confirmed': 'bg-green-100 text-green-800 border-transparent',
  'no-show': 'bg-orange-100 text-orange-800 border-transparent',

  // Payment Status Mappings
  'partial': 'bg-orange-100 text-orange-800 border-transparent',
  'paid': 'bg-green-100 text-green-800 border-transparent',
  'unpaid': 'bg-red-100 text-red-800 border-transparent',
  
  // Priority Mappings
  'routine': 'bg-blue-100 text-blue-800 border-transparent',
  'urgent': 'bg-orange-100 text-orange-800 border-transparent',
  'stat': 'bg-red-100 text-red-800 border-transparent font-bold',

  // Sample Type Mappings
  'blood': 'bg-red-100 text-red-800 border-transparent',
  'plasma': 'bg-emerald-100 text-emerald-800 border-transparent',
  'serum': 'bg-amber-100 text-amber-800 border-transparent',
  'urine': 'bg-yellow-100 text-yellow-800 border-transparent',
  'stool': 'bg-orange-100 text-orange-800 border-transparent',
  'swab': 'bg-teal-100 text-teal-800 border-transparent',
  'tissue': 'bg-purple-100 text-purple-800 border-transparent',
  'csf': 'bg-blue-100 text-blue-800 border-transparent',
  'sputum': 'bg-gray-100 text-gray-800 border-transparent',
  'fluid': 'bg-cyan-100 text-cyan-800 border-transparent',
  'other': 'bg-gray-100 text-gray-800 border-transparent',
  'unknown': 'bg-gray-100 text-gray-800 border-transparent',

  // Test Category Mappings
  'hematology': 'bg-pink-100 text-pink-800 border-transparent',
  'biochemistry': 'bg-blue-100 text-blue-800 border-transparent', 
  'chemistry': 'bg-blue-100 text-blue-800 border-transparent',
  'microbiology': 'bg-emerald-100 text-emerald-800 border-transparent',
  'serology': 'bg-purple-100 text-purple-800 border-transparent',
  'urinalysis': 'bg-yellow-100 text-yellow-800 border-transparent',
  'imaging': 'bg-gray-100 text-gray-800 border-transparent',
  'immunology': 'bg-indigo-100 text-indigo-800 border-transparent',
  'molecular': 'bg-cyan-100 text-cyan-800 border-transparent',
  'toxicology': 'bg-red-100 text-red-800 border-transparent',
  'coagulation': 'bg-rose-100 text-rose-800 border-transparent',

  // Sex Mappings
  'male': 'bg-blue-50 text-blue-700 border-blue-200',
  'female': 'bg-pink-50 text-pink-700 border-pink-200',

  // Medical History Mappings
  'chronic-condition': 'bg-blue-50 text-blue-700 border-transparent',
  'medication': 'bg-green-50 text-green-700 border-transparent',
  'allergy': 'bg-orange-50 text-orange-700 border-transparent',
  'surgery': 'bg-purple-50 text-purple-700 border-transparent',

  // Container Top Color Mappings (solid colors for physical tube representation)
  'container-red': 'bg-red-500 text-white border-transparent',
  'container-yellow': 'bg-yellow-500 text-white border-transparent',
  'container-purple': 'bg-purple-500 text-white border-transparent',
  'container-blue': 'bg-blue-500 text-white border-transparent',
  'container-green': 'bg-green-500 text-white border-transparent',
  'container-gray': 'bg-gray-500 text-white border-transparent',
  'container-black': 'bg-black text-white border-transparent',

  // Payment Method Mappings
  'cash': 'bg-emerald-100 text-emerald-800 border-transparent',
  'credit-card': 'bg-sky-100 text-sky-800 border-transparent',
  'debit-card': 'bg-blue-100 text-blue-800 border-transparent',
  'insurance': 'bg-purple-100 text-purple-800 border-transparent',
  'bank-transfer': 'bg-indigo-100 text-indigo-800 border-transparent',
  'mobile-money': 'bg-orange-100 text-orange-800 border-transparent',

  // User Role Mappings
  'receptionist': 'bg-blue-100 text-blue-800 border-transparent',
  'lab-technician': 'bg-green-100 text-green-800 border-transparent',
  'pathologist': 'bg-purple-100 text-purple-800 border-transparent',
  'administrator': 'bg-red-100 text-red-800 border-transparent',
};

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

// Custom display labels for variants (shorter/abbreviated versions)
const VARIANT_LABELS: Record<string, string> = {
  'sample-collected': 'COLLECTED',
  'in-progress': 'IN PROGRESS',
  'no-show': 'NO SHOW',
  'chronic-condition': 'CHRONIC',
  // Payment method labels
  'credit-card': 'CREDIT CARD',
  'debit-card': 'DEBIT CARD',
  'bank-transfer': 'BANK TRANSFER',
  'mobile-money': 'MOBILE MONEY',
};

/**
 * Badge Component
 * 
 * Displays a small badge with color variants.
 * Uses a single `variant` prop to determine styling based on:
 * - Base colors (primary, danger, etc.)
 * - Status (ordered, completed, etc.)
 * - Priority (urgent, stat, etc.)
 * - Sample Type (blood, urine, etc.)
 * - Sex (male, female)
 * 
 * If `children` is omitted, it will try to format the `variant` string to display.
 */
export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  size = 'md', 
  children,
  ...props 
}) => {
  // Normalize variant to lowercase string for lookup
  const normalizedVariant = String(variant).toLowerCase();
  
  // Lookup style or fallback to default
  const variantClass = VARIANT_STYLES[normalizedVariant] || VARIANT_STYLES['default'];
  
  // Auto-generate content if children is missing (and it's not a generic variant like 'default')
  let content = children;
  
  if (!content && variant !== 'default') {
    // Use custom label if available, otherwise format the variant string
    content = VARIANT_LABELS[normalizedVariant] || String(variant).replace(/-/g, ' ').toUpperCase();
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center font-medium rounded-sm border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantClass,
        SIZES[size],
        className
      )}
      {...props}
    >
      {content}
    </div>
  );
};
