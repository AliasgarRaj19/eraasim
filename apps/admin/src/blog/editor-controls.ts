export const TEXT_COLORS = {
  dark: "#1f211d",
  gray: "#686b63",
  red: "#a42c2c",
  orange: "#b75d16",
  green: "#365b43",
  blue: "#285f9e",
  purple: "#70428f",
} as const;

export const ALLOWED_TEXT_COLORS = new Set<string>(Object.values(TEXT_COLORS));
export const MIN_IMAGE_WIDTH = 10;
export const MAX_IMAGE_WIDTH = 100;

export const LEGACY_IMAGE_WIDTHS = {
  small: 25,
  medium: 50,
  large: 75,
  full: 100,
} as const;

export function isValidImageWidth(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= MIN_IMAGE_WIDTH && value <= MAX_IMAGE_WIDTH;
}

export function imageWidthFromAttributes(width: unknown, displaySize: unknown) {
  if (isValidImageWidth(width)) return width;
  if (typeof displaySize === "string" && displaySize in LEGACY_IMAGE_WIDTHS) return LEGACY_IMAGE_WIDTHS[displaySize as keyof typeof LEGACY_IMAGE_WIDTHS];
  return MAX_IMAGE_WIDTH;
}

export function clampImageWidth(value: number) {
  return Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(value)));
}
