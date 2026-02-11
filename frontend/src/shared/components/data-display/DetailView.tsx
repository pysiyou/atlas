/**
 * DetailView - Unified detail view component
 *
 * Provides a consistent detail page layout with flexible section organization.
 * Composes DetailPageShell and DetailPageHeader; keeps sections/customLayout/breadcrumbs API.
 */

import React, { type ReactNode } from 'react';
import { DetailPageShell, DetailPageHeader } from '../layouts';
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
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle?: string;
  /** Badge elements */
  badges?: ReactNode;
  /** Header action buttons */
  actions?: ReactNode;
  /** Layout type */
  layout?: DetailViewLayout;
  /** Sections to display */
  sections: DetailSection[];
  /** Custom layout component (for 'custom' layout type) */
  customLayout?: ReactNode;
  /** Back button handler */
  onBack?: () => void;
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: { message: string; operation?: string } | null;
  /** Error retry handler */
  onRetry?: () => void;
  /** Error dismiss handler */
  onDismissError?: () => void;
  className?: string;
}

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
  if (loading) {
    return (
      <DetailPageShell
        header={<DetailPageHeader title={title} />}
        loading
        loadingMessage="Loading details..."
      >
        {null}
      </DetailPageShell>
    );
  }

  const sortedSections = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const gridColumns =
    layout === 'single' ? 1 : layout === 'two-column' ? 2 : layout === 'three-column' ? 3 : 1;

  const header = (
    <>
      {breadcrumbs != null && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.onClick != null ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="hover:text-text-primary transition-colors cursor-pointer"
                >
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
      <div className="flex items-center gap-4 shrink-0">
        {onBack != null && (
          <button
            type="button"
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
        <DetailPageHeader title={title} subtitle={subtitle} badges={badges} actions={actions} />
      </div>
    </>
  );

  const content =
    layout === 'custom' && customLayout != null ? (
      customLayout
    ) : (
      <SectionGrid columns={gridColumns} gap="md">
        {sortedSections.map(section => (
          <div
            key={section.id}
            className={section.span != null && section.span > 1 ? `col-span-${section.span}` : ''}
          >
            {section.content}
          </div>
        ))}
      </SectionGrid>
    );

  return (
    <DetailPageShell
      header={header}
      error={error}
      onRetry={onRetry}
      onDismissError={onDismissError}
      className={className}
    >
      {content}
    </DetailPageShell>
  );
};
