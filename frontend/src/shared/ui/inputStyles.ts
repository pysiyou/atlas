/**
 * Shared input styles for all text inputs and filter controls.
 * Single source of truth: border, text, hover, focus.
 */

/** Focus-within variant for wrappers (SearchBar, SearchControl) */
const inputBorderFocusWithin =
  'border border-border-default rounded transition-colors duration-200 hover:border-border-hover focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20';

/** Text and placeholder — same for all inputs and filter trigger content */
export const inputText =
  'text-xs text-text-primary font-normal placeholder:text-text-muted placeholder:font-normal';

/** Filter trigger/dropdown content (date, select, price, age) — same as input text */
export const filterTriggerText = 'text-xs text-text-primary font-normal';

/** Full classes for a standalone <input> (e.g. Input.tsx) */
export const inputBase =
  'w-full rounded border border-border-default px-3 py-2 text-xs text-text-primary bg-surface placeholder:text-text-muted transition-colors duration-200 hover:border-border-hover focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand disabled:bg-neutral-100 disabled:text-text-disabled disabled:cursor-not-allowed';

/** Inner input when inside a wrapper (no border, transparent bg) */
export const inputInner = 'flex-1 min-w-0 bg-transparent border-0 outline-none py-0';

/** Wrapper for search/filter input (icon + input in one box) */
export const inputWrapper = `group relative w-full flex items-center gap-2 h-[34px] px-3 bg-surface ${inputBorderFocusWithin}`;

/** Trigger for filter dropdowns (MultiSelect, SingleSelect, Date, PriceRange) — same border/text/hover; open state applied via inputTriggerOpen */
export const inputTrigger =
  'group h-[34px] px-3 bg-surface border border-border-default rounded transition-colors duration-200 hover:border-border-hover cursor-pointer flex items-center gap-2';

/** Trigger open state (border + ring) */
export const inputTriggerOpen = 'border-brand ring-1 ring-brand ring-opacity-20';

/** Error state for inputs */
export const inputError =
  'border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20';

/** Container for input wrappers (TagInput, TestSelect, PatientSelect, modal search) — same border/hover/focus-within */
export const inputContainerBase =
  'w-full rounded border border-border-default bg-surface transition-colors duration-200 hover:border-border-hover focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20';

/** Container error state (focus-within) */
export const inputContainerError =
  'border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20';
