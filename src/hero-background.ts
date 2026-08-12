export function resolveHeroBackgroundVisibility(value: number) {
  const intensity = Math.min(200, Math.max(0, value));
  return intensity <= 100
    ? { imageOpacity: intensity / 100, overlayOpacity: 0.82 }
    : { imageOpacity: 1, overlayOpacity: 0.82 * ((200 - intensity) / 100) };
}
