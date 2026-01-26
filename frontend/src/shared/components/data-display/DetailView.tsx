/**
 * DetailView - Unified detail view component
 *
 * Provides a consistent detail page layout with flexible section organization.
 * Used across all entity detail pages (Patient, Order, etc.).
 */

import React, { type ReactNode } from 'react';
import { LoadingState } from '../LoadingState';
import { ErrorAlert } from '../ErrorAlert';
import { SectionGrid } from '../sections';

export type DetailViewLayout = 'single' | 'two-column' | 'three-column' | 'custom';

export interface DetailSection {
  /** Unique section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section content */
  content: ReactNode;
  /** Grid column span (1-3) */
  span?: 1 | 2 | 3;
  /** Display order */
  order?: number;
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

export interface DetailViewProps {
  // Header
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle?: string;
  /** Badge elements */
  badges?: ReactNode;
  /** Header action buttons */
  actions?: ReactNode;

  // Layout
  /** Layout type */
  layout?: DetailViewLayout;
  /** Sections to display */
  sections: DetailSection[];
  /** Custom layout component (for 'custom' layout type) */
  customLayout?: ReactNode;

  // Navigation
  /** Back button handler */
  onBack?: () => void;
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;

  // State
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: { message: string; operation?: string } | null;
  /** Error retry handler */
  onRetry?: () => void;
  /** Error dismiss handler */
  onDismissError?: () => void;

  // Additional props
  /** Additional CSS classes */
  className?: string;
}

/**
 * DetailView component
 *
 * @example
 * ```tsx
 * <DetailView
 *   title="John Doe"
 *   subtitle="Patient Details"
 *   badges={<Badge variant="active" />}
 *   actions={<Button>Edit</Button>}
 *   layout="two-column"
 *   sections={[
 *     { id: 'info', title: 'General Info', content: <InfoSection /> },
 *     { id: 'history', title: 'Medical History', content: <HistorySection /> },
 *   ]}
 * />
 * ```
 */
export const DetailView: React.FC<DetailViewProps> = ({
  title,
  subtitle,
  badges,
  actions,
  layout = 'two-column',
  sections,
  customLayout,
  onBack,
  breadcrumbs,
  loading = false,
  error = null,
  onRetry,
  onDismissError,
  className = '',
}) => {
  // Show loading state
  if (loading) {
    return <LoadingState message="Loading details..." fullScreen />;
  }

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Determine grid columns based on layout
  const gridColumns =
    layout === 'single' ? 1 : layout === 'two-column' ? 2 : layout === 'three-column' ? 3 : 1;

  return (
    <div className={`h-full flex flex-col p-6 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.onClick ? (
                <button onClick={crumb.onClick} className="hover:text-text-primary transition-colors cursor-pointer">
                  {crumb.label}
                </button>
              ) : (
                <span className="text-text-primary">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span className="text-text-disabled">/</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-medium text-text-primary">{title}</h1>
              {badges}
            </div>
            {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert error={error} onDismiss={onDismissError} onRetry={onRetry} className="mb-4" />
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {layout === 'custom' && customLayout ? (
          customLayout
        ) : (
          <SectionGrid columns={gridColumns} gap="md">
            {sortedSections.map(section => (
              <div
                key={section.id}
                className={section.span && section.span > 1 ? `col-span-${section.span}` : ''}
              >
                {section.content}
              </div>
            ))}
          </SectionGrid>
        )}
      </div>
    </div>
  );
};
