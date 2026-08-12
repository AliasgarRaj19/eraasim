export const PUBLIC_MEDIA_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpe?g|png|webp|gif)$/i;
export function publicMediaUrl(value: string | null | undefined) { const match = /^\/api\/uploads\/([^/]+)$/.exec(value ?? ""); return match && PUBLIC_MEDIA_PATTERN.test(match[1]) ? `/media/${match[1]}` : null; }
