import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

const extensionTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_ROOT ?? path.join(process.cwd(), "storage", "uploads"));
}

function hasExpectedSignature(bytes: Buffer, type: keyof typeof imageTypes) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/gif") return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"));
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

export async function saveImage(file: File) {
  const extension = imageTypes[file.type as keyof typeof imageTypes];
  if (!extension) throw new Error("Upload a JPEG, PNG, WebP, or GIF image.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("Images must be no larger than 5 MB.");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedSignature(bytes, file.type as keyof typeof imageTypes)) throw new Error("The file content does not match its image type.");

  const filename = `${randomUUID()}.${extension}`;
  const root = uploadRoot();
  await mkdir(root, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ root, filename), bytes, { flag: "wx", mode: 0o640 });
  return { filename, url: `/api/uploads/${filename}` };
}

export async function normalizeAboutImage(bytes: Buffer) {
  return sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 }).rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 }).toBuffer({ resolveWithObject: true });
}

export async function saveAboutImage(file: File) {
  if (file.type === "image/gif") throw new Error("About images support JPEG, PNG, or WebP. Animated GIF is not supported.");
  const extension = imageTypes[file.type as keyof typeof imageTypes];
  if (!extension || extension === "gif") throw new Error("Upload a JPEG, PNG, or WebP image.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("Images must be no larger than 5 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedSignature(input, file.type as keyof typeof imageTypes)) throw new Error("The file content does not match its image type.");
  let output: Buffer;
  try { output = (await normalizeAboutImage(input)).data; } catch { throw new Error("The image could not be safely processed."); }
  const filename = `${randomUUID()}.webp`, root = uploadRoot();
  await mkdir(root, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ root, filename), output, { flag: "wx", mode: 0o640 });
  return { filename, url: `/api/uploads/${filename}` };
}

export async function readImage(filename: string) {
  const match = /^([0-9a-f-]{36})\.(jpe?g|png|webp|gif)$/i.exec(filename);
  if (!match || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(match[1])) return null;
  const contentType = extensionTypes[match[2].toLowerCase()];
  if (!contentType) return null;
  try {
    return { bytes: await readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ uploadRoot(), filename)), contentType };
  } catch {
    return null;
  }
}
