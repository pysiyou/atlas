/**
 * Base Lab Card Component
 * Shared structure for SampleCard, ResultCard, and ValidationCard
 */

import React, { type ReactNode } from 'react';
import { Card, Badge } from '@/shared/ui';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import {
  LAB_CARD_TYPOGRAPHY,
  LAB_CARD_SPACING,
  LAB_CARD_CONTAINERS,
  LAB_CARD_LIST_ITEMS,
  LAB_CARD_CONTEXT,
  LAB_CARD_HEADER,
} from './labCardStyles';

interface PatientContext {
  patientName?: string;
  orderId: string;
  referringPhysician?: string;
}

interface SampleInfo {
  sampleId?: string;
  collectedAt?: string;
  collectedBy?: string;
}

interface LabCardProps {
  /** Click handler for the card */
  onClick?: (e: React.MouseEvent) => void;
  /** Patient and order context */
  context: PatientContext;
  /** Sample collection info */
  sampleInfo?: SampleInfo;
  /** Additional info line (e.g., result entry time) */
  additionalInfo?: ReactNode;
  /** Badge elements (left side of row 1) */
  badges: ReactNode;
  /** Action elements (right side of row 1) */
  actions: ReactNode;
  /** Content section (row 3 - gray background) */
  content: ReactNode;
  /** Section title for content area */
  contentTitle: string;
  /** Optional recollection banner (displayed before content section) */
  recollectionBanner?: ReactNode;
  /** Optional flags section */
  flags?: ReactNode;
  /** Optional className */
  className?: string;
}

/**
 * LabCard - Shared card structure for lab workflow cards
 *
 * Structure:
 * - Row 1: Badges (left) + Actions (right)
 * - Row 2: Patient/Order context
 * - Row 3: Content section with gray background
 * - Row 4: Optional flags
 */
export const LabCard: React.FC<LabCardProps> = ({
  onClick,
  context,
  sampleInfo,
  additionalInfo,
  badges,
  actions,
  content,
  contentTitle,
  recollectionBanner,
  flags,
  className = '',
}) => {
  const { getUserName } = useUserDisplay();

  return (
    <div className={`${LAB_CARD_CONTAINERS.cardWrapper} ${className}`} onClick={onClick}>
      <Card className={LAB_CARD_CONTAINERS.cardBase}>
        <div className={`flex flex-col ${LAB_CARD_SPACING.cardGap}`}>
          {/* Row 1: Badges and Actions */}
          <div className={LAB_CARD_HEADER.container}>
            <div className={LAB_CARD_HEADER.badgeGroup}>
              {badges}
            </div>
            <div className={LAB_CARD_HEADER.actionGroup}>
              {actions}
            </div>
          </div>

          {/* Row 2: Patient & Order context */}
          <div className={`flex flex-col ${LAB_CARD_SPACING.cardGap}`}>
            <div className={LAB_CARD_CONTEXT.container}>
              {context.patientName && (
                <>
                  <span className={LAB_CARD_CONTEXT.patientName}>{context.patientName}</span>
                  <span className={LAB_CARD_CONTEXT.separator}>|</span>
                </>
              )}
              <span>{context.orderId}</span>
              {context.referringPhysician && (
                <>
                  <span className={LAB_CARD_CONTEXT.separator}>|</span>
                  <span>{context.referringPhysician}</span>
                </>
              )}
            </div>

            {/* Sample collection info */}
            {sampleInfo?.sampleId && sampleInfo?.collectedAt && (
              <span className={LAB_CARD_TYPOGRAPHY.metadata}>
                Sample <span className={LAB_CARD_CONTEXT.patientName}>{sampleInfo.sampleId}</span> collected{' '}
                <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>{formatDate(sampleInfo.collectedAt)}</span>
                {sampleInfo.collectedBy && <span> by {getUserName(sampleInfo.collectedBy)}</span>}
              </span>
            )}

            {/* Additional info line */}
            {additionalInfo}
          </div>

          {/* Row 3: Content section */}
          <div className={LAB_CARD_CONTAINERS.contentSection}>
            <div className={`${LAB_CARD_TYPOGRAPHY.sectionTitle} ${LAB_CARD_SPACING.sectionTitleMargin}`}>
              {contentTitle}
            </div>
            {content}
          </div>

          {/* Row 4: Optional flags */}
          {flags}

          {/* Recollection Banner - displayed at the bottom */}
          {recollectionBanner}
        </div>
      </Card>
    </div>
  );
};

/**
 * InfoBadge - Styled badge for displaying counts or status
 */
interface InfoBadgeProps {
  count: number;
  total: number;
  label: string;
  isComplete?: boolean;
}

export const ProgressBadge: React.FC<InfoBadgeProps> = ({
  count,
  total,
  label,
  isComplete = false,
}) => (
  <div className="flex flex-col items-end gap-0.5">
    <Badge size="sm" variant={isComplete ? 'success' : 'warning'}>
      {count}/{total} {label}
    </Badge>
  </div>
);

/**
 * FlagsSection - Display flags with red styling
 */
interface FlagsSectionProps {
  flags: string[];
}

export const FlagsSection: React.FC<FlagsSectionProps> = ({ flags }) => {
  if (!flags.length) return null;

  return (
    <div className={LAB_CARD_CONTAINERS.flagsSection}>
      <div className={`${LAB_CARD_TYPOGRAPHY.flagTitle} ${LAB_CARD_SPACING.flagsTitleMargin}`}>
        Flags
      </div>
      <ul className={LAB_CARD_SPACING.flagsListGap}>
        {flags.map((flag, i) => (
          <li key={i} className={`flex items-center ${LAB_CARD_TYPOGRAPHY.flagText}`}>
            <span className={LAB_CARD_LIST_ITEMS.bulletRed} />
            {flag}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * TestList - Display list of tests with codes
 */
interface TestListProps {
  tests: Array<{ name: string; code: string }>;
}

export const TestList: React.FC<TestListProps> = ({ tests }) => (
  <ul className={LAB_CARD_SPACING.listGap}>
    {tests.map((test, i) => (
      <li key={test.code || i} className={LAB_CARD_LIST_ITEMS.testItem}>
        <span className={LAB_CARD_LIST_ITEMS.bullet} />
        <span className={LAB_CARD_LIST_ITEMS.testName}>{test.name}</span>
        <span className={LAB_CARD_LIST_ITEMS.testCode}>{test.code}</span>
      </li>
    ))}
  </ul>
);
