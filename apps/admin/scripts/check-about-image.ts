import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { normalizeAboutImage } from "../src/uploads/storage";

async function normalized(width: number, height: number) {
  const input = await sharp({ create: { width, height, channels: 3, background: "#7799aa" } }).jpeg().toBuffer();
  return (await normalizeAboutImage(input)).info;
}

async function main() {
const landscape = await normalized(2400, 1200);
assert.equal(landscape.width, 1600); assert.equal(landscape.height, 800); assert.equal(landscape.format, "webp");
const portrait = await normalized(1200, 2400);
assert.equal(portrait.width, 800); assert.equal(portrait.height, 1600);
const small = await normalized(600, 400);
assert.equal(small.width, 600); assert.equal(small.height, 400);
const orientedInput = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#7799aa" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
const oriented = (await normalizeAboutImage(orientedInput)).info;
assert.equal(oriented.width, 800); assert.equal(oriented.height, 1200);
await assert.rejects(() => normalizeAboutImage(Buffer.from("not an image")));
const storage = readFileSync(new URL("../src/uploads/storage.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/uploads/about/route.ts", import.meta.url), "utf8");
const form = readFileSync(new URL("../components/about-page-form.tsx", import.meta.url), "utf8");
assert.match(storage, /randomUUID\(\).*\.webp/); assert.match(storage, /hasExpectedSignature/); assert.match(storage, /withoutEnlargement: true/);
assert.match(route, /pages\.about\.edit/); assert.match(form, /Maximum 5 MB/); assert.match(form, /maximum 1600 px long edge/); assert.doesNotMatch(form, /image\/gif/);
console.log("About image normalization regression passed.");
}
void main();
