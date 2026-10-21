/**
 * Form field and filter control chrome.
 */

import { CONTROL } from './control';
import { RADIUS, SPACING } from './spacing';
import { SURFACE } from './surface';
import { TYPE } from './type';

const inputBorderFocusWithin =
  `border border-border-default ${RADIUS.field} transition-colors duration-200 ${CONTROL.hoverBorder} ${CONTROL.focusWithin}`;

export const inputText =
  `${TYPE.value} font-normal placeholder:text-text-muted placeholder:font-normal`;

export const filterTriggerText = `${TYPE.value} font-normal`;

export const inputBase =
  `w-full ${SURFACE.raised} ${RADIUS.field} ${SPACING.pxSpace3} ${SPACING.pySpace2} ${TYPE.value} placeholder:text-text-muted transition-colors duration-200 ${CONTROL.hoverBorder} ${CONTROL.focus} disabled:bg-surface-hover disabled:text-text-disabled disabled:cursor-not-allowed`;

export const inputInner = 'flex-1 min-w-0 bg-transparent border-0 outline-none py-0';

export const inputWrapper = `group relative w-full flex items-center ${SPACING.gapInline} ${CONTROL.height} ${SPACING.pxSpace3} bg-surface ${inputBorderFocusWithin}`;

export const inputTrigger =
  `group ${CONTROL.height} ${SPACING.pxSpace3} ${SURFACE.raised} ${RADIUS.field} transition-colors duration-200 ${CONTROL.hoverBorder} cursor-pointer flex items-center ${SPACING.gapInline}`;

export const inputTriggerOpen = CONTROL.open;

export const inputClearButton =
  `flex items-center justify-center leading-none p-space-0-5 ${RADIUS.field} transition-colors cursor-pointer`;

export const inputError = CONTROL.error;

export const FORM_FIELD_LABEL = `block font-normal ${TYPE.meta}`;

export const FORM_CONTROL_LABEL = `${FORM_FIELD_LABEL} cursor-pointer truncate min-w-0`;

export const inputContainerBase =
  `w-full ${SURFACE.raised} ${RADIUS.field} transition-colors duration-200 ${CONTROL.hoverBorder} ${CONTROL.focusWithin}`;

export const inputContainerError = CONTROL.errorWithin;
