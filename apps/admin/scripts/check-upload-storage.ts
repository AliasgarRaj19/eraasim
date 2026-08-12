import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { MAX_IMAGE_BYTES, saveImage } from "../src/uploads/storage";

function imageBytes(type: string, size: number) {
  const bytes = Buffer.alloc(size);
  if (type === "image/jpeg") bytes.set([0xff, 0xd8, 0xff]);
  else if (type === "image/png") bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  else if (type === "image/gif") bytes.write("GIF89a", 0, "ascii");
  else { bytes.write("RIFF", 0, "ascii"); bytes.write("WEBP", 8, "ascii"); }
  return bytes;
}

async function main() {
  const root = await mkdtemp(path.join(tmpdir(), "eraasim-upload-regression-"));
  process.env.UPLOAD_ROOT = root;
  try {
    const cases = [
      ["image/jpeg", "photo.jpg", 750 * 1024, "jpg"],
      ["image/png", "background.png", 3 * 1024 * 1024, "png"],
      ["image/gif", "animated.gif", 3 * 1024 * 1024, "gif"],
      ["image/webp", "hero.webp", 3 * 1024 * 1024, "webp"],
      ["image/png", "boundary.png", MAX_IMAGE_BYTES, "png"],
    ] as const;
    for (const [type, name, size, extension] of cases) {
      const original = imageBytes(type, size);
      const result = await saveImage(new File([original], name, { type }));
      assert.match(result.filename, new RegExp(`^[0-9a-f-]{36}\\.${extension}$`, "i"));
      assert.equal(result.url, `/api/uploads/${result.filename}`);
      assert.deepEqual(await readFile(path.join(root, result.filename)), original, `${type} must be stored unchanged`);
    }
    await assert.rejects(() => saveImage(new File([imageBytes("image/png", MAX_IMAGE_BYTES + 1)], "large.png", { type: "image/png" })), /no larger than 5 MB/);
    await assert.rejects(() => saveImage(new File([Buffer.alloc(3 * 1024 * 1024)], "fake.png", { type: "image/png" })), /does not match/);
    await assert.rejects(() => saveImage(new File([Buffer.from("text")], "fake.jpg", { type: "text/plain" })), /JPEG, PNG, WebP, or GIF/);
    console.log("PASS: ~750 KB JPEG, ~3 MB PNG/GIF/WebP, and exact 5 MiB images accepted unchanged; 5 MiB + 1 byte, spoofed signatures, and unsupported MIME rejected.");
  } finally { await rm(root, { recursive: true, force: true }); }
}
void main();
