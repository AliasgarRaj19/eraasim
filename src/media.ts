import { readFile } from "node:fs/promises";
import path from "node:path";

const extensionTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
export const PUBLIC_MEDIA_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpe?g|png|webp|gif)$/i;

export function publicMediaUrl(value: string | null | undefined) {
  const match = /^\/api\/uploads\/([^/]+)$/.exec(value ?? "");
  return match && PUBLIC_MEDIA_PATTERN.test(match[1]) ? `/media/${match[1]}` : null;
}

export async function readPublicImage(filename: string) {
  const match = PUBLIC_MEDIA_PATTERN.exec(filename);
  if (!match) return null;
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_ROOT ?? path.join(process.cwd(), "storage", "uploads"));
  try { return { bytes: await readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ root, filename)), contentType: extensionTypes[match[2].toLowerCase()] }; }
  catch { return null; }
}
