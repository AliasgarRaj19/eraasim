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
export const IMAGE_DISPLAY_SIZES = ["small", "medium", "large", "full"] as const;
export type ImageDisplaySize = typeof IMAGE_DISPLAY_SIZES[number];

export function isImageDisplaySize(value: unknown): value is ImageDisplaySize {
  return typeof value === "string" && IMAGE_DISPLAY_SIZES.includes(value as ImageDisplaySize);
}
