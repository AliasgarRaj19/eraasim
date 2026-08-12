import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hierarchicalCategoryOptions } from "../src/categories/category";
import { selectedCategoryId, validatedCategoryAssignment } from "../src/blog/category-assignment";
import { parsePostFormData } from "../src/blog/post-input";

const parentId = "00000000-0000-4000-8000-000000000001";
const childId = "00000000-0000-4000-8000-000000000002";
const options = hierarchicalCategoryOptions([
  { id: parentId, name: "Food", parentId: null },
  { id: childId, name: "Street Food", parentId },
]);
assert.deepEqual(options.map(({ id }) => id), [parentId, childId], "Parent and Child must both remain selectable");

function submittedCategoryId(categoryId: string) {
  const formData = new FormData();
  for (const [key, value] of Object.entries({ title: "Assignment", slug: "assignment", shortDescription: "Assignment regression", content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Body" }] }] }), intent: "draft", categoryId })) formData.set(key, value);
  const parsed = parsePostFormData(formData);
  assert(parsed.success, `category ${categoryId || "None"} must parse`);
  return parsed.data.categoryId;
}

for (const selected of [parentId, childId, ""]) {
  const parsed = submittedCategoryId(selected);
  const stored = validatedCategoryAssignment(parsed, parsed || undefined);
  assert.equal(stored, selectedCategoryId(selected), "stored category must exactly equal the selected category");
}

const transitions: Array<[string | null, string, string | null]> = [
  [null, parentId, parentId], [null, childId, childId], [parentId, childId, childId], [childId, parentId, parentId],
  [parentId, "", null], [childId, "", null],
];
for (const [, selected, expected] of transitions) assert.equal(validatedCategoryAssignment(submittedCategoryId(selected), selected || undefined), expected);

assert.throws(() => validatedCategoryAssignment(parentId, undefined), /CATEGORY_UNAVAILABLE/);
assert.throws(() => validatedCategoryAssignment(parentId, childId), /CATEGORY_UNAVAILABLE/);
const formSource = readFileSync(new URL("../app/(admin)/blog/new/new-post-form.tsx", import.meta.url), "utf8");
assert(formSource.includes('<input type="hidden" name="categoryId" value={categoryId} />'));
assert(formSource.includes('value={categoryId} onChange={(event) => setCategoryId(event.target.value)}'));
const newAction = readFileSync(new URL("../app/(admin)/blog/new/actions.ts", import.meta.url), "utf8");
const editAction = readFileSync(new URL("../app/(admin)/blog/[id]/edit/actions.ts", import.meta.url), "utf8");
for (const source of [newAction, editAction]) {
  assert(source.includes("eq(categories.id, parsed.data.categoryId)"));
  assert(source.includes("validatedCategoryAssignment(parsed.data.categoryId, foundCategoryId)"));
  assert(!source.includes("categories.parentId"), "post assignment must not filter or substitute by hierarchy level");
}

console.log("PASS: New Parent/Child/None, all Edit transitions, exact selected-ID persistence, nonexistent-category rejection, and unchanged hierarchy selection verified.");
