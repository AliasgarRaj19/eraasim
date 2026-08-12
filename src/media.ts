import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_MEDIA_PATTERN, publicMediaUrl } from "@/src/media-url";
export { PUBLIC_MEDIA_PATTERN, publicMediaUrl } from "@/src/media-url";

const extensionTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export async function availablePublicMediaUrl(value: string | null | undefined) {
  const url = publicMediaUrl(value);
  if (!url) return null;
  const filename = url.slice("/media/".length);
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_ROOT ?? path.join(process.cwd(), "storage", "uploads"));
  try { return (await stat(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ root, filename))).isFile() ? url : null; }
  catch { return null; }
}

export async function readPublicImage(filename: string) {
  const match = PUBLIC_MEDIA_PATTERN.exec(filename);
  if (!match) return null;
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_ROOT ?? path.join(process.cwd(), "storage", "uploads"));
  try { return { bytes: await readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ root, filename)), contentType: extensionTypes[match[2].toLowerCase()] }; }
  catch { return null; }
}
