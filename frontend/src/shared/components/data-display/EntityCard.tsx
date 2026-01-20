/**
 * EntityCard - Generic base card component
 * 
 * Provides a consistent card structure that can be extended by feature-specific cards.
 * This is the foundation for PatientCard, OrderCard, LabCard, and PaymentCard.
 */

import React, { type ReactNode } from 'react';
import { Card } from '@/shared/ui';

export interface EntityCardContext {
  /** Primary context information (e.g., patient name, order ID) */
  primary?: ReactNode;
  /** Secondary context information (e.g., order ID, physician) */
  secondary?: ReactNode;
  /** Tertiary context information (e.g., dates, additional metadata) */
  tertiary?: ReactNode;
}

export interface EntityCardProps {
  /** Card title/header */
  title: ReactNode;
  /** Badge elements to display in header */
  badges?: ReactNode;
  /** Action elements (buttons, popovers) */
  actions?: ReactNode;
  /** Context information (patient, order, etc.) */
  context?: EntityCardContext;
  /** Metadata line (e.g., "Sample collected on...") */
  metadata?: ReactNode;
  /** Main content area */
  content: ReactNode;
  /** Content section title */
  contentTitle?: string;
  /** Alert/banner to display (e.g., recollection notice) */
  banner?: ReactNode;
  /** Flags or warnings */
  flags?: ReactNode;
  /** Additional info section */
  additionalInfo?: ReactNode;
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Additional CSS classes */
  className?: string;
  /** Content area CSS classes */
  contentClassName?: string;
}

/**
 * EntityCard - Base card component for all entity types
 * 
 * @example
 * ```tsx
 * <EntityCard
 *   title="John Doe"
 *   badges={<><Badge variant="urgent" /><Badge variant="blood" /></>}
 *   actions={<Button>Collect</Button>}
 *   context={{ primary: "John Doe", secondary: "ORD-001" }}
 *   content={<div>Card content</div>}
 *   onClick={() => openModal()}
 * />
 * ```
 */
export const EntityCard: React.FC<EntityCardProps> = ({
  title,
  badges,
  actions,
  context,
  metadata,
  content,
  contentTitle,
  banner,
  flags,
  additionalInfo,
  onClick,
  className = '',
  contentClassName = '',
}) => {
  return (
    <div className={`cursor-pointer ${className}`} onClick={onClick}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-3">
          {/* Row 1: Title, Badges, and Actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0 flex-1">
              {typeof title === 'string' ? (
                <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              ) : (
                title
              )}
              {badges}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>

          {/* Row 2: Context Information */}
          {context && (
            <div className="flex flex-col gap-1.5">
              {(context.primary || context.secondary || context.tertiary) && (
                <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                  {context.primary}
                  {context.primary && context.secondary && (
                    <span className="text-gray-300">|</span>
                  )}
                  {context.secondary}
                  {context.secondary && context.tertiary && (
                    <span className="text-gray-300">|</span>
                  )}
                  {context.tertiary}
                </div>
              )}
              {metadata && (
                <div className="text-xs text-gray-500">
                  {metadata}
                </div>
              )}
            </div>
          )}

          {/* Additional Info (e.g., recollection badges) */}
          {additionalInfo}

          {/* Row 3: Content Section */}
          {content && (
            <div className={`bg-gray-50 rounded-md p-3 border border-gray-100 ${contentClassName}`}>
              {contentTitle && (
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {contentTitle}
                </div>
              )}
              {content}
            </div>
          )}

          {/* Row 4: Flags */}
          {flags}

          {/* Row 5: Banner (e.g., recollection notice) */}
          {banner}
        </div>
      </Card>
    </div>
  );
};
