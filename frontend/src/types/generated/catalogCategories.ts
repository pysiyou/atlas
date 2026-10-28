/**
 * Test catalog categories — GENERATED from contracts/test-catalog.json. DO NOT EDIT.
 */
export const TEST_CATEGORY_VALUES = ["biochemistry","coagulation","hematology","microbiology","serology","urinalysis"] as const;

export type GeneratedTestCategory = (typeof TEST_CATEGORY_VALUES)[number];

export const TEST_CATEGORY_CONFIG: Record<
  GeneratedTestCategory,
  { label: string; color: string }
> = {
  "biochemistry": { label: "Biochemistry", color: "biochemistry" },
  "coagulation": { label: "Coagulation", color: "coagulation" },
  "hematology": { label: "Hematology", color: "hematology" },
  "microbiology": { label: "Microbiology", color: "microbiology" },
  "serology": { label: "Serology", color: "serology" },
  "urinalysis": { label: "Urinalysis", color: "urinalysis" },
};

export function getGeneratedCategoryLabel(category: string): string {
  const known = TEST_CATEGORY_CONFIG[category as GeneratedTestCategory];
  if (known) return known.label;
  return category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}
