/** GENERATED from contracts/enums.json. DO NOT EDIT. */
export const CONTAINER_TYPE_VALUES = ["tube", "cup"] as const;

export type ContainerType = (typeof CONTAINER_TYPE_VALUES)[number];

export const CONTAINER_TYPE_CONFIG: Record<ContainerType, { label: string }> = {
  "tube": { label: "Tube" },
  "cup": { label: "Cup" },
};

export const CONTAINER_TYPE_OPTIONS = CONTAINER_TYPE_VALUES.map(value => ({
  value,
  label: CONTAINER_TYPE_CONFIG[value].label,
}));

export const CONTAINER_TOP_COLOR_VALUES = ["red", "purple", "blue", "green", "gray", "yellow", "light-blue", "pink", "white", "black", "orange", "clear"] as const;

export type ContainerTopColor = (typeof CONTAINER_TOP_COLOR_VALUES)[number];

export const CONTAINER_TOP_COLOR_CONFIG: Record<ContainerTopColor, { label: string }> = {
  "red": { label: "Red" },
  "purple": { label: "Purple" },
  "blue": { label: "Blue" },
  "green": { label: "Green" },
  "gray": { label: "Gray" },
  "yellow": { label: "Yellow" },
  "light-blue": { label: "Light Blue" },
  "pink": { label: "Pink" },
  "white": { label: "White" },
  "black": { label: "Black" },
  "orange": { label: "Orange" },
  "clear": { label: "Clear" },
};

export const CONTAINER_TOP_COLOR_OPTIONS = CONTAINER_TOP_COLOR_VALUES.map(value => ({
  value,
  label: CONTAINER_TOP_COLOR_CONFIG[value].label,
}));

