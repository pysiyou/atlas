/**
 * Shared input styles for all text inputs and filter controls.
 * Single source of truth: border, text, hover, focus.
 */

/** Focus-within variant for wrappers (SearchBar, SearchControl) */
const inputBorderFocusWithin =
  'border border-stroke rounded transition-colors duration-200 hover:border-stroke-hover focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20';

/** Text and placeholder — same for all inputs and filter trigger content */
export const inputText =
  'text-xs text-fg font-normal placeholder:text-fg-faint placeholder:font-normal';

/** Filter trigger/dropdown content (date, select, price, age) — same as input text */
export const filterTriggerText = 'text-xs text-fg font-normal';

/** Full classes for a standalone <input> (e.g. Input.tsx) */
export const inputBase =
  'w-full rounded border border-stroke px-3 py-2 text-xs text-fg bg-panel placeholder:text-fg-faint transition-colors duration-200 hover:border-stroke-hover focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand disabled:bg-neutral-100 disabled:text-fg-disabled disabled:cursor-not-allowed';

/** Inner input when inside a wrapper (no border, transparent bg) */
export const inputInner = 'flex-1 min-w-0 bg-transparent border-0 outline-none py-0';

/** Wrapper for search/filter input (icon + input in one box) */
export const inputWrapper =
  'group relative w-full flex items-center gap-2 h-[34px] px-3 bg-panel ' +
  inputBorderFocusWithin;

/** Trigger for filter dropdowns (MultiSelect, SingleSelect, Date, PriceRange) — same border/text/hover; open state applied via inputTriggerOpen */
export const inputTrigger =
  'group h-[34px] px-3 bg-panel border border-stroke rounded transition-colors duration-200 hover:border-stroke-hover cursor-pointer flex items-center gap-2';

/** Trigger open state (border + ring) */
export const inputTriggerOpen = 'border-brand ring-1 ring-brand ring-opacity-20';

/** Error state for inputs */
export const inputError =
  'border-stroke-error focus:border-stroke-error focus:ring-danger focus:ring-opacity-20';

/** Container for input wrappers (TagInput, TestSelect, PatientSelect, modal search) — same border/hover/focus-within */
export const inputContainerBase =
  'w-full rounded border border-stroke bg-panel transition-colors duration-200 hover:border-stroke-hover focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20';

/** Container error state (focus-within) */
export const inputContainerError =
  'border-stroke-error focus-within:border-stroke-error focus-within:ring-danger focus-within:ring-opacity-20';
