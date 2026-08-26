/**
 * InfoBanner - Unified flat section header for lab workflows.
 *
 * Canonical style matches "Required for" on sample cards (uppercase label, content below).
 */

import React, { type ReactNode } from 'react';
import { LAB_CARD_SPACING, LAB_CARD_LIST_ITEMS } from '../utils/lab-styles';

const TITLE_CLASS = 'text-xxs font-medium text-text-tertiary uppercase tracking-wide';

interface InfoBannerProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({ title, children, className }) => {
  const hasChildren = children != null && children !== false;

  return (
    <div className={className}>
      <div className={hasChildren ? LAB_CARD_SPACING.sectionTitleMargin : ''}>
        <span className={TITLE_CLASS}>{title}</span>
      </div>
      {hasChildren ? children : null}
    </div>
  );
};

export interface InfoBannerListRow {
  primary: string;
  secondary?: string;
}

/** Bullet list matching TestList / "Required for" — one item per row. */
export const InfoBannerList: React.FC<{ items: InfoBannerListRow[] }> = ({ items }) => (
  <ul className={LAB_CARD_SPACING.listGap}>
    {items.map((item, index) => (
      <li key={index} className={LAB_CARD_LIST_ITEMS.testItem}>
        <span className={LAB_CARD_LIST_ITEMS.bullet} />
        <span className={LAB_CARD_LIST_ITEMS.testName}>{item.primary}</span>
        {item.secondary ? (
          <span className={LAB_CARD_LIST_ITEMS.testCode}>{item.secondary}</span>
        ) : null}
      </li>
    ))}
  </ul>
);

/** Map plain strings to list rows (e.g. rejection criteria) */
export function stringsToInfoBannerListRows(items: string[]): InfoBannerListRow[] {
  return items.map(text => ({ primary: text }));
}
