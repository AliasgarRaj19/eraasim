import assert from "node:assert/strict";
import { uploadImageWith } from "../components/image-upload";

async function main() {
const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "hero.jpg", { type: "image/jpeg" });
let request: { input?: RequestInfo | URL; init?: RequestInit } = {};
const success = await uploadImageWith(async (input, init) => {
  request = { input, init };
  return new Response(JSON.stringify({ url: "/api/uploads/123e4567-e89b-42d3-a456-426614174000.jpg" }), { status: 201, headers: { "content-type": "application/json" } });
}, file);
assert.equal(success, "/api/uploads/123e4567-e89b-42d3-a456-426614174000.jpg");
assert.equal(request.input, "/api/uploads"); assert.equal(request.init?.method, "POST"); assert(request.init?.body instanceof FormData); assert.equal((request.init.body as FormData).get("image"), file);

await assert.rejects(() => uploadImageWith(async () => new Response("<html><h1>Payload too large</h1></html>", { status: 413, headers: { "content-type": "text/html" } }), file), /no larger than 5 MB/);
await assert.rejects(() => uploadImageWith(async () => new Response("<html>server stack</html>", { status: 500, headers: { "content-type": "text/html" } }), file), /encountered an error/);
await assert.rejects(() => uploadImageWith(async () => new Response("not-json", { status: 200, headers: { "content-type": "text/plain" } }), file), /invalid response/);
await assert.rejects(() => uploadImageWith(async () => new Response("{bad", { status: 200, headers: { "content-type": "application/json" } }), file), /invalid response/);
await assert.rejects(() => uploadImageWith(async () => new Response(JSON.stringify({ error: "Select an image to upload." }), { status: 400, headers: { "content-type": "application/json" } }), file), /Select an image/);
console.log("PASS: upload uses POST image FormData at /api/uploads; JSON succeeds; HTML, malformed, non-JSON, and status errors produce safe messages.");
}
void main();
