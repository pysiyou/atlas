/**
 * LabSectionPanel — modal section blocks with the same title size/font as card InfoBanner.
 */

import React from 'react';
import { SectionPanel, type SectionPanelProps } from '@/components';
import { cn } from '@/utils';
import { LAB_SECTION_PANEL } from '../utils/labStyles';

export const LabSectionPanel: React.FC<SectionPanelProps> = ({
  className,
  headerClassName,
  titleClassName,
  contentClassName,
  spacing = 'normal',
  ...props
}) => (
  <SectionPanel
    {...props}
    spacing={spacing}
    className={cn(LAB_SECTION_PANEL.wrapper, className)}
    headerClassName={cn(LAB_SECTION_PANEL.header, headerClassName)}
    titleClassName={cn(LAB_SECTION_PANEL.title, titleClassName)}
    contentClassName={cn(LAB_SECTION_PANEL.content, contentClassName)}
  />
);
