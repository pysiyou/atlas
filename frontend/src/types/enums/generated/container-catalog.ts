/** GENERATED from contracts/container-catalog.json. DO NOT EDIT. */
import type { ContainerTopColor } from './container-enums';

export const CONTAINER_CATALOG_VALUES = ["red-top","lavender-top","green-top","blue-top","yellow-top","gray-top","light-blue-top","pink-top","black-top","orange-top","royal-blue-top","white-top","tan-top","urine-cup","stool-container","swab-tube","gold-top","tiger-top","clear-top","cup","tube","other"] as const;

export type ContainerCatalogId = (typeof CONTAINER_CATALOG_VALUES)[number];

export const CONTAINER_CATALOG_CONFIG: Record<
  ContainerCatalogId,
  {
    label: string;
    additive?: string;
    commonUses: string;
    textClass?: string;
  }
> = {
  "red-top": { label: "Red Top", commonUses: "Serum chemistry, serology, immunology", additive: "None", textClass: "text-container-red-text" },
  "lavender-top": { label: "Lavender Top", commonUses: "CBC, blood typing", additive: "EDTA", textClass: "text-container-purple-text" },
  "green-top": { label: "Green Top", commonUses: "Plasma chemistry", additive: "Heparin", textClass: "text-container-green-text" },
  "blue-top": { label: "Blue Top", commonUses: "Coagulation tests", additive: "Sodium citrate", textClass: "text-container-blue-text" },
  "yellow-top": { label: "Yellow Top", commonUses: "Blood bank, HLA typing", additive: "ACD", textClass: "text-container-yellow-text" },
  "gray-top": { label: "Gray Top", commonUses: "Glucose, lactate", additive: "Sodium fluoride", textClass: "text-container-gray-text" },
  "light-blue-top": { label: "Light Blue Top", commonUses: "Coagulation", additive: "Sodium citrate", textClass: "text-cyan-fg-emphasis" },
  "pink-top": { label: "Pink Top", commonUses: "Blood bank", additive: "EDTA", textClass: "text-pink-fg-emphasis" },
  "black-top": { label: "Black Top", commonUses: "ESR", additive: "Sodium citrate", textClass: "text-container-black-text" },
  "orange-top": { label: "Orange Top", commonUses: "STAT serum chemistry", additive: "Thrombin", textClass: "text-orange-fg-emphasis" },
  "royal-blue-top": { label: "Royal Blue Top", commonUses: "Trace elements, toxicology", additive: "None / EDTA / Heparin", textClass: "text-indigo-fg-emphasis" },
  "white-top": { label: "White Top", commonUses: "Molecular diagnostics", additive: "EDTA with gel", textClass: "text-text-muted" },
  "tan-top": { label: "Tan Top", commonUses: "Lead testing", additive: "EDTA", textClass: "text-orange-fg-emphasis" },
  "urine-cup": { label: "Urine Cup", commonUses: "Urinalysis", textClass: "text-container-yellow-text" },
  "stool-container": { label: "Stool Container", commonUses: "Stool analysis", textClass: "text-orange-fg-emphasis" },
  "swab-tube": { label: "Swab Tube", commonUses: "Microbiology cultures", textClass: "text-teal-fg-emphasis" },
  "gold-top": { label: "Gold Top", commonUses: "Serum separator", additive: "Clot activator", textClass: "text-container-yellow-text" },
  "tiger-top": { label: "Tiger Top", commonUses: "Serum separator", additive: "Clot activator", textClass: "text-orange-fg-emphasis" },
  "clear-top": { label: "Clear Top", commonUses: "Discard tube", additive: "None", textClass: "text-text-disabled" },
  "cup": { label: "Cup", commonUses: "Urine, stool", additive: "None", textClass: "text-orange-fg-emphasis" },
  "tube": { label: "Tube", commonUses: "General collection", additive: "Various", textClass: "text-text-muted" },
  "other": { label: "Other", commonUses: "Miscellaneous", additive: "Various", textClass: "text-text-muted" },
};

export const CONTAINER_CATALOG_OPTIONS = CONTAINER_CATALOG_VALUES.map(value => ({
  value,
  label: CONTAINER_CATALOG_CONFIG[value].label,
}));

export const COLLECTION_TOP_COLOR_PRESETS = ["red-top","yellow-top","green-top","black-top","blue-top"] as ContainerCatalogId[];

export const CONTAINER_CATALOG_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Containers" },
  ...CONTAINER_CATALOG_OPTIONS,
];

/** Catalog preset id → API ContainerTopColor wire value for collection submit. */
export const FRONTEND_TO_BACKEND_COLOR: Record<string, ContainerTopColor> = {
  "red-top": "red",
  "lavender-top": "purple",
  "green-top": "green",
  "blue-top": "blue",
  "royal-blue-top": "blue",
  "yellow-top": "yellow",
  "gray-top": "gray",
  "light-blue-top": "light-blue",
  "pink-top": "pink",
  "black-top": "black",
  "orange-top": "orange",
  "white-top": "white",
  "clear-top": "clear",
  "gold-top": "yellow",
  "tiger-top": "orange",
  "tan-top": "orange",
};
