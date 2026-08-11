import assert from "node:assert/strict";
import { parseAndNormalizeContent } from "../src/blog/content";
import { parsePostFormData } from "../src/blog/post-input";

const content = JSON.stringify({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "One simple paragraph" }] }],
});

for (const intent of ["draft", "published", "scheduled", "unpublished"] as const) {
  const formData = new FormData();
  formData.set("title", "Test Draft");
  formData.set("slug", "test-draft");
  formData.set("shortDescription", "Test draft description");
  formData.set("content", content);
  formData.set("intent", intent);
  if (intent === "scheduled") formData.set("scheduledLocal", "2099-01-01T12:00");

  // Deliberately omit categoryId, matching browser FormData from the former disabled select.
  const parsed = parsePostFormData(formData);
  assert.equal(parsed.success, true, `${intent} payload should parse`);
  if (parsed.success) {
    assert.equal(parsed.data.intent, intent, `${intent} must reach server parsing unchanged`);
    assert.equal(parsed.data.categoryId, "", "omitted optional category must normalize to empty");
  }
}

const normalized = parseAndNormalizeContent(content);
assert.equal(normalized.type, "doc", "TipTap JSON must reach structured-content normalization");
console.log("PASS: all four intents, omitted category, and TipTap JSON parse correctly.");
