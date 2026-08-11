import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PgDialect } from "drizzle-orm/pg-core";
import { canUsePermission } from "../src/auth/authorization";
import { canPermanentlyDeletePost, resolvePostDeletionMutation } from "../src/blog/post-deletion";
import { postListPredicate } from "../src/blog/post-list";

const dialect = new PgDialect();
const sqlFor = (filter: "all" | "draft" | "deleted") => dialect.sqlToQuery(postListPredicate(filter)!.getSQL()).sql.toLowerCase();
const allSql = sqlFor("all");
const draftSql = sqlFor("draft");
const deletedSql = sqlFor("deleted");
assert(allSql.includes("deleted_at") && allSql.includes("is null") && !allSql.includes("status"));
assert(draftSql.includes("deleted_at") && draftSql.includes("is null") && draftSql.includes("status"));
assert(deletedSql.includes("deleted_at") && deletedSql.includes("is not null"));

const now = new Date("2026-08-12T12:00:00.000Z");
const publishedAt = new Date("2026-08-01T08:00:00.000Z");
const scheduledFor = new Date("2026-08-20T08:00:00.000Z");
for (const original of [
  { status: "draft", publishedAt: null, scheduledFor: null, unpublishedAt: null, deletedAt: null },
  { status: "published", publishedAt, scheduledFor: null, unpublishedAt: null, deletedAt: null },
  { status: "scheduled", publishedAt: null, scheduledFor, unpublishedAt: null, deletedAt: null },
  { status: "unpublished", publishedAt: null, scheduledFor: null, unpublishedAt: publishedAt, deletedAt: null },
]) {
  const softDelete = resolvePostDeletionMutation("soft-delete", original.deletedAt, now);
  assert.equal(softDelete.kind, "update");
  assert.deepEqual(Object.keys(softDelete.kind === "update" ? softDelete.values : {}), ["deletedAt"]);
  const deleted = { ...original, ...(softDelete.kind === "update" ? softDelete.values : {}) };
  assert.equal(deleted.status, original.status);
  assert.equal(deleted.publishedAt, original.publishedAt);
  assert.equal(deleted.scheduledFor, original.scheduledFor);
  assert.equal(deleted.unpublishedAt, original.unpublishedAt);

  const restore = resolvePostDeletionMutation("restore", deleted.deletedAt, new Date("2026-08-13T12:00:00.000Z"));
  assert.equal(restore.kind, "update");
  const restored = { ...deleted, ...(restore.kind === "update" ? restore.values : {}) };
  assert.equal(restored.deletedAt, null);
  assert.equal(restored.status, original.status);
  assert.equal(restored.publishedAt, original.publishedAt);
  assert.equal(restored.scheduledFor, original.scheduledFor);
  assert.equal(restored.unpublishedAt, original.unpublishedAt);
}

assert.equal(resolvePostDeletionMutation("soft-delete", now, now).kind, "stale", "a repeated soft delete must be refused");
assert.equal(resolvePostDeletionMutation("restore", null, now).kind, "stale", "a repeated restore must be refused");
assert.equal(resolvePostDeletionMutation("permanent-delete", null, now).kind, "stale", "an active post must not be physically deleted");
assert.equal(resolvePostDeletionMutation("permanent-delete", now, now).kind, "delete", "a deleted post may be physically deleted");

const master = { isMasterAdmin: true, permissionKeys: new Set<string>() };
const authorizedStaff = { isMasterAdmin: false, permissionKeys: new Set(["blog.posts.delete", "blog.posts.restore", "blog.posts.view_deleted"]) };
const unauthorizedStaff = { isMasterAdmin: false, permissionKeys: new Set<string>() };
const allPermissionStaff = { isMasterAdmin: false, permissionKeys: new Set(["blog.posts.delete", "blog.posts.restore", "blog.posts.view_deleted", "blog.posts.permanently_delete"]) };
assert(canUsePermission(master, "blog.posts.delete"));
assert(canUsePermission(authorizedStaff, "blog.posts.delete"));
assert(!canUsePermission(unauthorizedStaff, "blog.posts.delete"));
assert(canUsePermission(authorizedStaff, "blog.posts.restore"));
assert(!canUsePermission(unauthorizedStaff, "blog.posts.restore"));
assert(canPermanentlyDeletePost(master));
assert(!canPermanentlyDeletePost(allPermissionStaff), "ordinary permissions must never grant permanent deletion");

const actionSource = readFileSync(new URL("../app/(admin)/blog/actions.ts", import.meta.url), "utf8");
assert(actionSource.includes('.for("update")'), "lifecycle mutations must lock the selected row");
assert(actionSource.indexOf('action: "blog.post.permanently_deleted"') < actionSource.indexOf("await tx.delete(posts)"), "durable audit entry must be inserted before deletion");
assert(!actionSource.includes("deleteUpload") && !actionSource.includes("unlink"), "post deletion must not remove media files");

console.log("PASS: active/draft/deleted predicates, lifecycle preservation, stale actions, permission rules, Master-Admin-only permanent deletion, durable logging order, and media retention verified.");
