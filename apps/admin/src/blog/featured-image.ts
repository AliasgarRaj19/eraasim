export type FeaturedImageIntent = "keep" | "replace" | "remove";

export function resolveFeaturedImagePath(path: string | undefined, intent: FeaturedImageIntent) {
  if (intent === "remove") return null;
  const normalized = path?.trim();
  return normalized ? normalized : null;
}
