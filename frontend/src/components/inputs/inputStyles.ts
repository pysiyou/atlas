/**
 * Shared input styles for all text inputs and filter controls.
 * Single source of truth: border, text, hover, focus.
 */

import { CONTROL, RADIUS, SPACING, SURFACE, TYPE } from '@/components/theme/recipes';

/** Focus-within variant for wrappers (SearchControl, DebouncedSearchInput) */
const inputBorderFocusWithin =
  `border border-border-default ${RADIUS.field} transition-colors duration-200 ${CONTROL.hoverBorder} ${CONTROL.focusWithin}`;

/** Text and placeholder — same for all inputs and filter trigger content */
export const inputText =
  `${TYPE.value} font-normal placeholder:text-text-muted placeholder:font-normal`;

/** Filter trigger/dropdown content (date, select, price, age) — same as input text */
export const filterTriggerText = `${TYPE.value} font-normal`;

/** Full classes for a standalone <input> (e.g. Input.tsx) */
export const inputBase =
  `w-full ${SURFACE.raised} ${RADIUS.field} ${SPACING.pxSpace3} ${SPACING.pySpace2} ${TYPE.value} placeholder:text-text-muted transition-colors duration-200 ${CONTROL.hoverBorder} ${CONTROL.focus} disabled:bg-surface-hover disabled:text-text-disabled disabled:cursor-not-allowed`;

/** Inner input when inside a wrapper (no border, transparent bg) */
export const inputInner = 'flex-1 min-w-0 bg-transparent border-0 outline-none py-0';

/** Wrapper for search/filter input (icon + input in one box) */
export const inputWrapper = `group relative w-full flex items-center ${SPACING.gapInline} ${CONTROL.height} ${SPACING.pxSpace3} bg-surface ${inputBorderFocusWithin}`;

/** Trigger for filter dropdowns (MultiSelect, SingleSelect, Date, PriceRange) — same border/text/hover; open state applied via inputTriggerOpen */
export const inputTrigger =
  `group ${CONTROL.height} ${SPACING.pxSpace3} ${SURFACE.raised} ${RADIUS.field} transition-colors duration-200 ${CONTROL.hoverBorder} cursor-pointer flex items-center ${SPACING.gapInline}`;

/** Trigger open state (border + ring) */
export const inputTriggerOpen = CONTROL.open;

/** Clear (close-circle) button inside input/trigger — keeps icon vertically centered with other icons */
export const inputClearButton =
  `flex items-center justify-center leading-none p-space-0-5 ${RADIUS.field} transition-colors cursor-pointer`;

/** Error state for inputs */
export const inputError = CONTROL.error;

/** Compact form-field label (popover / modal / patient form sections). */
export const FORM_FIELD_LABEL = `block font-normal ${TYPE.meta}`;

/** Form control label sitting above an input (clickable, truncated). */
export const FORM_CONTROL_LABEL = `${FORM_FIELD_LABEL} cursor-pointer truncate min-w-0`;

/** Container for input wrappers (TagInput, TestSelect, PatientSelect, modal search) — same border/hover/focus-within */
export const inputContainerBase =
  `w-full ${SURFACE.raised} ${RADIUS.field} transition-colors duration-200 ${CONTROL.hoverBorder} ${CONTROL.focusWithin}`;

/** Container error state (focus-within) */
export const inputContainerError = CONTROL.errorWithin;
