import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canUsePermission } from "../src/auth/authorization";
import { canCreateChild, categoryDeleteBlocker, hierarchicalCategoryOptions, parseCategoryInput } from "../src/categories/category";

const parentId = "00000000-0000-4000-8000-000000000001";
const childId = "00000000-0000-4000-8000-000000000002";
const otherChildId = "00000000-0000-4000-8000-000000000003";

const parentForm = new FormData();
parentForm.set("name", "Gujarati Food");
parentForm.set("slug", "Gujarati Food");
parentForm.set("description", "Regional food");
const parsedParent = parseCategoryInput(parentForm);
assert(parsedParent.success && parsedParent.data.slug === "gujarati-food");
assert(canCreateChild({ id: parentId, parentId: null }, parentId), "a Parent Category must accept a child");
assert(!canCreateChild({ id: childId, parentId }, childId), "a Child Category must reject a child");
assert(!canCreateChild({ id: childId, parentId }, parentId), "the route parent ID must match the locked category");
assert(!canCreateChild({ id: parentId, parentId: parentId }, parentId), "self-parent state must be rejected by application validation");

const options = hierarchicalCategoryOptions([
  { id: childId, name: "Street Food", parentId },
  { id: parentId, name: "Food", parentId: null },
  { id: otherChildId, name: "Traditional Food", parentId },
]);
assert.deepEqual(options.map(({ id, level }) => [id, level]), [[parentId, 0], [childId, 1], [otherChildId, 1]]);
assert(options[1].label.startsWith("↳"));

assert.equal(categoryDeleteBlocker(true, false), "This category contains child categories. Delete or resolve them first.");
assert.match(categoryDeleteBlocker(false, true) ?? "", /referenced by posts/);
assert.equal(categoryDeleteBlocker(false, false), null, "an unused Child Category may be deleted");

const master = { isMasterAdmin: true, permissionKeys: new Set<string>() };
const permissionless = { isMasterAdmin: false, permissionKeys: new Set<string>() };
for (const permission of ["categories.view", "categories.create", "categories.edit", "categories.delete"]) {
  assert(canUsePermission(master, permission));
  assert(!canUsePermission(permissionless, permission));
}

const migration = readFileSync(new URL("../drizzle/0002_category_hierarchy.sql", import.meta.url), "utf8");
assert(migration.includes('ADD COLUMN "parent_id" uuid'));
assert(migration.includes('ADD COLUMN "description" text'));
assert(migration.includes("categories_not_self_parent_chk"));
assert(migration.includes("ON DELETE restrict"));
const actionSource = readFileSync(new URL("../app/(admin)/categories/actions.ts", import.meta.url), "utf8");
assert(actionSource.includes("SLUG_DUPLICATE") && actionSource.includes('code === "23505"'));
assert(actionSource.includes("eq(posts.categoryId, category.id)"), "all post references, including deleted posts, must block deletion");
assert(actionSource.includes('.for("update")'));

console.log("PASS: parent/child rules, self/third-level rejection, global slug handling, delete blockers, hierarchical Blog options, permissions, locking, and additive migration verified.");
